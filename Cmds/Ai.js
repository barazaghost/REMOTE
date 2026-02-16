
const { keith } = require('../commandHandler');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const mime = require('mime-types');

//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//const axios = require('axios');

const STYLES = {
  flataipro: 'Flat AI Pro',
  flatai: 'Flat AI Base',
  runware_quality: 'Standard',
  runware_new_quality: 'Quality+',
  realistic: 'Realistic',
  photo_skin: 'Real Skin',
  cinema: 'Cinematic',
  retro_anime: 'Retro Anime',
  'ghibli-style': 'Ghibli Style',
  midjourney_art: 'Midjourney Art',
  fantasy_armor: 'Fantasy Armor',
  robot_cyborg: 'Robot & Cyborg',
  disney_princess: 'Princess',
  amateurp: 'Daily Life',
  scifi_enviroments: 'Sci-Fi Environments',
  mythic_fantasy: 'Mythic Fantasy',
  pixel_art: 'Pixel Art',
  watercolor_painting: 'Watercolor Painting',
  diesel_punk: 'Diesel Punk',
  architectural: 'Architectural',
  style_1930s: '1930s',
  flat_anime: 'Flat Anime',
  mystical_realms: 'Mystical Realms',
  ecommerce: 'E-Commerce',
  cinema_style: 'Cinema'
};

async function getNonce() {
  try {
    const { data } = await axios.get('https://flatai.org/ai-image-generator-free-no-signup/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'
      }
    });

    const nonce =
      data.match(/ai_generate_image_nonce["']\s*:\s*["']([a-f0-9]{10})["']/i)?.[1] ||
      data.match(/"nonce"\s*:\s*"([a-f0-9]{10})"/i)?.[1];
    
    if (!nonce) throw new Error('Nonce not found');
    return nonce;
  } catch (error) {
    console.error('GetNonce Error:', error);
    throw new Error('Failed to get nonce');
  }
}

// Main AI Image Generator Command
keith({
  pattern: "aiphoto",
  aliases: ["flatai", "generate", "aimage"],
  category: "Aiphoto",
  description: "Generate AI images with various styles"
},
async (from, client, conText) => {
  const { q, reply, mek } = conText;

  if (!q) {
    const styleList = Object.entries(STYLES)
      .map(([key, name]) => `• ${key}: ${name}`)
      .join('\n');
    
    return reply(`🎨 *AI Photo Generator*\n\n*Usage:* .aiphoto prompt | style\n*Example:* .aiphoto cute cat | ghibli-style\n\n*Available Styles:*\n${styleList}\n\n*Quick Examples:*\n.aiphoto anime girl | retro_anime\n.aiphoto fantasy landscape | mythic_fantasy\n.aiphoto portrait | realistic`);
  }

  try {
    await reply("🎨 Generating AI image...");

    // Parse prompt and style
    const parts = q.split('|').map(p => p.trim());
    const prompt = parts[0];
    const style = parts[1] || 'realistic'; // Default style
    
    if (!prompt) {
      return reply("❌ Please provide a prompt!\nExample: .aiphoto beautiful sunset");
    }

    // Validate style
    if (!STYLES[style]) {
      const validStyles = Object.keys(STYLES).join(', ');
      return reply(`❌ Invalid style! Available: ${validStyles}`);
    }

    // Get nonce
    const nonce = await getNonce();

    // Prepare request
    const body = new URLSearchParams({
      action: 'ai_generate_image',
      nonce,
      prompt,
      aspect_ratio: '1:1',
      seed: Math.floor(Math.random() * 4294967295),
      style_model: style
    }).toString();

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://flatai.org',
      'Referer': 'https://flatai.org/ai-image-generator-free-no-signup/'
    };

    // Generate image
    const response = await axios.post(
      'https://flatai.org/wp-admin/admin-ajax.php',
      body,
      { headers, timeout: 30000 }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.data?.message || 'Generation failed');
    }

    const imageUrl = response.data.data.images?.[0];
    if (!imageUrl) {
      throw new Error('No image URL received');
    }

    // Send the generated image
    await client.sendMessage(from, {
      image: { url: imageUrl },
      caption: `🖼️ *AI Generated Image*\n\n*Prompt:* ${prompt}\n*Style:* ${STYLES[style]}\n*Model:* flatai.org`
    }, { quoted: mek });

  } catch (error) {
    console.error("AIPhoto Error:", error);
    reply(`❌ Failed to generate image: ${error.message}`);
  }
});

