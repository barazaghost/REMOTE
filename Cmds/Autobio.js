const { keith } = require('../commandHandler');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const mime = require('mime-types');
const crypto = require('crypto');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

//========================================================================================================================
//========================================================================================================================
function getMediaType(quoted) {
  if (quoted.imageMessage) return "image";
  if (quoted.videoMessage) return "video";
  if (quoted.stickerMessage) return "sticker";
  if (quoted.audioMessage) return "audio";
  if (quoted.documentMessage) return "document";
  return "unknown";
}

function getFileExtensionFromMimetype(mimetype) {
  if (!mimetype) return '';
  const ext = mime.extension(mimetype);
  return ext ? `.${ext}` : '';
}

async function saveMediaToTemp(client, quotedMedia, type, mimetype) {
  const tmpDir = path.join(__dirname, "..", "tmp");
  await fs.ensureDir(tmpDir);
  
  const extension = getFileExtensionFromMimetype(mimetype);
  const fileName = `${type}-${Date.now()}${extension}`;
  const filePath = path.join(tmpDir, fileName);
  
  const buffer = await downloadMediaMessage(
    { message: { [type + 'Message']: quotedMedia } },
    'buffer',
    {},
    { 
      reuploadRequest: client.updateMediaMessage,
      logger: console 
    }
  );
  
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function uploadToCatbox(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('userhash', ''); 
  form.append('fileToUpload', buffer, {
    filename: path.basename(filePath),
    contentType: mime.lookup(filePath) || 'application/octet-stream'
  });

  const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return data.trim(); 
}

async function uploadToLitterbox(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('time', '1h');
  form.append('fileNameLength', '16');
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, {
    filename: path.basename(filePath),
    contentType: mime.lookup(filePath) || 'application/octet-stream'
  });

  const { data } = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return data.trim();
}

async function uploadToUguu(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");

  const form = new FormData();
  form.append('files[]', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: mime.lookup(filePath) || 'application/octet-stream'
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

  let mediaNode;
  let mimetype = '';
  
  if (type === "image") {
    mediaNode = quotedMsg.imageMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "video") {
    mediaNode = quotedMsg.videoMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "audio") {
    mediaNode = quotedMsg.audioMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "sticker") {
    mediaNode = quotedMsg.stickerMessage;
    mimetype = mediaNode.mimetype || 'image/webp';
  }
  else if (type === "document") {
    mediaNode = quotedMsg.documentMessage;
    mimetype = mediaNode.mimetype;
  }

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type, mimetype);
    const link = await uploadToUguu(filePath);
    await reply(link);
  } catch (err) {
    console.error("Uguu upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && await fs.pathExists(filePath)) {
      try { await fs.unlink(filePath); } catch (e) { console.error("unlink error:", e); }
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

  let mediaNode;
  let mimetype = '';
  
  if (type === "image") {
    mediaNode = quotedMsg.imageMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "video") {
    mediaNode = quotedMsg.videoMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "audio") {
    mediaNode = quotedMsg.audioMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "sticker") {
    mediaNode = quotedMsg.stickerMessage;
    mimetype = mediaNode.mimetype || 'image/webp';
  }

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type, mimetype);
    const link = await uploadToImgBB(filePath);
    await client.sendMessage(from, { text: link }, { quoted: mek });
  } catch (err) {
    console.error("Catbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && await fs.pathExists(filePath)) {
      try { await fs.unlink(filePath); } catch (e) { console.error("unlink error:", e); }
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

  let mediaNode;
  let mimetype = '';
  
  if (type === "image") {
    mediaNode = quotedMsg.imageMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "video") {
    mediaNode = quotedMsg.videoMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "audio") {
    mediaNode = quotedMsg.audioMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "sticker") {
    mediaNode = quotedMsg.stickerMessage;
    mimetype = mediaNode.mimetype || 'image/webp';
  }

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type, mimetype);
    const link = await uploadToCatbox(filePath);
    await client.sendMessage(from, { text: link }, { quoted: mek });
  } catch (err) {
    console.error("Catbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && await fs.pathExists(filePath)) {
      try { await fs.unlink(filePath); } catch (e) { console.error("unlink error:", e); }
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

  if (!quotedMsg) return reply("📌 Please quote an image, video, audio, document, or sticker to upload.");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type.");

  let mediaNode;
  let mimetype = '';
  
  if (type === "image") {
    mediaNode = quotedMsg.imageMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "video") {
    mediaNode = quotedMsg.videoMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "audio") {
    mediaNode = quotedMsg.audioMessage;
    mimetype = mediaNode.mimetype;
  }
  else if (type === "sticker") {
    mediaNode = quotedMsg.stickerMessage;
    mimetype = mediaNode.mimetype || 'image/webp';
  }
  else if (type === "document") {
    mediaNode = quotedMsg.documentMessage;
    mimetype = mediaNode.mimetype;
  }

  if (!mediaNode) return reply("❌ Could not extract media content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type, mimetype);
    const link = await uploadToLitterbox(filePath);
    await reply(link);
  } catch (err) {
    console.error("Litterbox upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && await fs.pathExists(filePath)) {
      try { await fs.unlink(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
