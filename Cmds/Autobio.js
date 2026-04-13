const { keith } = require('../commandHandler');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const mime = require('mime-types');

function getMediaType(quoted) {
  if (quoted.imageMessage) return "image";
  if (quoted.videoMessage) return "video";
  if (quoted.stickerMessage) return "sticker";
  if (quoted.audioMessage) return "audio";
  return "unknown";
}

async function saveMediaToTemp(client, quotedMedia, type) {
  const tmpDir = path.join(__dirname, "..", "tmp");
  await fs.ensureDir(tmpDir);
  const fileName = `${type}-${Date.now()}`;
  const filePath = path.join(tmpDir, fileName);
  const savedPath = await client.downloadAndSaveMediaMessage(quotedMedia, filePath);
  return savedPath;
}

async function uploadToCatbox(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, {
    filename: path.basename(filePath),
    contentType: mime.lookup(path.extname(filePath)) || 'application/octet-stream'
  });

  const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return data.trim(); // Catbox returns the full valid URL
}

async function uploadToLitterbox(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('time', '1h'); // file expiry time
  form.append('fileNameLength', '16');
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, {
    filename: path.basename(filePath),
    contentType: mime.lookup(path.extname(filePath)) || 'application/octet-stream'
  });

  const { data } = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return data.trim(); // returns full URL like https://litter.catbox.moe/xxxx.ext
}


async function uploadToUguu(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const form = new FormData();
  form.append('files[]', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: mimeType
  });

  const response = await axios.post('https://uguu.se/upload.php', form, {
    headers: {
      ...form.getHeaders(),
      'origin': 'https://uguu.se',
      'referer': 'https://uguu.se/',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    }
  });

  const result = response.data;
  if (result.success && result.files?.[0]?.url) {
    return result.files[0].url;
  } else {
    throw new Error("Uguu upload failed or malformed response");
  }
}


async function uploadToImgBB(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('image', buffer.toString('base64'));
  
  const { data } = await axios.post('https://api.imgbb.com/1/upload?key=8b468bac6311f8b2fd23d20e90186ac8', form, {
    headers: form.getHeaders()
  });

  return data.data.url;
}

// ==================== uguu Command ====================
keith({
  pattern: "uguu",
  aliases: ["uguupload", "uguurl"],
  description: "Upload quoted media/document to Uguu.se",
  category: "Uploader",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Please quote an image, video, audio, sticker, or document to upload.");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type.");

  const mediaNode =
    quoted?.imageMessage ||
    quoted?.videoMessage ||
    quoted?.audioMessage ||
    quoted?.stickerMessage ||
    quoted?.documentMessage;

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const link = await uploadToUguu(filePath);
    await reply(link);
  } catch (err) {
    console.error("Uguu upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});

// ==================== imgbb Command ====================
keith({
  pattern: "url",
  aliases: ["upload", "urlconvert"],
  description: "Convert quoted media to Catbox URL",
  category: "Uploader",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Please quote an image.");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type.");

  const mediaNode =
    quoted?.imageMessage ||
    quoted?.videoMessage ||
    quoted?.audioMessage ||
    quoted?.stickerMessage;

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const link = await uploadToImgBB(filePath);
    await client.sendMessage(from, { text: link }, { quoted: mek });
  } catch (err) {
    console.error("Catbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
// ==================== Catbox Command ====================
keith({
  pattern: "catbox",
  aliases: ["upload", "urlconvert"],
  description: "Convert quoted media to Catbox URL",
  category: "Uploader",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Please quote an image, video, audio, or sticker to upload.");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type.");

  const mediaNode =
    quoted?.imageMessage ||
    quoted?.videoMessage ||
    quoted?.audioMessage ||
    quoted?.stickerMessage;

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const link = await uploadToCatbox(filePath);
    await client.sendMessage(from, { text: link }, { quoted: mek });
  } catch (err) {
    console.error("Catbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});

// ==================== Litterbox Command ====================
keith({
  pattern: "litterbox",
  aliases: ["litupload", "tempurl"],
  description: "Convert quoted media to Litterbox temporary URL",
  category: "Uploader",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Please quote an image, video, audio, or sticker to upload.");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type.");

  const mediaNode =
    quoted?.imageMessage ||
    quoted?.videoMessage ||
    quoted?.audioMessage ||
    quoted?.stickerMessage;

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const link = await uploadToLitterbox(filePath);
    await reply(link);
  } catch (err) {
    console.error("Litterbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