/*// Style-specific commands for quick access
Object.keys(STYLES).forEach(style => {
  keith({
    pattern: style,
    aliases: [style.replace(/_/g, '')],
    category: "Aiphoto",
    description: `Generate AI image with ${STYLES[style]} style`
  },
  async (from, client, conText) => {
    const { q, reply, mek } = conText;

    if (!q) {
      return reply(`🎨 *${STYLES[style]} Style*\n\nUsage: .${style} your prompt\nExample: .${style} beautiful landscape\n\nStyle: ${STYLES[style]}`);
    }

    try {
      await reply(`🎨 Generating ${STYLES[style]} image...`);

      // Get nonce
      const nonce = await getNonce();

      // Prepare request
      const body = new URLSearchParams({
        action: 'ai_generate_image',
        nonce,
        prompt: q,
        aspect_ratio: '1:1',
        seed: Math.floor(Math.random() * 4294967295),
        style_model: style
      }).toString();

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://flatai.org',
        'Referer': 'https://flatai.org/ai-image-generator-free-no-signup/'
      };

      // Generate image
      const response = await axios.post(
        'https://flatai.org/wp-admin/admin-ajax.php',
        body,
        { headers, timeout: 30000 }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.data?.message || 'Generation failed');
      }

      const imageUrl = response.data.data.images?.[0];
      if (!imageUrl) {
        throw new Error('No image URL received');
      }

      // Send the generated image
      await client.sendMessage(from, {
        image: { url: imageUrl },
        caption: `🖼️ *${STYLES[style]} Style*\n\n*Prompt:* ${q}\n*Style:* ${STYLES[style]}\n*Model:* flatai.org`
      }, { quoted: mek });

    } catch (error) {
      console.error(`${style} Error:`, error);
      reply(`❌ Failed to generate ${STYLES[style]} image: ${error.message}`);
    }
  });
});*/
//========================================================================================================================


