

const { keith } = require('../commandHandler');
const axios = require('axios');
const https = require('https');
const FormData = require('form-data');

const reso = {
  portrait: { width: 768, height: 1344 },
  landscape: { width: 1344, height: 768 },
  square: { width: 1024, height: 1024 },
  ultra: { width: 1536, height: 1536 },
  tall: { width: 832, height: 1344 },
  wide: { width: 1344, height: 832 }
};

keith({
  pattern: "bing",
  aliases: ["text2image", "text2img", "aiimage", "imggen"],
  category: "ai",
  description: "Generate AI image from text prompt"
}, async (from, client, conText) => {
  const { q, reply, mek } = conText;

  if (!q) {
    return reply(
      "Please provide a prompt and optional resolution.\n" +
      "Example:\n" +
      "• text2img cute cat\n" +
      "• text2img cute cat|square\n" +
      "• text2img cute cat|landscape\n" +
      "• text2img cute cat|tall\n" +
      "• text2img cute cat|ultra"
    );
  }

  // Parse arguments
  const queryParts = q.split("|");
  const prompt = queryParts[0].trim();
  const resolution = queryParts[1]?.trim().toLowerCase() || "portrait";
  const upscale = 2;

  if (!reso[resolution]) {
    const validResolutions = Object.keys(reso).join(", ");
    return reply(`Invalid resolution. Available options: ${validResolutions}`);
  }

  try {
    await reply(`🔄 Generating image for: *"${prompt}"* (${resolution})...`);

    const { width, height } = reso[resolution];

    const form = new FormData();
    form.append("Prompt", prompt);
    form.append("Language", "eng_Latn");
    form.append("Size", `${width}x${height}`);
    form.append("Upscale", upscale.toString());
    form.append("Batch_Index", "0");

    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(
      "https://api.zonerai.com/zoner-ai/txt2img",
      form,
      {
        httpsAgent: agent,
        headers: {
          ...form.getHeaders(),
          Origin: "https://zonerai.com",
          Referer: "https://zonerai.com/",
          "User-Agent": "Mozilla/5.0"
        },
        responseType: "arraybuffer"
      }
    );

    const buffer = Buffer.from(response.data);
    const caption = `🎨 AI Generated Image\n\n*Prompt:* ${prompt}\n*Resolution:* ${resolution} (${width}x${height})`;

    await client.sendMessage(from, {
      image: buffer,
      caption,
      mimetype: "image/jpeg"
    }, { quoted: mek });

  } catch (err) {
    console.error("Error generating image:", err);
    await reply(`❌ Failed to generate image. Error: ${err.message}`);
  }
});
