
//========================================================================================================================
const { keith } = require('../commandHandler');
const axios = require('axios');
const { 
    saveConversation, 
    getConversationHistory, 
    clearConversationHistory,
    getLastConversation 
} = require('../database/gpt');
const fs = require("fs");
const FormData = require("form-data");
const crypto = require('crypto');



const { fileTypeFromBuffer } = require("file-type");
//========================================================================================================================
//========================================================================================================================


const config = {
  createUrl: "https://api.photoeditorai.io/pe/photo-editor/create-job",
  jobUrl: "https://api.photoeditorai.io/pe/photo-editor/get-job/",
  creditsUrl: "https://api.photoeditorai.io/api/wl/credit/get-credits"
};

const headers = {
  "product-serial": "94177bd5f370f2b4e54dd44668d58c35",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
  "origin": "https://photoeditorai.io",
  "referer": "https://photoeditorai.io/",
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
};

async function getCredits() {
  const { data } = await axios.post(config.creditsUrl, {}, { headers });
  if (data.code !== 100000) {
    throw new Error(`Failed to get credits: ${data.message}`);
  }
  return data.result;
}

async function pollJobResult(jobId) {
  for (let i = 0; i < 150; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const { data } = await axios.get(`${config.jobUrl}${jobId}`, { headers });

    if (data.code !== 100000) {
      throw new Error(data.message || "Job status error");
    }
    
    if (data.result.error) {
      throw new Error(data.result.error);
    }

    if (data.result.status === 2 && data.result.output?.length > 0) {
      return data.result.output[0];
    }
  }
  throw new Error("Timeout: Image processing took too long (5 minutes)");
}

async function processImage(imageBuffer, prompt) {
  // Check credits first
  const credits = await getCredits();
  if (credits.free_credits <= 0 && credits.credits <= 0) {
    throw new Error("No credits available. Please get more credits.");
  }

  // Create form data
  const form = new FormData();
  form.append("model_name", "photoeditor_4.0");
  form.append("target_images", imageBuffer, {
    filename: "image.jpg",
    contentType: "image/jpeg"
  });
  form.append("prompt", prompt);
  form.append("ratio", "4:3");
  form.append("image_resolution", "1K");

  // Create job
  const { data: createData } = await axios.post(config.createUrl, form, {
    headers: { ...headers, ...form.getHeaders() }
  });

  if (createData.code !== 100000) {
    throw new Error(`Failed to create job: ${createData.message || "Unknown error"}`);
  }

  const jobId = createData.result.job_id;
  const resultUrl = await pollJobResult(jobId);

  // Download result
  const resultRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
  return Buffer.from(resultRes.data);
}


//========================================================================================================================
//========================================================================================================================



const API = "https://remusic.ai/api/v1/ai-music/music";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0";

const STYLES = {
    genre: ["Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Classical", "Electronic", "EDM", "Lo-fi", "Ambient", "Reggae", "Country", "Folk", "Metal", "Blues", "Funk", "Soul", "Disco", "House", "Techno", "Trap", "Drum and Bass", "K-Pop", "J-Pop", "Latin", "Afrobeat", "Cinematic", "Orchestral", "Acoustic", "Punk", "Gospel", "Indie", "Synthwave", "Bossa Nova"],
    mood: ["Calm", "Happy", "Sad", "Energetic", "Romantic", "Epic", "Dark", "Dreamy", "Uplifting", "Melancholic", "Chill", "Aggressive", "Peaceful", "Nostalgic", "Mysterious", "Hopeful", "Sensual", "Playful", "Angry", "Triumphant"],
    vocal: ["Male Vocal", "Female Vocal", "Duet", "Choir", "Soft Vocal", "Powerful Vocal", "Rap", "Whisper"],
    tempo: ["Slow", "Mid-tempo", "Upbeat", "Fast"]
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const freshGa = () => `GA1.1.${Math.floor(Math.random() * 9e9 + 1e9)}.${Math.floor(Date.now() / 1000)}`;
const randIP = () => Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 254)).join(".");

function headers() {
    return {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "origin": "https://remusic.ai",
        "referer": "https://remusic.ai/ai-music-generator",
        "user-agent": UA,
        "cookie": `_ga=${freshGa()}; anonymous_user_id=${crypto.randomUUID()}`,
        "x-forwarded-for": randIP()
    };
}

function pick(row) {
    return {
        id: row.song_id,
        title: row.title || null,
        status: row.status,
        audio: row.audio_url || null,
        image: row.image_url || row.cover_url || null,
        duration: row.duration || null,
        tags: row.tags || null,
        lyrics: row.lyrics || null,
        description: row.description || null
    };
}

async function createJob(body, maxRetries) {
    let last = "create failed";
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await axios.post(API, body, { headers: headers(), timeout: 30000 });
            const json = res.data;
            if (json && json.code === 100000 && Array.isArray(json.data) && json.data.length) return json.data;
            last = json ? `${json.code}: ${json.message}` : `http ${res.status}`;
        } catch (e) {
            last = e.message;
        }
        await sleep(600);
    }
    throw new Error(last);
}