/*const STYLES = {
  flataipro: 'Flat AI Pro',
  flatai: 'Flat AI Base',
  runware_quality: 'Standard',
  runware_new_quality: 'Quality+',
  realistic: 'Realistic',
  photo_skin: 'Real Skin',
  cinema: 'Cinematic',
  retro_anime: 'Retro Anime',
  'ghibli-style': 'Ghibli Style',
  midjourney_art: 'Midjourney Art',
  fantasy_armor: 'Fantasy Armor',
  robot_cyborg: 'Robot & Cyborg',
  disney_princess: 'Princess',
  amateurp: 'Daily Life',
  scifi_enviroments: 'Sci-Fi Environments',
  mythic_fantasy: 'Mythic Fantasy',
  pixel_art: 'Pixel Art',
  watercolor_painting: 'Watercolor Painting',
  diesel_punk: 'Diesel Punk',
  architectural: 'Architectural',
  style_1930s: '1930s',
  flat_anime: 'Flat Anime',
  mystical_realms: 'Mystical Realms',
  ecommerce: 'E-Commerce',
  cinema_style: 'Cinema'
};

async function getNonce() {
  try {
    const { data } = await axios.get('https://flatai.org/ai-image-generator-free-no-signup/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'
      }
    });

    const nonce =
      data.match(/ai_generate_image_nonce["']\s*:\s*["']([a-f0-9]{10})["']/i)?.[1] ||
      data.match(/"nonce"\s*:\s*"([a-f0-9]{10})"/i)?.[1];
    
    if (!nonce) throw new Error('Nonce not found');
    return nonce;
  } catch (error) {
    console.error('GetNonce Error:', error);
    throw new Error('Failed to get nonce');
  }
}

// Main AI Image Generator Command
keith({
  pattern: "aiphoto",
  aliases: ["flatai", "generate"],
  category: "Aiphoto",
  description: "Generate AI images with various styles"
},
async (from, client, conText) => {
  const { q, reply, mek } = conText;

  if (!q) {
    const styleList = Object.entries(STYLES)
      .map(([key, name]) => `• ${key}: ${name}`)
      .join('\n');
    
    return reply(`🎨 *AI Photo Generator*\n\n*Usage:* .aiphoto prompt | style\n*Example:* .aiphoto cute cat | ghibli-style\n\n*Available Styles:*\n${styleList}\n\n*Quick Examples:*\n.aiphoto anime girl | retro_anime\n.aiphoto fantasy landscape | mythic_fantasy\n.aiphoto portrait | realistic`);
  }

  try {
    await reply("🎨 Generating AI image...");

    // Parse prompt and style
    const parts = q.split('|').map(p => p.trim());
    const prompt = parts[0];
    const style = parts[1] || 'realistic'; // Default style
    
    if (!prompt) {
      return reply("❌ Please provide a prompt!\nExample: .aiphoto beautiful sunset");
    }

    // Validate style
    if (!STYLES[style]) {
      const validStyles = Object.keys(STYLES).join(', ');
      return reply(`❌ Invalid style! Available: ${validStyles}`);
    }

    // Get nonce
    const nonce = await getNonce();

    // Prepare request
    const body = new URLSearchParams({
      action: 'ai_generate_image',
      nonce,
      prompt,
      aspect_ratio: '1:1',
      seed: Math.floor(Math.random() * 4294967295),
      style_model: style
    }).toString();

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://flatai.org',
      'Referer': 'https://flatai.org/ai-image-generator-free-no-signup/'
    };

    // Generate image
    const response = await axios.post(
      'https://flatai.org/wp-admin/admin-ajax.php',
      body,
      { headers, timeout: 30000 }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.data?.message || 'Generation failed');
    }

    const imageUrl = response.data.data.images?.[0];
    if (!imageUrl) {
      throw new Error('No image URL received');
    }

    // Send the generated image
    await client.sendMessage(from, {
      image: { url: imageUrl },
      caption: `🖼️ *AI Generated Image*\n\n*Prompt:* ${prompt}\n*Style:* ${STYLES[style]}\n*Model:* flatai.org`
    }, { quoted: mek });

  } catch (error) {
    console.error("AIPhoto Error:", error);
    reply(`❌ Failed to generate image: ${error.message}`);
  }
});*/


