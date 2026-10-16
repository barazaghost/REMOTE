const path = require('path');
const fs = require('fs');
const Module = require('module');
const { execFile } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { keith, commands } = require('../commandHandler');

const ROOT = path.join(__dirname, '..');
const MAX_CODE_BYTES = 1024 * 1024;
const MAX_INSTALLS = 4;

const runLoaded = new Set();

const namesOf = (cmd) => [cmd?.pattern, ...(Array.isArray(cmd?.aliases) ? cmd.aliases : [])].filter(Boolean);

function removeCommands(list) {
  for (const c of list) {
    const i = commands.indexOf(c);
    if (i !== -1) commands.splice(i, 1);
  }
}

function cleanCode(text) {
  let code = String(text || '').replace(/^\uFEFF/, '').trim();
  const fence = code.match(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/);
  if (fence) code = fence[1].trim();
  return code;
}

async function readCodeFromReply(quoted) {
  const HELP = 'Reply to a message that contains the plugin code (text or a .js file).';
  if (!quoted || Array.isArray(quoted) || !Object.keys(quoted).length) throw new Error(HELP);

  let cur = quoted;
  for (let i = 0; i < 10; i++) {
    const next = cur.ephemeralMessage?.message || cur.viewOnceMessage?.message
      || cur.viewOnceMessageV2?.message || cur.documentWithCaptionMessage?.message;
    if (!next) break;
    cur = next;
  }

  const text = cur.conversation || cur.extendedTextMessage?.text;
  if (typeof text === 'string' && text.trim()) return cleanCode(text);

  const doc = cur.documentMessage;
  if (doc) {
    const fileName = doc.fileName || 'file.js';
    if (!/\.c?js$/i.test(fileName) && !/javascript|ecmascript/i.test(doc.mimetype || '')) {
      throw new Error(`"${fileName}" is not a .js file.`);
    }
    const declared = Number(doc.fileLength?.toString?.() ?? doc.fileLength ?? 0);
    if (declared > MAX_CODE_BYTES) throw new Error(`"${fileName}" is too large (max 1 MB).`);

    const stream = await downloadContentFromMessage(doc, 'document');
    const chunks = [];
    let total = 0;
    for await (const chunk of stream) {
      total += chunk.length;
      if (total > MAX_CODE_BYTES) throw new Error(`"${fileName}" is too large (max 1 MB).`);
      chunks.push(chunk);
    }
    return cleanCode(Buffer.concat(chunks).toString('utf8'));
  }

  throw new Error(HELP);
}

function compile(code, filename) {
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(code, filename);
}

function missingPackage(err) {
  if (err?.code !== 'MODULE_NOT_FOUND') return null;
  const m = /Cannot find module '([^']+)'/.exec(err.message || '');
  if (!m) return null;
  const spec = m[1];
  if (spec.startsWith('.') || path.isAbsolute(spec)) return null;
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
  if (name.length > 214 || !/^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/.test(name)) return null;
  if (Module.builtinModules.includes(name)) return null;
  return name;
}

function npmInstall(pkg) {
  return new Promise((resolve, reject) => {
    execFile('npm', ['install', pkg, '--no-audit', '--no-fund', '--loglevel=error'],
      { cwd: ROOT, timeout: 180000, maxBuffer: 5 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const detail = String(stderr || err.message).trim().split('\n').slice(-4).join('\n');
          return reject(new Error(`npm install ${pkg} failed:\n${detail}`));
        }
        resolve();
      });
  });
}

async function loadCode(code, filename, onInstall) {
  const installed = [];
  for (;;) {
    const before = new Set(commands);
    try {
      compile(code, filename);
      return { added: commands.filter(c => !before.has(c)), installed };
    } catch (err) {
      removeCommands(commands.filter(c => !before.has(c)));
      const pkg = missingPackage(err);
      if (pkg && !installed.includes(pkg) && installed.length < MAX_INSTALLS) {
        await onInstall(pkg);
        await npmInstall(pkg);
        installed.push(pkg);
        continue;
      }
      throw err;
    }
  }
}

function describeError(err, filename) {
  const base = path.basename(filename).replace(/\./g, '\\.');
  const m = String(err?.stack || '').match(new RegExp(`${base}:(\\d+)`));
  const line = m ? ` (line ${m[1]})` : '';
  return `${err?.name || 'Error'}: ${String(err?.message || err).split('\n')[0]}${line}`;
}

// ---- box used by .run ----
const box = (title, msg) => `*${title}*\n\n${String(msg)}`;