async function pollJob(id, onProgress) {
    for (let i = 0; i < 70; i++) {
        await sleep(5000);
        try {
            const res = await axios.get(`${API}/${id}`, { headers: headers(), timeout: 15000 });
            const json = res.data;
            const row = Array.isArray(json?.data) ? json.data[0] : json?.data;
            if (!row) continue;
            if (onProgress) onProgress(row.percentage ?? 0, row.status);
            if (row.status === "success" && row.audio_url) return row;
            if (["failed", "error", "fail"].includes(row.status)) throw new Error("Generation failed");
        } catch (e) {
            if (e.message === "Generation failed") throw e;
        }
    }
    throw new Error("Generation timeout");
}

async function generateMusic(prompt, options = {}) {
    const {
        styles = [],
        title = null,
        lyrics = null,
        mv = "v4",
        supplier = 10,
        maxRetries = 6,
        onProgress = null
    } = options;

    const tags = (Array.isArray(styles) ? styles : [styles]).filter(Boolean).join(", ");
    const custom = !!(title || lyrics);

    const body = custom
        ? { mode: 2, supplier, mv, is_instrumental: false, is_public: true, prompt: String(prompt || tags || title), title: title || "", tags, lyrics: lyrics || "" }
        : { mode: 1, supplier, mv, is_instrumental: false, is_public: true, prompt: tags ? `${prompt}, ${tags}` : String(prompt) };

    const jobs = await createJob(body, maxRetries);
    const songs = await Promise.all(jobs.map(j => pollJob(j.song_id, onProgress).then(pick).catch(() => ({ id: j.song_id, status: "failed", audio: null }))));

    return {
        ok: songs.some(s => s.audio),
        prompt: String(prompt || ""),
        styles: tags || null,
        mode: custom ? "custom" : "simple",
        count: songs.length,
        songs
    };
}
//========================================================================================================================
//========================================================================================================================