//========================================================================================================================
keith({
  pattern: "mistral",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/mistral?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "claudeai",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/claudeai?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "bard",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/bard?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "perplexity",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/perplexity?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "o3",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/o3?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "chatgpt4",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/chatgpt4?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "venice",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/venice?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "qwenai",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`${api}/ai/qwenai?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "metai",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/metai?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "blackbox",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/blackbox?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "ilama",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/ilama?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "gemini",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/gemini?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "deepseek",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/deepseek?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "grok",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/grok?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
  }
});
//========================================================================================================================
keith({
  pattern: "keithai",
  category: "Ai",
  description: "Query  via Keith's API"
}, async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query");

  try {
    const res = await axios.get(`https://apiskeith.top/keithai?q=${encodeURIComponent(q)}`);

    if (res.data?.status) {
      reply(res.data.result); 
    } else {
      reply("API returned an error.");
    }
  } catch (err) {
    console.error("claudeai error:", err);
    reply("⚠️ Failed .");
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
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================


function genSerial() {
  let s = "";
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

async function upscaleImage(buffer) {
  const serial = genSerial();

  const form = new FormData();
  form.append("original_image_file", buffer, "image.jpg");
  form.append("upscale_type", "8");

  // Create job
  const createRes = await axios.post(
    "https://api.imgupscaler.ai/api/image-upscaler/v2/upscale/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
        "product-serial": serial,
        timezone: "Asia/Jakarta",
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/"
      }
    }
  );

  const create = createRes.data;
  if (create.code !== 100000) throw new Error("❌ Failed to create upscale job");

  const jobId = create.result.job_id;

  // Poll until job completes
  while (true) {
    await new Promise(r => setTimeout(r, 3000));

    const res = await axios.get(
      `https://api.imgupscaler.ai/api/image-upscaler/v1/universal_upscale/get-job/${jobId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          "product-serial": serial,
          origin: "https://imgupscaler.ai",
          referer: "https://imgupscaler.ai/"
        }
      }
    );

    const json = res.data;
    if (
      json.code === 100000 &&
      json.message?.en === "Image generated successfully."
    ) {
      return json.result.output_url;
    }
  }
}

keith({
  pattern: "hd",
  aliases: ["upscale", "enhance", "hdimage", "superres"],
  description: "Upscale quoted image to HD",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Reply to an image message to upscale it.");
  if (!quoted?.imageMessage) return reply("❌ Only image messages are supported.");

  let filePath;
  try {
    // Save quoted image locally
    filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const buffer = await fs.readFile(filePath);

    // Upscale
    const upscaledUrl = await upscaleImage(buffer);

    // Send back upscaled image
    await client.sendMessage(from, { image: { url: upscaledUrl }, caption: "🔼 HD Upscaled" }, { quoted: mek });

  } catch (err) {
    console.error("HD Upscale error:", err);
    await reply("❌ Failed to upscale image. Try again.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});
//========================================================================================================================


keith({
  pattern: "sora",
  aliases: ["text2video", "t2v"],
  category: "AI",
  description: "Generate video from text using Sora API"
},
async (from, client, conText) => {
  const { q, mek, reply } = conText;

  if (!q) {
    return reply("❌ Provide a query, e.g. .sora monkey running");
  }

  try {
    const apiUrl = `https://apiskeith.top/text2video?q=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 120000 });
    const result = response.data?.results;

    if (!result) {
      return reply("❌ No video result found.");
    }

    await client.sendMessage(from, {
      video: { url: result },
      mimetype: "video/mp4",
      caption: `result for: ${q}`
    }, { quoted: mek });

  } catch (error) {
    console.error("Sora error:", error);
    reply("❌ Failed to fetch Sora video: " + error.message);
  }
});

//========================================================================================================================

keith({
  pattern: "flux",
  aliases: ["fluxai", "imageai"],
  category: "ai",
  description: "Generate an image using Flux API"
},
async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query, e.g. .flux dog");

  try {
    // Call Flux API (returns raw image)
    const res = await axios.get(`https://apiskeith.top/ai/flux?q=${encodeURIComponent(q)}`, {
      responseType: "arraybuffer"
    });

    // Save temporarily
    const filePath = "./flux_img.jpg";
    fs.writeFileSync(filePath, res.data);

    // Send image to chat
    await client.sendMessage(from, { image: { url: filePath }, caption: `Flux result for: ${q}` });

    // Clean up
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("flux Error:", err);
    reply("❌ Failed to fetch Flux image: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "speechwriter",
  aliases: ["speech", "writer"],
  category: "ai",
  description: "Generate a speech using the Speechwriter API"
},
async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) {
    return reply("❌ Provide a topic, e.g. .speechwriter how to pass exam");
  }

  try {
    // Defaults
    const length = "short";
    const type = "dedication";
    const tone = "serious";

    // Build API URL with defaults
    const url = `https://apiskeith.top/ai/speechwriter?topic=${encodeURIComponent(q)}&length=${length}&type=${type}&tone=${tone}`;

    // Call API
    const res = await axios.get(url);

    if (!res.data || !res.data.status || !res.data.result?.data?.data?.speech) {
      return reply("❌ Speechwriter API returned an invalid response.");
    }

    const speech = res.data.result.data.data.speech;

    // Reply with the speech
    reply(speech);
  } catch (err) {
    console.error("speechwriter Error:", err);
    reply("❌ Failed to fetch speech: " + err.message);
  }
});

//========================================================================================================================

