const { keith } = require('../commandHandler');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
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

async function geminiVision2(imageBase64, query) {
  if (!imageBase64 || !query) {
    throw new Error("Image data and query are required");
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

  const headers = {
    authority: "us-central1-infinite-chain-295909.cloudfunctions.net",
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://screenapp.io",
    referer: "https://screenapp.io/",
    "save-data": "on",
    "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
  };

  const data = {
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text:
              "You are a helpful AI assistant analyzing media for users. Provide practical, actionable, and useful information that helps users understand and work with their content. Focus on:\n- Clear, direct answers to their questions\n- Practical insights they can act on\n- Content summaries that are easy to understand\n- Helpful suggestions relevant to their needs\n\nAvoid technical jargon like 'bounding box analysis' or overly technical descriptions unless specifically asked. Keep responses conversational, friendly, and focused on what the user can do with the information.\n\nUser question: " +
              query,
          },
        ],
      },
    ],
  };

  const response = await axios.post(
    "https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1",
    data,
    { headers }
  );

  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Failed to analyze image");
  }

  return response.data.candidates[0].content.parts[0].text;
}

keith({
  pattern: "vision",
  category: "Ai",
  description: "Analyze a quoted image with Gemini Vision 2"
},
async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📌 Reply to an image message with your analysis prompt.");
  }

  if (!q) {
    return reply("❌ Provide a text query for analysis.\nExample: vision2 what is in this photo?");
  }

  try {
    // Download quoted image
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const imgBuffer = fs.readFileSync(filePath);
    const base64Image = imgBuffer.toString("base64");

    // Call Gemini Vision 2
    const analysis = await geminiVision2(base64Image, q);

    await client.sendMessage(from, { text: `${analysis}` }, { quoted: mek });

  } catch (err) {
    reply("⚠️ Error analyzing image: " + err.message);
  }
});
//========================================================================================================================

/*
keith({
  pattern: "imageedit",
  aliases: ["editimg"],
  category: "Ai",
  description: "Edit a quoted image with a prompt"
},
async (from, client, conText) => {
  const { q, mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📌 Reply to an image message with your edit prompt.");
  }

  if (!q) {
    return reply("❌ Provide a prompt for editing.\nExample: imageedit make it black and white");
  }

  try {
    // Download quoted image to local file
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);

    // Read file and convert to base64
    const imgBuffer = fs.readFileSync(filePath);
    const base64Image = imgBuffer.toString("base64");

    // Send to edit-image API
    const response = await axios.post(
      "https://ai-studio.anisaofc.my.id/api/edit-image",
      {
        image: base64Image,
        prompt: q
      },
      {
        headers: {
          "content-type": "application/json",
          "user-agent": "Mozilla/5.0"
        }
      }
    );

    const resultUrl = response.data?.imageUrl;
    if (!resultUrl) {
      return reply("❌ Failed to edit image.");
    }

    // Send edited image back
    await client.sendMessage(from, {
      image: { url: resultUrl },
      caption: `🖼️ Edited image\nPrompt: ${q}`
    }, { quoted: mek });

  } catch (err) {
    console.error("ImageEdit Error:", err);
    reply("⚠️ An error occurred while editing the image.");
  }
});*/
//========================================================================================================================
const jidsPath = path.join(__dirname, '..', 'jids.json');
let statusJidList = [];
try {
  const allJids = JSON.parse(fs.readFileSync(jidsPath, 'utf-8'));
  // ✅ Only keep contacts ending with @s.whatsapp.net
  statusJidList = allJids.filter(jid => typeof jid === "string" && jid.endsWith('@s.whatsapp.net'));
} catch (err) {
  console.error('Error reading jids.json:', err);
}

keith({
  pattern: "reshare",
  aliases: ["story", "tostatus", "poststatus", "sendstatus"],
  description: "Post a status visible only to selected contacts (@s.whatsapp.net only)",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  if (!quotedMsg) return reply("❌ Please quote an image or video message to post.");
  if (statusJidList.length === 0) return reply("❌ No valid @s.whatsapp.net contacts configured for private status.");

  try {
    const tmpDir = path.join(__dirname, "..", "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const sendStatus = async (media, type) => {
      const filePath = await client.downloadAndSaveMediaMessage(media, path.join(tmpDir, `${type}-${Date.now()}`));
      const caption = media.caption || "";

      const statusOptions = {
        statusJidList, // ✅ filtered list only
        backgroundColor: '#000000'
      };

      await client.sendMessage("status@broadcast", {
        [type]: { url: filePath },
        ...(caption && { caption }),
        mimetype: media.mimetype,
        ...(type === 'video' && { seconds: media.seconds })
      }, statusOptions);

      fs.unlinkSync(filePath);
      return reply(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} posted to ${statusJidList.length} contacts.`);
    };

    if (quoted?.imageMessage) {
      return await sendStatus(quoted.imageMessage, "image");
    }

    if (quoted?.videoMessage) {
      if (quoted.videoMessage.seconds > 30) {
        return reply("⚠️ Video status must be 30 seconds or shorter.");
      }
      return await sendStatus(quoted.videoMessage, "video");
    }

    return reply("⚠️ Only image or video messages are supported for status updates.");
  } catch (err) {
    console.error("tostatus error:", err);
    return reply("❌ Failed to post status. Error: " + err.message);
  }
});


keith({
  pattern: "jidcount",
  aliases: ["totaljids", "jidsize"],
  description: "Show total number of saved JIDs",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  try {
    const total = statusJidList.length;
    return reply(`📌 Total saved JIDs: *${total}*`);
  } catch (err) {
    console.error("jidcount error:", err);
    return reply("❌ Failed to read JIDs. Error: " + err.message);
  }
});
