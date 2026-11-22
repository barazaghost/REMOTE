
const { keith } = require('../commandHandler');
const https = require('https');
const fs = require('fs-extra');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');

const PROXY_API = 'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&protocol=socks5&timeout=5000';

const HEADERS = {
  Accept: '*/*',
  Origin: 'https://banana-nano.ai',
  Referer: 'https://banana-nano.ai/ai-image-editor',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
};

let PROXY_CACHE = [];

async function fetchProxies() {
  return new Promise((resolve) => {
    https.get(PROXY_API, { timeout: 10000 }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const lines = Buffer.concat(chunks).toString().split('\n').map((l) => l.trim()).filter(Boolean);
        const proxies = lines.map((l) => {
          const m = l.match(/([\d.]+):(\d+)/);
          return m ? `socks5://${m[1]}:${m[2]}` : null;
        }).filter(Boolean);
        resolve(proxies);
      });
    }).on('error', () => resolve([]));
  });
}

function buildBody(imageBuf, prompt) {
  const boundary = '----Boundary' + Date.now();
  const parts = [];
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`));
  parts.push(imageBuf);
  parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`));
  parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="output_format"\r\n\r\njpg`));
  parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="generator_slug"\r\n\r\nai-image-editor`));
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

function postBanana(body, boundary, agent) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'ibbo.ai',
      port: 443,
      path: '/api/nano-banana-lite-image-to-image',
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      timeout: 60000
    };
    if (agent) opts.agent = agent;

    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ _raw: raw.substring(0, 300), _status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function postWithProxy(body, boundary) {
  if (!PROXY_CACHE.length) PROXY_CACHE = await fetchProxies();

  let result = null;

  if (PROXY_CACHE.length) {
    const proxy = PROXY_CACHE[Math.floor(Math.random() * PROXY_CACHE.length)];
    try {
      const agent = new SocksProxyAgent(proxy);
      result = await postBanana(body, boundary, agent);
    } catch {}
  }

  if (!result || result._raw) {
    try {
      result = await postBanana(body, boundary);
    } catch (err) {
      throw err;
    }
  }

  return result;
}

async function saveQuotedMedia(client, node) {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  await fs.ensureDir(tmpDir);
  const saved = await client.downloadAndSaveMediaMessage(node, path.join(tmpDir, `nano-${Date.now()}`));
  return saved.endsWith('.jpg') ? saved : `${saved}.jpg`;
}

async function downloadUrl(url, outPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadUrl(res.headers.location, outPath).then(resolve).catch(reject);
      }
      const ws = fs.createWriteStream(outPath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(outPath); });
    }).on('error', reject);
  });
}

keith({
  pattern: 'imageedit',
  aliases: ['nano', 'nanoedit', 'bananaedit'],
  category: 'Ai',
  description: 'Edit an image with NanoBanana AI',
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, q } = conText;

  if (!q) return reply('📌 Usage: `.imageedit <prompt>` (reply to image)');

  let imagePath;
  try {
    const urlMatch = q.match(/(https?:\/\/\S+)\s*$/i);
    const sourceUrl = urlMatch ? urlMatch[1] : null;
    const prompt = urlMatch ? q.slice(0, urlMatch.index).trim() : q;

    if (!prompt) return reply('❌ Provide a prompt.');

    if (sourceUrl) {
      const tmpDir = path.join(__dirname, '..', 'tmp');
      await fs.ensureDir(tmpDir);
      imagePath = path.join(tmpDir, `nano-url-${Date.now()}.jpg`);
      await downloadUrl(sourceUrl, imagePath);
    } else if (quotedMsg?.imageMessage) {
      imagePath = await saveQuotedMedia(client, quoted.imageMessage);
    } else {
      return reply('❌ Reply to an image, or provide an image URL.');
    }

    await reply('🍌 Editing image...');

    const imgBuf = await fs.readFile(imagePath);
    const { boundary, body } = buildBody(imgBuf, prompt);
    const result = await postWithProxy(body, boundary);

    if (!result?.success || !result?.data?.image_url) {
      throw new Error(result?._raw || result?.message || 'Failed');
    }

    await client.sendMessage(from, {
      image: { url: result.data.image_url },
      caption: `🍌 *${prompt}*`
    }, { quoted: mek });

  } catch (err) {
    console.error('imageedit error:', err);
    await reply(`❌ ${err.message}`);
  } finally {
    if (imagePath && fs.existsSync(imagePath)) {
      try { await fs.unlink(imagePath); } catch {}
    }
  }
});
