/**
 * © JamvanHax0r — Fiony Bot (adapted for Keith base)
 * faceswap.js — Face Swap engine.
 */

const { keith } = require('../commandHandler');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

//========================================================================================================================
// PROXY + BUFFER HELPERS
//========================================================================================================================
async function getProxy() {
  try {
    const { data: proxies } = await axios.get('https://proxy.jhx.my.id/jh-proxy');
    if (!Array.isArray(proxies) || !proxies.length) return null;

    const picked = proxies[Math.floor(Math.random() * proxies.length)];
    const [host, port, username, password] = picked.split(':');

    return {
      protocol: 'http',
      host,
      port: parseInt(port),
      auth: { username, password }
    };
  } catch {
    return null; // silently fall back to no proxy
  }
}

async function toBuffer(input, proxy) {
  // Already a Buffer
  if (Buffer.isBuffer(input)) return input;

  // Uint8Array
  if (input instanceof Uint8Array) return Buffer.from(input);

  // Remote URL
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
    const res = await axios.get(input, {
      responseType: 'arraybuffer',
      ...(proxy ? { proxy } : {}),
      timeout: 60000
    });
    return Buffer.from(res.data);
  }

  // Local file path
  if (typeof input === 'string' && fs.existsSync(input)) {
    return await fs.readFile(input);
  }

  throw new Error('Input image invalid — expected Buffer, URL, or valid file path');
}

//========================================================================================================================
// FACESWAP ENGINE
//========================================================================================================================
async function faceSwap({ target, swap } = {}) {
  const proxy = await getProxy();

  const [targetBuf, swapBuf] = await Promise.all([
    toBuffer(target, proxy),
    toBuffer(swap, proxy)
  ]);

  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);

  const form = new FormData();

  form.append('target_image', targetBuf, {
    filename: `Fiony_target_${rand1}.jpg`,
    contentType: 'image/jpeg'
  });

  form.append('swap_image', swapBuf, {
    filename: `Fiony_swap_${rand2}.png`,
    contentType: 'image/png'
  });

  form.append('version', '2');

  const headers = {
    ...form.getHeaders(),
    'Product-Code': '067003',
    'Product-Serial': crypto.randomBytes(16).toString('hex'),
    source: 'ai_face_vary',
    Authorization: ''
  };

  const axiosOpts = {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    ...(proxy ? { proxy } : {})
  };

  const { data: createRes } = await axios.post(
    'https://api.remaker.ai/api/pai/v3/ai-facevary/appapi/create-job',
    form,
    axiosOpts
  );

  if (createRes.code !== 100000 || !createRes.result?.job_id) {
    throw new Error(`Create job failed: ${JSON.stringify(createRes)}`);
  }

  const jobId = createRes.result.job_id;
  let finalResult = null;

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000));

    const { data: pollRes } = await axios.get(
      `https://api.remaker.ai/api/pai/v3/ai-facevary/appapi/get-job/${jobId}`,
      { headers, ...(proxy ? { proxy } : {}) }
    );

    if (pollRes.code === 300006) continue; // still processing

    if (pollRes.code === 100000 && pollRes.result?.output_image_url) {
      const out = pollRes.result.output_image_url;
      finalResult = Array.isArray(out) ? out[0] : out;
      break;
    }

    throw new Error(`Poll error: ${JSON.stringify(pollRes)}`);
  }

  if (!finalResult) throw new Error('Timeout waiting for render to complete.');

  return { success: true, resultUrl: finalResult };
}

//========================================================================================================================
// MEDIA HELPERS
//========================================================================================================================
async function saveQuotedMedia(client, node, ext = 'jpg') {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  await fs.ensureDir(tmpDir);
  const base = path.join(tmpDir, `faceswap-${Date.now()}`);
  const saved = await client.downloadAndSaveMediaMessage(node, base);
  const finalPath = saved.endsWith(`.${ext}`) ? saved : `${saved}.${ext}`;
  if (finalPath !== saved && fs.existsSync(saved)) {
    await fs.move(saved, finalPath, { overwrite: true });
  }
  return finalPath;
}

async function downloadUrlToTemp(url, ext = 'jpg') {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  await fs.ensureDir(tmpDir);
  const filePath = path.join(tmpDir, `faceswap-url-${Date.now()}.${ext}`);
  const buf = (await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })).data;
  await fs.writeFile(filePath, Buffer.from(buf));
  return filePath;
}

async function cleanupFiles(paths = []) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try { await fs.unlink(p); } catch {}
    }
  }
}

//========================================================================================================================
// COMMAND: .faceswapv2 <swap_image_url>
// Reply to the TARGET image; provide the SWAP (face) image via URL.
//========================================================================================================================
keith({
  pattern: 'faceswap',
  aliases: ['fswap', 'facevary', 'remaker'],
  category: 'Ai',
  description: 'Face swap using Remaker AI (reply to target image, provide swap face URL)',
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, q } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply(
      '📌 Reply to the *target image* with:\n' +
      '`.faceswapv2 <swap_face_url>`\n\n' +
      'Example: `.faceswapv2 https://example.com/face.jpg`'
    );
  }

  if (!q || !/^https?:\/\//i.test(q.trim())) {
    return reply('❌ Provide a valid swap face image URL.');
  }

  let targetPath;
  let swapPath;
  try {
    await reply('🔄 Running face swap...');

    targetPath = await saveQuotedMedia(client, quoted.imageMessage, 'jpg');
    swapPath = await downloadUrlToTemp(q.trim(), 'jpg');

    const { resultUrl } = await faceSwap({ target: targetPath, swap: swapPath });
    if (!resultUrl) return reply('❌ Face swap returned no result.');

    await client.sendMessage(from, {
      image: { url: resultUrl },
      
    }, { quoted: mek });

  } catch (err) {
    console.error('faceswapv2 error:', err);
    await reply(`❌ Face swap error: ${err.message}`);
  } finally {
    await cleanupFiles([targetPath, swapPath]);
  }
});
