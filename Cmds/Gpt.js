
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


keith({
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
      const cfResponse = await axios.post('https://x1st-cf.hf.space/action', {  
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


const API = "https://www.nanobana.net/api";
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
});
//========================================================================================================================

const config = {
  bypassUrl: "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
  siteKey: "0x4AAAAAACLCCZe3S9swHyiM",
  targetUrl: "https://photoeditorai.io",
  createUrl: "https://api.photoeditorai.io/pe/photo-editor/create-job-v2",
  jobUrl: "https://api.photoeditorai.io/pe/photo-editor/get-job/"
};

const headers = {
  "product-serial": "94177bd5f370f2b4e54dd44668d58c35",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
  "origin": "https://photoeditorai.io",
  "referer": "https://photoeditorai.io/"
};

async function getTurnstileToken() {
  const res = await axios.get(`${config.bypassUrl}?url=${encodeURIComponent(config.targetUrl)}&siteKey=${config.siteKey}`);
  const data = res.data;
  if (!data.success) throw new Error("❌ Security verification failed");
  return data.result;
}

async function createJob(media, mime, prompt, token) {
  const form = new FormData();
  form.append("model_name", "nano_banana_pro");
  form.append("turnstile_token", token);
  form.append("target_images", media, { filename: "image.jpg", contentType: mime });
  form.append("prompt", prompt);
  form.append("ratio", "match_input_image");
  form.append("image_resolution", "1K");

  const res = await axios.post(config.createUrl, form, {
    headers: { ...headers, ...form.getHeaders() }
  });
  const data = res.data;
  if (data.code !== 100000) throw new Error(`❌ Failed to create job: ${data.message || "Unknown"}`);
  return data.result.job_id;
}

async function pollJobResult(jobId) {
  const maxAttempts = 150;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await axios.get(`${config.jobUrl}${jobId}`, { headers });
    const data = res.data;

    if (data.code !== 100000) throw new Error(`❌ Error: ${data.message}`);
    if (data.result.error) throw new Error(`❌ ${data.result.error}`);

    if (data.result.status === 2 && data.result.output?.length > 0) {
      return data.result.output[0];
    }
  }
  throw new Error("❌ Failed to process image (timeout)");
}

async function processImage(media, mime, prompt) {
  const token = await getTurnstileToken();
  const jobId = await createJob(media, mime, prompt, token);
  const imageUrl = await pollJobResult(jobId);

  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

keith({
  pattern: "imageedit2",
  aliases: ["nanobananapro", "nabpro", "editimg"],
  category: "Ai",
  description: "Edit a quoted image with a prompt (NanoBanana Pro)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg?.imageMessage) {
    return reply("📌 Reply to an image with:\n`imageedit2 <prompt>`");
  }
  if (!q) {
    return reply("❌ Provide a prompt!\nExample: imageedit2 make it black and white");
  }

  reply("> Processing image...");

  try {
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = fs.readFileSync(filePath);

    const editedBuffer = await processImage(buffer, "image/jpeg", q);

    await client.sendMessage(from, {
      image: editedBuffer,
      caption: `✅ Edited image\n📝 Prompt: ${q}`
    }, { quoted: mek });

    fs.unlinkSync(filePath); // cleanup temp file
  } catch (e) {
    console.error("imageedit2 error:", e);
    await reply(typeof e === "string" ? e : `❌ Error: ${e.message}`);
  }
});
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