keith({
  pattern: "run",
  aliases: ["runplugin"],
  description: "Reply to a Keith-MD plugin (text or .js file) to execute it and see its response (Owner only)",
  category: "dev",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, quoted, reply, isSuperUser, prefix } = conText;
  const fmt = (msg) => box('RUN', msg);

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  let code;
  try {
    code = await readCodeFromReply(quoted);
    if (!code) throw new Error('The message is empty.');
  } catch (e) {
    return reply(fmt(`${e.message}\n\nExample: reply to the plugin with ${prefix}run`));
  }

  const filename = path.join(__dirname, `run_${Date.now().toString(36)}.js`);

  let result;
  try {
    result = await loadCode(code, filename, (pkg) => reply(fmt(`📦 Installing ${pkg}...`)));
  } catch (e) {
    return reply(fmt('❌ ' + (e.message?.startsWith('npm install') ? e.message : describeError(e, filename))));
  }

  const { added, installed } = result;
  const pkgNote = installed.length ? `\n📦 Installed: ${installed.join(', ')}` : '';

  if (!added.length) {
    return reply(fmt('Code ran, but it did not register any command.' + pkgNote));
  }

  const newNames = new Set(added.flatMap(namesOf));
  const overlapping = commands.filter(c => !added.includes(c) && namesOf(c).some(n => newNames.has(n)));
  const protectedCmds = overlapping.filter(c => !runLoaded.has(c));

  let note = '';
  if (protectedCmds.length) {
    removeCommands(added);
    const clash = [...new Set(protectedCmds.flatMap(namesOf).filter(n => newNames.has(n)))].join(', ');
    note = `\nℹ️ *${clash}* is already a command, so I ran your version once without replacing it.`;
  } else {
    removeCommands(overlapping);
    added.forEach(c => runLoaded.add(c));
  }

  const target = added.find(c => c.pattern && typeof c.function === 'function');
  if (!target) {
    return reply(fmt('Loaded, but it has no runnable command.' + pkgNote));
  }

  const others = added.filter(c => c !== target && c.pattern).map(c => `${prefix}${c.pattern}`);
  const aliases = Array.isArray(target.aliases) && target.aliases.length ? ` (${target.aliases.join(', ')})` : '';
  const kept = protectedCmds.length ? '' : `\n✅ Stays loaded until restart - use ${prefix}${target.pattern} anytime.`;

  await client.sendMessage(from, {
    text: fmt(
      `⚡ Running *${prefix}${target.pattern}*${aliases}` +
      (others.length ? `\n➕ Also loaded: ${others.join(', ')}` : '') +
      pkgNote + note + kept
    )
  }, { quoted: mek });

  const argText = (q || '').trim();
  const runCtx = { ...conText, q: argText, arg: argText ? argText.split(/\s+/) : [] };

  try {
    await target.function(from, client, runCtx);
  } catch (error) {
    await client.sendMessage(from, { text: `😡Command failed: ${error.message}` }, { quoted: mek });
  }
});

// ==================== CRM SECTION ====================

const STRUCT_KEYS = [
  'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension',
  'documentWithCaptionMessage', 'editedMessage', 'deviceSentMessage', 'futureProofMessage',
  'commentMessage', 'botInvokeMessage', 'botForwardedMessage', 'associatedChildMessage'
];

function unwrap(msg) {
  let cur = msg;
  let guard = 0;
  while (cur && guard < 25) {
    const k = STRUCT_KEYS.find((key) => cur[key]);
    if (!k) break;
    cur = cur[k].message || cur[k];
    guard++;
  }
  return cur;
}

function encode(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'bigint') return Number(val);
  if (Buffer.isBuffer(val) || val instanceof Uint8Array) return { __b64__: Buffer.from(val).toString('base64') };
  if (Array.isArray(val)) return val.map(encode);
  if (typeof val === 'object') {
    if (val.type === 'Buffer' && Array.isArray(val.data)) return { __b64__: Buffer.from(val.data).toString('base64') };
    if (val.constructor?.name === 'Long') return val.toNumber?.() ?? val.low ?? 0;
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = encode(v);
    return out;
  }
  return val;
}

function revive(x) {
  if (x === null || x === undefined) return x;
  if (Array.isArray(x)) return x.map(revive);
  if (typeof x === 'object') {
    if (typeof x.__b64__ === 'string') return Buffer.from(x.__b64__, 'base64');
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, revive(v)]));
  }
  return x;
}

const isUsable = (r) => r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length > 0;

function getRawQuoted({ quoted, mek, store, from, quotedKey }) {
  const sources = [
    () => quoted,
    () => mek?.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    () => store?.loadMessage?.(from, quotedKey)?.message
  ];
  for (const fn of sources) {
    try {
      const r = fn();
      if (isUsable(r)) return r;
    } catch {}
  }
  return null;
}