keith({
    pattern: "aimusic",
    aliases: ["songgen", "genmusic", "aimusicgen"],
    category: "Ai",
    description: "Generate AI music from text prompt"
}, async (from, client, conText) => {
    const { q, reply, mek, isSuperUser } = conText;

    if (!isSuperUser) return reply("❌ Owner only!");

    if (!q) {
        return reply(`📌 *AI Music Generator*
        
Generate music using AI from text description.

*Usage:*
.aimusic sad piano music

*With styles:*
.aimusic calm jazz | Jazz,Calm,Chill

*Examples:*
.aimusic epic orchestral
.aimusic romantic love song | Romantic,Slow,Vocal

*Styles:*
🎵 Genre: Pop, Rock, Hip-Hop, Jazz, Classical, Electronic, EDM, Lo-fi, Ambient, Reggae, Country, Metal, Blues, Soul, Disco, House, Techno, Trap, K-Pop, Latin, Afrobeat, Cinematic, Orchestral, Acoustic, Punk, Gospel, Indie, Synthwave, Bossa Nova

😊 Mood: Calm, Happy, Sad, Energetic, Romantic, Epic, Dark, Dreamy, Uplifting, Melancholic, Chill, Peaceful, Mysterious, Hopeful, Sensual, Playful

🎤 Vocal: Male Vocal, Female Vocal, Duet, Choir, Soft Vocal, Powerful Vocal, Rap, Whisper

⏱️ Tempo: Slow, Mid-tempo, Upbeat, Fast`);
    }

    await reply(`🎵 Generating AI music for: "${q}"...\n⏳ This may take 1-2 minutes.`);

    try {
        let prompt = q;
        let styles = [];

        // Check if styles specified with |
        if (q.includes('|')) {
            const parts = q.split('|').map(s => s.trim());
            prompt = parts[0];
            if (parts[1]) {
                styles = parts[1].split(',').map(s => s.trim());
            }
        }

        const result = await generateMusic(prompt, {
            styles: styles,
            onProgress: (percent, status) => {
                console.log(`⏳ Progress: ${percent}% - ${status}`);
            }
        });

        if (!result.ok) {
            return reply("❌ Failed to generate music. Please try again with different prompt.");
        }

        // Find first successful song
        const song = result.songs.find(s => s.audio);
        if (!song) {
            return reply("❌ No audio generated. Please try again.");
        }

        // Send the audio
        await client.sendMessage(from, {
            audio: { url: song.audio },
            mimetype: 'audio/mpeg',
            ptt: false,
           // caption: `🎵 *AI Generated Music*\n📝 *Prompt:* ${result.prompt}\n${song.title ? `📌 *Title:* ${song.title}\n` : ''}${song.duration ? `⏱️ *Duration:* ${song.duration}s\n` : ''}${song.tags ? `🏷️ *Tags:* ${song.tags}` : ''}`
        }, { quoted: mek });

        // Send additional info if there are more songs
        const totalSongs = result.songs.filter(s => s.audio).length;
        if (totalSongs > 1) {
            await reply(`✅ Generated ${totalSongs} songs. Check the audio above!`);
        }

    } catch (err) {
        console.error("aimusic error:", err);
        await reply(`❌ Error: ${err.message}`);
    }
});
//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "imageedit2",
  aliases: ["nanobananapro", "nabpro", "editimg"],
  category: "Ai",
  description: "Edit a quoted image with a prompt (PhotoEditor AI)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!quotedMsg?.imageMessage) {
    return reply("📌 Reply to an image with:\n`imageedit2 <prompt>`");
  }
  if (!q) {
    return reply("❌ Provide a prompt!\nExample: imageedit2 make it black and white");
  }

  await reply("🖼️ Processing your image...");

  let filePath = null;
  try {
    // Download image
    filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const imageBuffer = fs.readFileSync(filePath);

    // Process image
    const resultBuffer = await processImage(imageBuffer, q);

    // Send result
    await client.sendMessage(from, {
      image: resultBuffer
     
    }, { quoted: mek });

  } catch (err) {
    console.error("imageedit2 error:", err);
    await reply(`❌ Error: ${err.message}`);
  } finally {
    // Cleanup temp file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});




// ========================================================================
// RC - Remove Clothes / AI Clothing Removal
// ========================================================================
async function removeClothes(buffer, prompt = 'nude') {
    if (!Buffer.isBuffer(buffer)) throw new Error('Image buffer is required.');
    
    const aesEncrypt = (data, key, iv) => {
        const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
        return cipher.update(data, 'utf8', 'base64') + cipher.final('base64');
    };
    
    const genRandom = (len) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from(crypto.randomBytes(len), byte => chars[byte % chars.length]).join('');
    };
    
    const t = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const tempAesKey = genRandom(16);
    const secret_key = crypto.publicEncrypt({
        key: `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH\nW5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr\nrnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s\nsnOjvdDb4wiZI8x3UwIDAQAB\n-----END PUBLIC KEY-----`,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(tempAesKey)).toString('base64');
    
    const userId = genRandom(64).toLowerCase();
    const instance = axios.create({
        baseURL: 'https://apiv1.deepfakemaker.io/api',
        params: {
            app_id: 'ai_df',
            t, nonce, secret_key,
            sign: aesEncrypt(`ai_df:NHGNy5YFz7HeFb:${t}:${nonce}:${secret_key}`, tempAesKey, tempAesKey),
        },
        headers: {
            'access-control-allow-credentials': 'true',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0',
            'referer': 'https://deepfakemaker.io/ai-clothes-remover/'
        }
    });
    
    const { data: file } = await instance.post('/user/v2/upload-sign', {
        filename: genRandom(32) + '_' + Date.now() + '.jpg',
        hash: crypto.createHash('sha256').update(buffer).digest('hex'),
        user_id: userId
    });
    
    await axios.put(file.data.url, buffer, {
        headers: {
            'content-type': 'image/jpeg',
            'content-length': buffer.length
        }
    });
    
    const { data: cf } = await axios.post('https://cf.rynekoo.eu.cc/action', {
        url: 'https://deepfakemaker.io/ai-clothes-remover/',
        mode: 'turnstile-min',
        siteKey: '0x4AAAAAAB6PHmfUkQvGufDI'
    });
    
    if (!cf?.data?.token) throw new Error('Failed to get cf token.');
    
    const { data: task } = await instance.post('/img/v2/free/clothes/remover/task', {
        prompt,
        image: 'https://cdn.deepfakemaker.io/' + file.data.object_name,
        platform: 'clothes_remover',
        user_id: userId
    }, {
        headers: { token: cf.data.token }
    });
    
    while (true) {
        const { data } = await instance.get('/img/v2/free/clothes/remover/task', {
            params: { user_id: userId, ...task.data }
        });
        
        if (data.msg === 'success') return data.data.generate_url;
        await new Promise(resolve => setTimeout(resolve, 2500));
    }
}


// ========================================================================
// ========================================================================

const AGENT = "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36";
const SALT = "hackers_become_a_little_stinkier_every_time_they_hack";

const md5 = s => crypto.createHash("md5").update(s).digest("hex");
const reverse = s => s.split("").reverse().join("");
const generateRandomIP = () => Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 254)).join(".");

function getMime(ext) {
    const mimes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    };
    return mimes[ext.toLowerCase()] || "application/octet-stream";
}

function genKEY() {
    const r = String(Math.floor(Math.random() * 1e11));
    const h1 = reverse(md5(AGENT + r + SALT));
    const h2 = reverse(md5(AGENT + h1));
    const h3 = reverse(md5(AGENT + h2));
    return `tryit-${r}-${h3}`;
}

