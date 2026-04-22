const { keith } = require('../commandHandler');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const mime = require('mime-types');
const crypto = require('crypto');
//========================================================================================================================
//========================================================================================================================
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
  form.append('userhash', ''); 
  form.append('fileToUpload', buffer, {
    filename: path.basename(filePath),
    contentType: mime.lookup(path.extname(filePath)) || 'application/octet-stream'
  });

  const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return data.trim(); 
}
//========================================================================================================================
//========================================================================================================================
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

//========================================================================================================================
//========================================================================================================================
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

//========================================================================================================================
//========================================================================================================================
async function uploadToImgBB(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('image', buffer.toString('base64'));
  
  const { data } = await axios.post('https://api.imgbb.com/1/upload?key=8b468bac6311f8b2fd23d20e90186ac8', form, {
    headers: form.getHeaders()
  });

  return data.data.url;
}

//========================================================================================================================
//========================================================================================================================
async function uploadToUploadF(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://uploadf.com',
    'Referer': 'https://uploadf.com/id/',
    'X-Requested-With': 'XMLHttpRequest',
    ...formData.getHeaders()
  };

  const response = await axios.post('https://uploadf.com/fileup.php', formData, {
    headers: headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (response.data.FLG === true || response.data.FLG === "true") {
    return 'https://uploadf.com/file/' + response.data.NAME;
  } else {
    throw new Error("UploadF upload failed: " + JSON.stringify(response.data));
  }
}
//========================================================================================================================
//========================================================================================================================
async function uploadToGoFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");

  const buffer = await fs.readFile(filePath);
  
  // Create account/token
  const { data: accountData } = await axios.post('https://api.gofile.io/accounts', {}, {
    headers: {
      origin: 'https://gofile.io',
      referer: 'https://gofile.io/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    }
  });
  
  if (!accountData?.data?.token) throw new Error('Failed to create account on GoFile.');
  
  // Create folder
  const { data: folderData } = await axios.post('https://api.gofile.io/contents/createfolder', {
    parentFolderId: accountData.data.rootFolder,
    public: true
  }, {
    headers: {
      authorization: `Bearer ${accountData.data.token}`,
      origin: 'https://gofile.io',
      referer: 'https://gofile.io/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    }
  });
  
  if (!folderData?.data?.id) throw new Error('Failed to create folder on GoFile.');
  
  // Upload file
  const form = new FormData();
  form.append('token', accountData.data.token);
  form.append('folderId', folderData.data.id);
  form.append('file', buffer, `${Date.now()}_${path.basename(filePath)}`);
  
  const { data: uploadData } = await axios.post('https://upload.gofile.io/uploadfile', form, {
    headers: {
      ...form.getHeaders(),
      host: 'upload.gofile.io',
      origin: 'https://gofile.io',
      referer: 'https://gofile.io/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  
  if (uploadData?.data?.downloadPage) {
    return uploadData.data.downloadPage; // Return the download page URL
  } else {
    throw new Error("GoFile upload failed: " + JSON.stringify(uploadData));
  }
}
//========================================================================================================================
//========================================================================================================================


async function uploadToAWS(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");
  
  const buffer = await fs.readFile(filePath);
  
  // Get mime type and extension
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const ext = path.extname(filePath).slice(1) || 'bin';
  const filename = `${Date.now()}.${ext}`;
  
  // Get S3 upload credentials
  const { data } = await axios.post('https://llamacoder.together.ai/api/s3-upload', {
    filename,
    filetype: mimeType,
    _nextS3: { strategy: 'aws-sdk' }
  });
  
  const { region, bucket, key } = data;
  const { AccessKeyId, SecretAccessKey, SessionToken } = data.token.Credentials;
  
  // Generate AWS signatures
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  
  const canonicalHeaders = `content-type:${mimeType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\nx-amz-security-token:${SessionToken}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token';
  const canonicalRequest = `PUT\n/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
  
  const signingKey = ['aws4_request', 's3', region, dateStamp].reduceRight((acc, val) => crypto.createHmac('sha256', acc).update(val).digest(), `AWS4${SecretAccessKey}`);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  // Upload to S3
  await axios.put(`https://${host}/${key}`, buffer, {
    headers: {
      authorization: authorization,
      'content-type': mimeType,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'x-amz-security-token': SessionToken
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  
  return `https://${host}/${key}`;
}

//========================================================================================================================
//========================================================================================================================

//========================================================================================================================
//========================================================================================================================
async function uploadToFreeImageHost(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");
  
  const buffer = await fs.readFile(filePath);
  const mimeType = mime.lookup(filePath) || 'image/jpeg';
  const ext = path.extname(filePath).slice(1) || 'jpg';
  const filename = `${Date.now()}.${ext}`;
  
  // Get auth token from homepage
  const { data: html, headers } = await axios.get('https://freeimage.host/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    }
  });
  
  const token = html.match(/auth_token\s*=\s*["']([a-f0-9]+)["']/)?.[1];
  if (!token) throw new Error('Failed to extract auth_token from FreeImage.Host');
  
  // Upload file
  const form = new FormData();
  form.append('source', buffer, filename);
  form.append('type', 'file');
  form.append('action', 'upload');
  form.append('timestamp', Date.now().toString());
  form.append('auth_token', token);
  
  const { data } = await axios.post('https://freeimage.host/json', form, {
    headers: {
      ...form.getHeaders(),
      cookie: headers['set-cookie'].join('; '),
      origin: 'https://freeimage.host',
      referer: 'https://freeimage.host/',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  
  if (data?.image?.image?.url) {
    return data.image.image.url; // Returns only the direct URL
  }
  
  throw new Error("FreeImage.Host upload failed: " + JSON.stringify(data));
}

//========================================================================================================================
//========================================================================================================================
// ==================== FreeImage.Host Command ====================
keith({
  pattern: "freeimage",
  aliases: ["fih", "freeimagehost"],
  description: "Upload quoted media to FreeImage.Host",
  category: "Uploader",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Please quote an image to upload.");

  const type = getMediaType(quotedMsg);
  if (type !== "image") return reply("❌ FreeImage.Host only supports images.");

  const mediaNode = quoted?.imageMessage;
  if (!mediaNode) return reply("❌ Could not extract image content.");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const link = await uploadToFreeImageHost(filePath);
    await reply(link); // Sends only the direct URL
  } catch (err) {
    console.error("FreeImage.Host upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================

//========================================================================================================================
//========================================================================================================================

async function uploadToAliOSS(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");
  
  const buffer = await fs.readFile(filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const ext = path.extname(filePath).slice(1) || 'bin';
  const filename = `${Date.now()}.${ext}`;
  
  // Get STS token from AliOSS
  const { data } = await axios.get('https://visualgpt.io/api/v1/oss/sts-token');
  
  if (!data?.data) throw new Error('Failed to get STS token from AliOSS');
  
  const { AccessKeyId, AccessKeySecret, SecurityToken } = data.data;
  
  // Prepare upload
  const ossKey = `nekoo/${filename}`;
  const date = new Date().toUTCString();
  const stringToSign = `PUT\n\n${mimeType}\n${date}\nx-oss-security-token:${SecurityToken}\n/nc-cdn/${ossKey}`;
  const signature = crypto.createHmac('sha1', AccessKeySecret).update(stringToSign).digest('base64');
  const url = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossKey}`;
  
  // Upload to AliOSS
  await axios.put(url, buffer, {
    headers: {
      'authorization': `OSS ${AccessKeyId}:${signature}`,
      'content-type': mimeType,
      'date': date,
      'x-oss-security-token': SecurityToken
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  
  return url; // Returns only the direct URL
}

//========================================================================================================================
//========================================================================================================================
// ==================== AliOSS Command ====================
keith({
  pattern: "alioss",
  aliases: ["oss", "aliupload"],
  description: "Upload quoted media to AliOSS (Alibaba Cloud)",
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
    const link = await uploadToAliOSS(filePath);
    await reply(link); // Sends only the direct URL
  } catch (err) {
    console.error("AliOSS upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
//========================================================================================================================
//========================================================================================================================

  
  
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
// ==================== AWS S3 Upload Command ====================
keith({
  pattern: "aws",
  aliases: ["s3upload", "awsupload"],
  description: "Upload quoted media to AWS S3",
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
    const link = await uploadToAWS(filePath);
    await reply(link); // Just sends the link, no extra text
  } catch (err) {
    console.error("AWS S3 upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
// ==================== GoFile Command ====================
keith({
  pattern: "gofile",
  aliases: ["gf", "gofileupload"],
  description: "Upload quoted media to GoFile.io",
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
    const link = await uploadToGoFile(filePath);
    await reply(link);
  } catch (err) {
    console.error("GoFile upload error:", err);
    await reply("❌ Failed to upload to GoFile. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
//========================================================================================================================
//========================================================================================================================


//========================================================================================================================
//========================================================================================================================
// ==================== UploadF Command ====================
keith({
  pattern: "uploadf",
  aliases: ["uf", "uploadfcom"],
  description: "Upload quoted media to UploadF.com",
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
    const link = await uploadToUploadF(filePath);
    await reply(link);
  } catch (err) {
    console.error("UploadF upload error:", err);
    await reply("❌ Failed to upload. Error:\n" + err.message);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("unlink error:", e); }
    }
  }
});
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
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
//========================================================================================================================
//========================================================================================================================
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
//========================================================================================================================
//========================================================================================================================
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
//========================================================================================================================
//========================================================================================================================
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