const buildCapture = (raw) => ({ message: encode(unwrap(raw) || raw) });

function buildSnippet(capture) {
  return (
    '(async () => {\n' +
    '  const capture = ' + JSON.stringify(capture, null, 2) + ';\n' +
    '  const revive = ' + revive.toString() + ';\n' +
    '  await client.relayMessage(from, revive(capture.message), {});\n' +
    "  return '✅';\n" +
    '})()'
  );
}

function buildPlugin(capture, pattern) {
  return (
    "const { keith } = require('../commandHandler');\n\n" +
    'const capture = ' + JSON.stringify(capture, null, 2) + ';\n' +
    'const revive = ' + revive.toString() + ';\n\n' +
    'keith({\n' +
    '  pattern: ' + JSON.stringify(pattern) + ',\n' +
    '  category: "Owner",\n' +
    '  description: "Replays a captured message",\n' +
    '  filename: __filename\n' +
    '}, async (from, client, conText) => {\n' +
    '  await client.relayMessage(from, revive(capture.message), {});\n' +
    '});\n'
  );
}

// ---- renamed to cbox to avoid clash with .run's box ----
const cbox = (title, msg) => `*${title}*\n\n${String(msg)}`;

async function sendRichCode(client, jid, introText, code, language = 'javascript') {
  const responseId = Math.random().toString(36).substring(2);
  const encodedData = Buffer.from(JSON.stringify({
    response_id: responseId,
    sections: [
      { view_model: { primitive: { text: introText, __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } },
      { view_model: { primitive: { language, code_blocks: [{ content: code, type: 'DEFAULT' }], __typename: 'GenAICodeUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }
    ]
  })).toString('base64');

  const content = {
    messageContextInfo: {
      threadId: [],
      deviceListMetadata: { senderKeyIndexes: [], recipientKeyIndexes: [] },
      deviceListMetadataVersion: 2,
      botMetadata: { pluginMetadata: {}, richResponseSourcesMetadata: { sources: [] } }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          submessages: [
            { messageType: 2, messageText: introText },
            { messageType: 3, codeMetadata: { codeLanguage: language, codeBlocks: [{ highlightType: 0, codeContent: code }] } }
          ],
          messageType: 1,
          unifiedResponse: { data: encodedData },
          contextInfo: { mentionedJid: [], groupMentions: [], statusAttributions: [], forwardingScore: 743, isForwarded: true, forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' }, forwardOrigin: 4 }
        }
      }
    }
  };
  await client.relayMessage(jid, content, {});
}

keith({
  pattern: "crm",
  description: "Compile a replied message into a replayable .js snippet (Owner only)",
  category: "dev",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedKey, store, reply, isSuperUser } = conText;
  const fmt = (msg) => cbox('CRM', msg);

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const raw = getRawQuoted({ quoted, mek, store, from, quotedKey });
  if (!raw) {
    return reply(fmt('Reply to a message, button or interactive media to compile it.'));
  }

  try {
    const snippet = buildSnippet(buildCapture(raw));
    const id = String(quotedKey || Date.now().toString(36)).slice(-8);

    await client.sendMessage(from, {
      document: Buffer.from(snippet, 'utf8'),
      fileName: `crm_${id}.js`,
      mimetype: 'application/javascript',
      caption: fmt('Compiled ✅\nPaste the file contents after ~ to replay it.')
    }, { quoted: mek });
  } catch (e) {
    return reply(fmt('Failed to compile: ' + (e?.message || e)));
  }
});

keith({
  pattern: "crm-snip",
  aliases: ["crmsnip"],
  description: "Compile a replied message into a copyable code block (Owner only)",
  category: "dev",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedKey, store, reply, isSuperUser } = conText;
  const fmt = (msg) => cbox('CRM-SNIP', msg);

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const raw = getRawQuoted({ quoted, mek, store, from, quotedKey });
  if (!raw) {
    return reply(fmt('Reply to a message, button or interactive media to compile it.'));
  }

  try {
    const snippet = buildSnippet(buildCapture(raw));
    const intro = fmt(`Compiled snippet (${snippet.length} chars)\nCopy it and send it after ~ to replay.`);

    try {
      await sendRichCode(client, from, intro, snippet, 'javascript');
    } catch (richErr) {
      await client.sendMessage(from, {
        document: Buffer.from(snippet, 'utf8'),
        fileName: `crm_${String(quotedKey || Date.now().toString(36)).slice(-8)}.js`,
        mimetype: 'application/javascript',
        caption: intro
      }, { quoted: mek });
    }
  } catch (e) {
    return reply(fmt('Failed to compile: ' + (e?.message || e)));
  }
});

keith({
  pattern: "crm-cmd",
  aliases: ["crmcmd"],
  description: "Convert a replied message into a command plugin file (Owner only)",
  category: "dev",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, quoted, quotedKey, store, reply, isSuperUser, prefix } = conText;
  const fmt = (msg) => cbox('CRM-CMD', msg);

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const raw = getRawQuoted({ quoted, mek, store, from, quotedKey });
  if (!raw) {
    return reply(fmt(`Reply to a message first.\nExample: ${prefix}crm-cmd hello`));
  }

  const id = String(quotedKey || Date.now().toString(36)).slice(-8).toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = (q?.trim().split(/\s+/)[0] || `cmd_${id}`).toLowerCase();

  if (!/^[a-z0-9][a-z0-9_-]{0,30}$/.test(name)) {
    return reply(fmt('Invalid name. Use letters, numbers, - or _ (max 31 chars).'));
  }

  const taken = commands.some(c => c?.pattern === name || (Array.isArray(c?.aliases) && c.aliases.includes(name)));
  if (taken) {
    return reply(fmt(`A command named *${name}* already exists. Pick another name.`));
  }

  try {
    const plugin = buildPlugin(buildCapture(raw), name);

    await client.sendMessage(from, {
      document: Buffer.from(plugin, 'utf8'),
      fileName: `${name}.js`,
      mimetype: 'application/javascript',
      caption: fmt(`Converted ✅\nSave it as Cmds/${name}.js and restart the bot.\nThen use: ${prefix}${name}`)
    }, { quoted: mek });
  } catch (e) {
    return reply(fmt('Failed to convert: ' + (e?.message || e)));
  }
});