async function editImage(buffer, prompt) {
    let lastError = "request failed";
    
    for (let i = 0; i < 6; i++) {
        const form = new FormData();
        form.append("image", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
        form.append("text", prompt);
        form.append("image_generator_version", "standard");
        
        try {
            const response = await axios.post("https://api.deepai.org/api/image-editor", form, {
                headers: {
                    ...form.getHeaders(),
                    'accept': '*/*',
                    'origin': 'https://deepai.org',
                    'referer': 'https://deepai.org/',
                    'user-agent': AGENT,
                    'api-key': genKEY(),
                    'x-forwarded-for': generateRandomIP()
                },
                timeout: 60000
            });
            
            const json = response.data;
            if (json?.output_url) {
                // Download the edited image
                const imageResponse = await axios.get(json.output_url, { responseType: 'arraybuffer' });
                return { 
                    success: true, 
                    buffer: Buffer.from(imageResponse.data), 
                    url: json.output_url,
                    id: json.id 
                };
            }
            lastError = json?.status || `HTTP ${response.status}`;
        } catch (e) {
            lastError = e.message;
        }
    }
    return { success: false, error: lastError };
}

// ========================================================================
// ========================================================================

keith({
    pattern: "imageedit",
    aliases: ["deepai", "dimage", "editai"],
    category: "Ai",
    description: "Edit image using DeepAI (remove objects, add elements)"
}, async (from, client, conText) => {
    const { q, mek, quoted, quotedMsg, reply, isSuperUser } = conText;

    if (!isSuperUser) return reply("❌ Owner Only Command!");
    
    if (!quotedMsg || !quoted?.imageMessage) {
        return reply(`📌 *DeepAI Image Editor*
        
Edit images using AI - remove objects, add elements, or change style.

*Usage:*
Reply to an image with: .deepedit remove the person
.deepedit make it look like a painting

*Examples:*
.deepedit remove the background
.deepedit add a sunset
.deepedit make it cartoon style`);
    }

    if (!q) {
        return reply("❌ Provide a prompt!\nExample: .deepedit remove the person");
    }

    let tempFilePath = null;

    try {
    //    await reply(`🖼️ Processing image with AI...\n📝 Prompt: ${q}`);

        tempFilePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
        const buffer = fs.readFileSync(tempFilePath);
        
        // Check file size (max 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            return reply("❌ Image too large! Max 10MB.");
        }

        const result = await editImage(buffer, q);
        
        if (!result.success) {
            return reply(`❌ Error: ${result.error}`);
        }

        await client.sendMessage(from, {
            image: result.buffer,
          //  caption: `✅ *Image Edited!*\n📝 *Prompt:* ${q}\n🆔 *ID:* ${result.id || 'N/A'}`
        }, { quoted: mek });

    } catch (err) {
        console.error("deepedit error:", err);
        await reply(`❌ Error: ${err.message}`);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch {}
        }
    }
});

// ========================================================================
// ========================================================================