keith({
  pattern: "muslimai",
  aliases: ["muslim", "quranai"],
  category: "ai",
  description: "Query MuslimAI API for Qur'anic references"
},
async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query, e.g. .muslimai who is Allah");

  try {
    // Call MuslimAI API
    const res = await axios.get(`https://apiskeith.top/ai/muslim?q=${encodeURIComponent(q)}`);

    if (!res.data || !res.data.status || !res.data.result) {
      return reply("❌ MuslimAI API returned an invalid response.");
    }

    const results = res.data.result.results;

    if (!results || results.length === 0) {
      return reply("ℹ️ No relevant verses found.");
    }

    // Format top 3 results
    let output = `📖 *MuslimAI Results for:* ${res.data.result.query}\n\n`;
    results.slice(0, 3).forEach((r, i) => {
      output += `*${i + 1}. Surah ${r.surah_title}*\n${r.content.trim()}\n🔗 ${r.surah_url}\n\n`;
    });

    reply(output.trim());
  } catch (err) {
    console.error("muslimai Error:", err);
    reply("❌ Failed to fetch MuslimAI response: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "wormgpt",
  aliases: ["wgpt", "evilgpt"],
  category: "ai",
  description: "Interact with WormGPT API"
},
async (from, client, conText) => {
  const { q, reply } = conText;

  if (!q) return reply("❌ Provide a query, e.g. .wormgpt hi");

  try {
    // Call WormGPT API
    const res = await axios.get(`https://apiskeith.top/ai/wormgpt?q=${encodeURIComponent(q)}`);

    if (!res.data || !res.data.status) {
      return reply("❌ WormGPT API returned an invalid response.");
    }

    const output = res.data.result;

    // Reply with the result
    reply(output);
  } catch (err) {
    console.error("wormgpt Error:", err);
    reply("❌ Failed to fetch WormGPT response: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "bibleai",
  aliases: ["aibible", "scripture"],
  description: "Ask Bible-based questions and get answers with references",
  category: "ai",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek } = conText;

  if (!q) return reply("📖 Ask a Bible question.\n\nExample: bibleai what is faith");

  try {
    const res = await axios.get(`https://apiskeith.top/ai/bible?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.results?.data?.answer) {
      return reply("❌ No Bible answer found.");
    }

    const answer = data.result.results.data.answer;
    const sources = data.result.results.data.sources;

    const caption = `📖 *${q}*\n\n${answer}\n\n📌 *Sources:* Reply with a number to view\n` +
      sources.map((src, i) => {
        if (src.type === "verse") return `${i + 1}. 📜 ${src.text}`;
        if (src.type === "article") return `${i + 1}. 📘 ${src.title}`;
      }).join("\n");

    const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
    const messageId = sent.key.id;

    client.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;

      const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
      const chatId = msg.key.remoteJid;

      if (!isReply) return;

      const index = parseInt(responseText.trim()) - 1;
      const selected = sources[index];

      if (!selected) {
        return client.sendMessage(chatId, {
          text: "❌ Invalid number. Reply with a valid source number.",
          quoted: msg
        });
      }

      await client.sendMessage(chatId, { react: { text: "📖", key: msg.key } });

      if (selected.type === "verse") {
        const ref = selected.bcv.referenceLong.replace(/\s+/g, "").replace(":", ":");
        try {
          const verseRes = await axios.get(`https://apiskeith.top/search/bible?q=${encodeURIComponent(ref)}`);
          const verseData = verseRes.data;

          if (!verseData.status || !verseData.result?.verses) {
            return client.sendMessage(chatId, {
              text: `❌ Couldn't fetch verse: ${selected.text}`,
              quoted: msg
            });
          }

          const verses = verseData.result.verses.map(v =>
            `📖 *${v.book} ${v.chapter}:${v.verse}*\n${v.text}`
          ).join("\n\n");

          await client.sendMessage(chatId, { text: verses }, { quoted: msg });
        } catch (err) {
          console.error("Verse fetch error:", err);
          await client.sendMessage(chatId, {
            text: "❌ Error fetching verse text.",
            quoted: msg
          });
        }
      } else if (selected.type === "article") {
        await client.sendMessage(chatId, {
          image: { url: selected.image },
          caption: `📘 *${selected.title}*\n\n${selected.text}\n\n🔗 ${selected.url}`
        }, { quoted: msg });
      }
    });
  } catch (err) {
    console.error("bibleai error:", err);
    reply("❌ Error fetching Bible answer: " + err.message);
  }
});
//==============================================================================



