const path = require('path');
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