keith({
  pattern: "rc",
  aliases: ["undress", "nude", "removeclothes"],
  category: "Ai",
  description: "AI clothing removal (owner only)"
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  
  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📷 Reply to an image with .rc");
  }

  try {
 //   await reply("🔄 Processing image...");
    
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);
    
    const prompt = q ? q.trim().toLowerCase() : 'nude';
    const validPrompts = ['nude', 'bikini', 'topless', 'underwear', 'naked', 'swimsuit', 'lingerie'];
    
    if (!validPrompts.includes(prompt)) {
      console.log(`⚠️ Using default prompt: nude`);
    }

    const result = await removeClothes(buffer, validPrompts.includes(prompt) ? prompt : 'nude');
    
    await client.sendMessage(from, {
      image: { url: result },
     // caption: `🖼️ AI Processed Image\n📝 Prompt: ${prompt}`
    }, { quoted: mek });

  } catch (error) {
    console.error("RC Error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});

// ========================================================================
// Image to Video (Nanobana)
// ========================================================================
/*const NANO_COOKIE = "__Host-authjs.csrf-token=30520470455c3e13eaed1f36a6d404badce7ea465230c2c98e0471bb72646a4e%7C3e869582574ac97763adf0b3d383e68275475d375f1926fd551aa712e4adbd24; __Secure-authjs.callback-url=https%3A%2F%2Fwww.nanobana.net%2F%23generator; g_state={\"i_l\":0,\"i_ll\":1769401024886,\"i_b\":\"VKxqLQ5eJ0B2gQmnduZzPCwsZ1q418d0cjhhXWlbxTU\",\"i_e\":{\"enable_itp_optimization\":0}}; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiSWRmbEhwMk0teEF1V3l6Nkg1bHZrRHdOc0ZiM3BBOHVvMjNjaXhaZ1MxT1hHWUFNUUc0MGY0bW5XZnFtdWZyWnFYbHM2SFZILUZncDlvaUk5dTdIbHcifQ..lasLfR5B2_Rf2Q_F3K6fgw.Tro9GauoZdTk0Dtt_Dt6HJK5eG_OZoP66i6LKgtDzaj6v42BIhO-Hre144rB3wYfFQovDVKXyxAGG8WyP5FW_H3WTJP-it5Sm8xfmj7WWSbAzXGXPOcw-782yVRqLAK4cxuNNGVYCNJhOxLnKEAh_3bRBUHpkDmDfsnC8z5FmTtURhA32n-KiMW5zcPKKhY6haApLrOfJ3Y31NxjzVRDa-T-1vjTITsyFBsZW_WaFY8OHRz7giNl-rKbfm-OKEd_nvU0NqdnEUS_LBYN-5b7u5f1buYMdIt8M2g6YIaYwhdXIGZ-x9HpJz2API7NrhKN5tTwaN6UMPFq4ZSfEdYEWipfmUMacv5oGfW7AmaAWMoVvYs5tudzI00D_M0GE3A5F20fLFRMRgDOsI3cs5-e0TzGOTobv3D7UGau8XCrxX5exf5L6Q1C15A6xwtPpRJu1cOg1BlnOXf0gueF4sAAcg._Bl87onRhLiZFFuzC-e1_udKFzuUFVAfhW4FfmtUufE";

const NANO_HEADERS = {
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  "origin": "https://www.nanobana.net",
  "referer": "https://www.nanobana.net/",
  "cookie": NANO_COOKIE
};

async function uploadImage(buffer) {
  const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: "jpg", mime: "image/jpeg" };
  const form = new FormData();
  form.append("file", buffer, { filename: `image.${ext}`, contentType: mime });

  const res = await axios.post(`https://www.nanobana.net/api/upload/image`, form, {
    headers: { ...NANO_HEADERS, ...form.getHeaders() }
  });
  if (!res.data.url) throw new Error("❌ Upload failed");
  return res.data.url;
}

async function generateVideo(prompt, imageUrl) {
  const res = await axios.post(`https://www.nanobana.net/api/sora2/image-to-video/generate`, {
    prompt,
    image_urls: [imageUrl],
    aspect_ratio: "portrait",
    n_frames: "10",
    remove_watermark: true
  }, { headers: NANO_HEADERS });

  if (!res.data.taskId) throw new Error("❌ Failed to create task");
  return res.data.taskId;
}

async function waitForVideo(taskId, prompt) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await axios.get(
      `https://www.nanobana.net/api/sora2/image-to-video/task/${taskId}?save=1&prompt=${encodeURIComponent(prompt)}`,
      { headers: NANO_HEADERS }
    );
    if (res.data.status === "completed") return res.data.saved?.[0]?.url;
    if (res.data.status === "failed") throw new Error(res.data.provider_raw?.data?.failMsg || "❌ Generation failed");
  }
  throw new Error("⏳ Timeout waiting for video");
}

keith({
  pattern: "img2video",
  aliases: ["imagevideo", "imagetovid", "i2v"],
  category: "Ai",
  description: "Convert image to video using AI"
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  
  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📷 Reply to an image with .img2video <prompt>");
  }

  if (!q) {
    return reply("❌ Provide a prompt!\nExample: .img2video make it move like waves");
  }

  try {
    await reply("🔄 Processing image...");

    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);

    await reply("📤 Uploading image...");
    const imageUrl = await uploadImage(buffer);

    await reply("🎬 Generating video... (may take 1-2 minutes)");
    const taskId = await generateVideo(q, imageUrl);
    
    const videoUrl = await waitForVideo(taskId, q);
    
    await client.sendMessage(from, {
      video: { url: videoUrl },
      caption: `🎥 *AI Generated Video*\n📝 *Prompt:* ${q}`
    }, { quoted: mek });

  } catch (error) {
    console.error("img2video error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});

//========================================================================================================================
/*keith({
  pattern: "rc",
  aliases: ["undress", "nude", "removeclothes"],
  category: "ai",
  description: "AI clothing removal (requires quoted image)",
  filename: __filename
},
async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply, isSuperUser } = conText;

  // Restrict to owner only for sensitive command
  if (!isSuperUser) return reply("❌ Owner Only Command!");
  
  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📷 Reply to an image with .rc command");
  }

  try {
    reply("🔄 Processing image...");
    
    // Download the image
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = fs.readFileSync(filePath);
    
    // Clean up temp file
    fs.unlinkSync(filePath);
    
    // Use prompt or default
    const prompt = q ? q.trim().toLowerCase() : 'nude';
    
    // Validate prompt
    const validPrompts = ['nude', 'bikini', 'topless', 'underwear', 'naked', 'swimsuit', 'lingerie'];
    if (!validPrompts.includes(prompt)) {
      console.log(`⚠️ Using default prompt: nude\nValid prompts: ${validPrompts.join(', ')}`);
      prompt = 'nude';
    }

    // Encryption functions
    const aesEncrypt = (data, key, iv) => {  
      const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));  
      let encrypted = cipher.update(data, 'utf8', 'base64');  
      encrypted += cipher.final('base64');  
      return encrypted;  
    };  

    const genRandom = (len) => {  
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';  
      let result = '';  
      const randomBytes = crypto.randomBytes(len);  
      for (let i = 0; i < len; i++) {  
        result += chars[randomBytes[i] % chars.length];  
      }  
      return result;  
    };  

    // Generate encryption parameters
    const t = Math.floor(Date.now() / 1000).toString();  
    const nonce = crypto.randomUUID();  
    const tempAesKey = genRandom(16);  
    
    if (!tempAesKey || tempAesKey.length !== 16) {
      throw new Error('Failed to generate encryption key');
    }

    const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH
W5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr
rnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s
snOjvdDb4wiZI8x3UwIDAQAB
-----END PUBLIC KEY-----`;
    
    const tempAesKeyBuffer = Buffer.from(tempAesKey, 'utf8');
    
    let secret_key;
    try {
      secret_key = crypto.publicEncrypt({  
        key: publicKey,  
        padding: crypto.constants.RSA_PKCS1_PADDING,  
      }, tempAesKeyBuffer).toString('base64');  
    } catch (rsaError) {
      throw new Error(`RSA encryption failed: ${rsaError.message}`);
    }

    const userId = genRandom(64).toLowerCase();  
    const signData = `ai_df:NHGNy5YFz7HeFb:${t}:${nonce}:${secret_key}`;
    const sign = aesEncrypt(signData, tempAesKey, tempAesKey);

    // Create axios instance with parameters
    const instance = axios.create({  
      baseURL: 'https://apiv1.deepfakemaker.io/api',  
      params: {  
        app_id: 'ai_df',  
        t, 
        nonce, 
        secret_key,  
        sign,  
      },  
      headers: {  
        'accept': 'application/json',
        'content-type': 'application/json',  
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',  
        'referer': 'https://deepfakemaker.io/ai-clothes-remover/'  
      },
      timeout: 30000
    });  

    // Step 1: Get upload signature
    console.log("📤 Getting upload URL...");
    
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = genRandom(32) + '_' + Date.now() + '.jpg';
    
    let uploadResponse;
    try {
      uploadResponse = await instance.post('/user/v2/upload-sign', {  
        filename: filename,  
        hash: hash,  
        user_id: userId  
      });
    } catch (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadResponse.data?.data?.url) {
      throw new Error('Failed to get upload URL from API');
    }

    // Step 2: Upload image to the signed URL
    console.log("📤 Uploading image...");
    
    try {
      await axios.put(uploadResponse.data.data.url, buffer, {  
        headers: {  
          'content-type': 'image/jpeg',  
          'content-length': buffer.length.toString()  
        },
        timeout: 30000
      });  
    } catch (putError) {
      throw new Error(`Image upload failed: ${putError.message}`);
    }

    // Step 3: Get Cloudflare token
    console.log("🔑 Getting security token...");
    
    let cfToken;
    try {
      const cfResponse = await axios.post('https:/cf.rynekoo.eu.cc/action', {  
        url: 'https://deepfakemaker.io/ai-clothes-remover/',  
        mode: 'turnstile-min',  
        siteKey: '0x4AAAAAAB6PHmfUkQvGufDI'  
      }, {
        timeout: 10000
      });
      cfToken = cfResponse.data?.data?.token;
    } catch (cfError) {
      throw new Error(`Cloudflare token failed: ${cfError.message}`);
    }

    if (!cfToken) {
      throw new Error('Failed to get security token from Cloudflare');
    }

    // Step 4: Create processing task
    console.log("🎨 Creating AI task...");
    
    let taskResponse;
    try {
      taskResponse = await instance.post('/img/v2/free/clothes/remover/task', {  
        prompt: prompt,  
        image: 'https://cdn.deepfakemaker.io/' + uploadResponse.data.data.object_name,  
        platform: 'clothes_remover',  
        user_id: userId  
      }, {  
        headers: {  
          'token': cfToken  
        }  
      });
    } catch (taskError) {
      throw new Error(`Task creation failed: ${taskError.message}`);
    }

    if (!taskResponse.data?.data?.task_id) {
      throw new Error('Failed to create processing task');
    }

    const taskId = taskResponse.data.data.task_id;
    
    // Step 5: Poll for results
    console.log("⏳ Processing... (20-40 seconds)");
    
    let attempts = 0;
    const maxAttempts = 40; // 40 * 2.5s = 100 seconds max
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const checkResponse = await instance.get('/img/v2/free/clothes/remover/task', {  
          params: {  
            user_id: userId,  
            task_id: taskId  
          }  
        });

        if (checkResponse.data?.msg === 'success' && checkResponse.data?.data?.generate_url) {
          // Success! Send the image
          console.log("✅ Processing complete! Sending result...");
          
          await client.sendMessage(from, {
            image: { url: checkResponse.data.data.generate_url },
            caption: `🖼️ AI Processed Image\nPrompt: ${prompt}`
          }, { quoted: mek });
          
          return;
        } else if (checkResponse.data?.msg === 'failed') {
          throw new Error('Processing failed on server side');
        }
        
      } catch (pollError) {
        // Log but continue polling
        console.log(`Poll attempt ${attempts} error:`, pollError.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2500)); // Wait 2.5 seconds
    }

    throw new Error('Processing timeout after 100 seconds');

  } catch (error) {
    console.error("RC Error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================


/*const API = "https://www.nanobana.net/api";
const COOKIE = "__Host-authjs.csrf-token=30520470455c3e13eaed1f36a6d404badce7ea465230c2c98e0471bb72646a4e%7C3e869582574ac97763adf0b3d383e68275475d375f1926fd551aa712e4adbd24; __Secure-authjs.callback-url=https%3A%2F%2Fwww.nanobana.net%2F%23generator; g_state={\"i_l\":0,\"i_ll\":1769401024886,\"i_b\":\"VKxqLQ5eJ0B2gQmnduZzPCwsZ1q418d0cjhhXWlbxTU\",\"i_e\":{\"enable_itp_optimization\":0}}; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiSWRmbEhwMk0teEF1V3l6Nkg1bHZrRHdOc0ZiM3BBOHVvMjNjaXhaZ1MxT1hHWUFNUUc0MGY0bW5XZnFtdWZyWnFYbHM2SFZILUZncDlvaUk5dTdIbHcifQ..lasLfR5B2_Rf2Q_F3K6fgw.Tro9GauoZdTk0Dtt_Dt6HJK5eG_OZoP66i6LKgtDzaj6v42BIhO-Hre144rB3wYfFQovDVKXyxAGG8WyP5FW_H3WTJP-it5Sm8xfmj7WWSbAzXGXPOcw-782yVRqLAK4cxuNNGVYCNJhOxLnKEAh_3bRBUHpkDmDfsnC8z5FmTtURhA32n-KiMW5zcPKKhY6haApLrOfJ3Y31NxjzVRDa-T-1vjTITsyFBsZW_WaFY8OHRz7giNl-rKbfm-OKEd_nvU0NqdnEUS_LBYN-5b7u5f1buYMdIt8M2g6YIaYwhdXIGZ-x9HpJz2API7NrhKN5tTwaN6UMPFq4ZSfEdYEWipfmUMacv5oGfW7AmaAWMoVvYs5tudzI00D_M0GE3A5F20fLFRMRgDOsI3cs5-e0TzGOTobv3D7UGau8XCrxX5exf5L6Q1C15A6xwtPpRJu1cOg1BlnOXf0gueF4sAAcg._Bl87onRhLiZFFuzC-e1_udKFzuUFVAfhW4FfmtUufE";

const HEADERS = {
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  "origin": "https://www.nanobana.net",
  "referer": "https://www.nanobana.net/",
  "cookie": COOKIE
};

async function upload(buffer) {
  const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: "jpg", mime: "image/jpeg" };
  const form = new FormData();
  form.append("file", buffer, { filename: `image.${ext}`, contentType: mime });

  const res = await axios.post(`${API}/upload/image`, form, {
    headers: { ...HEADERS, ...form.getHeaders() }
  });
  if (!res.data.url) throw new Error("❌ Upload failed");
  return res.data.url;
}

async function generate(prompt, imageUrl) {
  const res = await axios.post(`${API}/sora2/image-to-video/generate`, {
    prompt,
    image_urls: [imageUrl],
    aspect_ratio: "portrait",
    n_frames: "10",
    remove_watermark: true
  }, { headers: HEADERS });

  if (!res.data.taskId) throw new Error("❌ Failed to create task");
  return res.data.taskId;
}

async function waitTask(taskId, prompt) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await axios.get(
      `${API}/sora2/image-to-video/task/${taskId}?save=1&prompt=${encodeURIComponent(prompt)}`,
      { headers: HEADERS }
    );
    if (res.data.status === "completed") return res.data.saved?.[0]?.url;
    if (res.data.status === "failed") throw new Error(res.data.provider_raw?.data?.failMsg || "❌ Generation failed");
  }
  throw new Error("⏳ Timeout waiting for video");
}

keith({
  pattern: "image2video",
  aliases: ["imagetovideo", "i2v", "img2vid"],
  category: "Ai",
  description: "Convert quoted image to video using Sora 2",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply } = conText;

  if (!q || !quotedMsg?.imageMessage) {
    return reply("📌 Reply to an image with:\n`sora2 <prompt>`");
  }

  reply("> Generating video...");

  try {
    // Download quoted image
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = fs.readFileSync(filePath);

    // Upload image
    const imageUrl = await upload(buffer);

    // Generate task
    const taskId = await generate(q, imageUrl);

    // Wait for result
    const videoUrl = await waitTask(taskId, q);

    // Send video back
    await client.sendMessage(from, {
      video: { url: videoUrl },
      caption: `✅ Video created successfully!\n📝 Prompt: ${q}\n🎬 Model: Sora 2 Image to Video`
    }, { quoted: mek });

    fs.unlinkSync(filePath); // cleanup temp file
  } catch (e) {
    console.error("sora2 error:", e);
    await reply(`❌ Error: ${e.message}`);
  }
});*/
//========================================================================================================================

//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//======================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "gpt",
  aliases: ['ai', 'ask'],
  //react: "🤖",
  category: "gpt",
  description: "Chat with GPT AI",
}, async (from, client, conText) => {
  const { mek, reply, api, react, arg, sender, pushName } = conText;

  if (!arg || arg.length === 0) {
    await react("❓");
    return reply(`🤖 *Keith GPT AI*\n\nAsk me anything!\n\nExample: gpt What is JavaScript?`);
  }

  try {
   // await react("⏳");
    
    const question = arg.join(' ');
    
    // Get last conversation for context
    const lastConv = await getLastConversation(sender);
    let context = '';
    
    if (lastConv) {
      context = `Previous conversation:\nYou: ${lastConv.user}\nAI: ${lastConv.ai}\n\nCurrent question: ${question}`;
    }

    // Call GPT API
    const apiUrl = `${api}/ai/gpt?q=${encodeURIComponent(context || question)}`;
    const response = await axios.get(apiUrl);
    
    if (response.data.status && response.data.result) {
      const aiResponse = response.data.result;
      
      // Save conversation to database
      await saveConversation(sender, question, aiResponse);
      
      //await react("✅");
      await reply(`${aiResponse}`);
    } else {
    //  await react("❌");
      await reply("❌ Sorry, I couldn't process your request at the moment.");
    }

  } catch (error) {
    console.error("gpt error:", error);
    //await react("❌");
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "gpthistory",
  aliases: ['aihistory', 'chathistory'],
  //react: "📚",
  category: "gpt",
  description: "View GPT conversation history",
}, async (from, client, conText) => {
  const { reply, react, sender, pushName } = conText;

  try {
    await react("📚");
    
    const history = await getConversationHistory(sender, 5); // Last 5 conversations
    
    if (!history.length) {
      return reply(`📚 *Chat History*\n\nNo previous conversations found. Start chatting with *gpt <question>*`);
    }

    let historyMsg = `📚 *Chat History for ${pushName}*\n\n`;
    
    history.forEach((conv, index) => {
      const shortUser = conv.user.length > 30 ? conv.user.substring(0, 30) + '...' : conv.user;
      const shortAI = conv.ai.length > 30 ? conv.ai.substring(0, 30) + '...' : conv.ai;
      
      historyMsg += `*${index + 1}. You:* ${shortUser}\n   *AI:* ${shortAI}\n\n`;
    });

    historyMsg += `_Total conversations: ${history.length}_`;
    
    await reply(historyMsg);

  } catch (error) {
    console.error("gpt history error:", error);
    await react("❌");
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "lastchat",
  aliases: ['last conversation', 'previous chat'],
  react: "🕒",
  category: "gpt",
  description: "Get last GPT conversation",
}, async (from, client, conText) => {
  const { reply, react, sender, pushName } = conText;

  try {
  //  await react("🕒");
    
    const lastConv = await getLastConversation(sender);
    
    if (!lastConv) {
      return reply(`🕒 *Last Conversation*\n\nNo previous conversation found. Start chatting with *gpt <question>*`);
    }

    const lastChatMsg = `🕒 *Last Conversation*\n\n💬 *You:* ${lastConv.user}\n\n🤖 *AI:* ${lastConv.ai}`;
    
    await reply(lastChatMsg);

  } catch (error) {
    console.error("lastchat error:", error);
  //  await react("❌");
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "clearai",
  aliases: ['cleargpt', 'clearchat', 'deletehistory'],
  //react: "🗑️",
  category: "gpt",
  description: "Clear GPT conversation history",
}, async (from, client, conText) => {
  const { reply, react, sender, pushName } = conText;

  try {
    await react("🗑️");
    
    const cleared = await clearConversationHistory(sender);
    
    if (cleared) {
      await reply(`🗑️ *Chat History Cleared*\n\nAll your conversation history with GPT has been deleted successfully.`);
    } else {
      await reply(`ℹ️ *No History Found*\n\nYou don't have any conversation history to clear.`);
    }

  } catch (error) {
    console.error("clearai error:", error);
    await react("❌");
    await reply(`❌ Error: ${error.message}`);
  }
});

//========================================================================================================================