function getMediaType(quoted) {
  if (quoted.imageMessage) return "image";
  if (quoted.videoMessage) return "video";
  if (quoted.stickerMessage) return "sticker";
  if (quoted.audioMessage) return "audio";
  if (quoted.documentMessage) return "document";
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
keith({
  pattern: "removebg",
  aliases: ["rmbg", "bgremove"],
  description: "Remove background from quoted image",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Reply to an image message to remove its background");

  const type = getMediaType(quotedMsg);
  if (type !== "image") return reply("❌ Only image messages are supported");

  const mediaNode = quoted?.imageMessage;
  if (!mediaNode) return reply("❌ Could not extract image content");

  let filePath;
  try {
    // Save quoted image locally
    filePath = await saveMediaToTemp(client, mediaNode, type);

    // Upload to Uguu to get a public URL
    const imageUrl = await uploadToUguu(filePath);

    // Call removebg API
    const { data: result } = await axios.get(
      `https://apiskeith.top/ai/removebg?url=${encodeURIComponent(imageUrl)}`
    );

    if (!result?.status || !result?.result) {
      return reply("❌ No response from RemoveBG API");
    }

    const cutoutUrl = result.result;

    // Send back the processed image
    await client.sendMessage(from, { image: { url: cutoutUrl } }, { quoted: mek });

  } catch (err) {
    console.error("RemoveBG error:", err);
    await reply("❌ Failed to remove background. Try a different image.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});


//========================================================================================================================

keith({
  pattern: "vision2",
  aliases: ["imgai", "analyze", "geminivision"],
  description: "Analyze quoted image using Gemini Vision AI",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, q } = conText;

  if (!quotedMsg) return reply("📌 Reply to an image message to analyze it");
  if (!q || typeof q !== "string") return reply("❌ Missing query. Use q='your question'");

  const type = getMediaType(quotedMsg);
  if (type !== "image") return reply("❌ Only image messages are supported");

  const mediaNode = quoted?.imageMessage;
  if (!mediaNode) return reply("❌ Could not extract image content");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const imageUrl = await uploadToUguu(filePath);

    const { data: result } = await axios.get(`https://apiskeith.top/ai/gemini-vision?image=${encodeURIComponent(imageUrl)}&q=${encodeURIComponent(q)}`);
    if (!result?.status || !result?.result) return reply("❌ No response from Vision AI");

    await client.sendMessage(from, { text: result.result }, { quoted: mek });

  } catch (err) {
    console.error("Vision AI error:", err);
    await reply("❌ Failed to analyze image. Try a different one.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});
//========================================================================================================================



keith({
  pattern: "imageedit",
  aliases: ["editimg", "imgedit"],
  description: "Edit a quoted image with a prompt",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Reply to an image with your edit prompt.");
  if (!q) return reply("❌ Provide a prompt!\nExample: imageedit make it black and white");

  const type = getMediaType(quotedMsg);
  if (type !== "image") return reply("❌ Only image messages are supported");

  const mediaNode = quoted?.imageMessage;
  if (!mediaNode) return reply("❌ Could not extract image content");

  let filePath;
  try {
    reply("> Processing image edit...");

    // Save quoted image to temp
    filePath = await saveMediaToTemp(client, mediaNode, type);

    // Upload to Uguu
    const mediaUrl = await uploadToUguu(filePath);

    // Call your API
    const { data: result } = await axios.get(
      `https://apiskeith.top/ai/imageedit?q=${encodeURIComponent(q)}&url=${encodeURIComponent(mediaUrl)}`
    );

    if (!result?.status || !result?.result) return reply("❌ Failed to edit image");

    // Send edited image back
    await client.sendMessage(from, {
      image: { url: result.result },
      caption: `✅ Edited image\n📝 Prompt: ${q}`
    }, { quoted: mek });

  } catch (err) {
    console.error("imageedit error:", err);
    await reply("❌ Failed to edit image. Try again with a different prompt or image.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});
//========================================================================================================================


keith({
  pattern: "vocalremover",
  aliases: ["removevocal", "aivocal", "extractvocal"],
  description: "Extract vocals from quoted audio or video",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, botname, botPic } = conText;

  if (!quotedMsg) return reply("📌 Reply to an audio or video message to extract vocals");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type");

  const mediaNode = quoted?.[`${type}Message`];
  if (!mediaNode) return reply("❌ Could not extract media content");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const mediaUrl = await uploadToUguu(filePath);

    const { data: result } = await axios.get(`https://apiskeith.top/ai/vocalremover?url=${mediaUrl}`);
    if (!result?.status || !result?.result?.vocal) return reply("❌ No vocal track found");

    const vocalUrl = result.result.vocal;

    await client.sendMessage(from, {
      audio: { url: vocalUrl },
      mimetype: "audio/mpeg",
      fileName: "vocal.mp3",
      ptt: false,
      caption: `🎤 *${botname} Vocal Remover*\nExtracted vocals from your clip`,
      contextInfo: {
        externalAdReply: {
          title: `${botname} Vocal Remover`,
          body: "AI powered vocal extraction",
          mediaType: 2,
          thumbnailUrl: botPic,
          sourceUrl: "https://keithsite.vercel.app"
        }
      }
    }, { quoted: mek });

  } catch (err) {
    console.error("VocalRemover error:", err);
    await reply("❌ Failed to extract vocals. Try with a shorter or fresh clip.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});
//========================================================================================================================

keith({
  pattern: "transcribe",
  aliases: ["speech", "audio2text", "whisper"],
  description: "Transcribe quoted audio or video to text",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Reply to an audio or video message to transcribe it");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type");

  const mediaNode = quoted?.[`${type}Message`];
  if (!mediaNode) return reply("❌ Could not extract media content");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const mediaUrl = await uploadToUguu(filePath);

    const { data: result } = await axios.get(`https://apiskeith.top/ai/transcribe?q=${encodeURIComponent(mediaUrl)}`);
    if (!result?.status || !result?.result?.text) return reply("❌ No transcription found");

    await client.sendMessage(from, { text: result.result.text }, { quoted: mek });

  } catch (err) {
    console.error("Transcription error:", err);
    await reply("❌ Failed to transcribe. Try a shorter or clearer clip.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});

//========================================================================================================================

keith({
  pattern: "shazam",
  aliases: ["identify", "whatmusic", "whatsong"],
  description: "Identify music from quoted audio or video",
  category: "Ai",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, botname } = conText;

  if (!quotedMsg) return reply("📌 Reply to an audio or video message to identify music");

  const type = getMediaType(quotedMsg);
  if (type === "unknown") return reply("❌ Unsupported media type");

  const mediaNode = quoted?.[`${type}Message`];
  if (!mediaNode) return reply("❌ Could not extract media content");

  let filePath;
  try {
    filePath = await saveMediaToTemp(client, mediaNode, type);
    const mediaUrl = await uploadToUguu(filePath);

    const { data: result } = await axios.get(`https://apiskeith.top/ai/shazam?url=${mediaUrl}`);
    if (!result?.status || !result?.result?.title) return reply("❌ No music info found");

    const { title, artists, album, release_date } = result.result;

    let txt = `*${botname} Music ID*\n\n`;
    txt += `*Title:* ${title}\n`;
    if (artists?.length) txt += `*Artists:* ${artists.join(', ')}\n`;
    if (album) txt += `*Album:* ${album}\n`;
    if (release_date) txt += `*Release Date:* ${release_date}`;

    await client.sendMessage(from, { text: txt }, { quoted: mek });

  } catch (err) {
    console.error("Shazam error:", err);
    await reply("❌ Failed to identify music. Try with a shorter or fresh clip.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});