const isAntiDeleteCache = (file) => file.endsWith('.json') && file.includes('@');

keith({
  pattern: "cleartmp",
  aliases: ["clearcache", "clrtmp"],
  description: "Delete temporary files; add 'all' to also wipe the anti-delete cache (Owner only)",
  category: "dev",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;
  const fmt = (msg) => cbox('CLEARTMP', msg);

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const wipeAll = q?.trim().toLowerCase() === 'all';
  const root = path.join(__dirname, '..');
  const tmpDirs = ['tmp', 'temp'].map(d => path.join(root, d)).filter(d => fs.existsSync(d));

  if (!tmpDirs.length) {
    return reply(fmt('No tmp directories found.'));
  }

  let deleted = 0;
  let kept = 0;
  let skipped = 0;

  for (const dir of tmpDirs) {
    for (const file of fs.readdirSync(dir)) {
      const fp = path.join(dir, file);
      try {
        if (!fs.statSync(fp).isFile()) { skipped++; continue; }
        if (!wipeAll && isAntiDeleteCache(file)) { kept++; continue; }
        fs.unlinkSync(fp);
        deleted++;
      } catch {
        skipped++;
      }
    }
  }

  return reply(fmt(
    `✅ Deleted: ${deleted} file(s)\n` +
    (kept ? `🛡️ Kept: ${kept} anti-delete cache file(s) (use "cleartmp all" to remove)\n` : '') +
    `⏩ Skipped: ${skipped} item(s)`
  ));
});



keith({
  pattern: 'read',
  category: 'dev',
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, reply } = conText;

  if (!quotedMsg) {
    return reply('📌 Reply to a .js or .json file to read it.');
  }

  let node = quotedMsg;
  for (let i = 0; i < 10; i++) {
    const next = node.ephemeralMessage?.message
      || node.viewOnceMessage?.message
      || node.viewOnceMessageV2?.message
      || node.documentWithCaptionMessage?.message;
    if (!next) break;
    node = next;
  }

  const doc = node.documentMessage;
  if (!doc) return reply('❌ Reply to a document (.js or .json).');

  const name = doc.fileName || 'file';
  if (!/\.(c?js|json)$/i.test(name) && !/javascript|ecmascript|json/i.test(doc.mimetype || '')) {
    return reply('❌ Only .js and .json files are supported.');
  }

  try {
    const stream = await downloadContentFromMessage(doc, 'document');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    let text = Buffer.concat(chunks).toString('utf8');

    if (!text.trim()) return reply('❌ The file is empty.');

    text = text.replace(/^\uFEFF/, '').trim();
    const fence = text.match(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/);
    if (fence) text = fence[1].trim();

    if (text.length <= 3000) {
      return reply('```' + text + '```');
    }

    const MAX = 3500;
    const parts = [];
    for (let i = 0; i < text.length; i += MAX) parts.push(text.slice(i, i + MAX));

    for (const part of parts) {
      await reply('```' + part + '```');
    }

  } catch (err) {
    console.error('read error:', err);
    await reply(`❌ Failed to read file: ${err.message}`);
  }
});
