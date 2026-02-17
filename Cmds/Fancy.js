const { keith } = require('../commandHandler');
const axios = require('axios');
//const { keith } = require('../commandHandler');
//const axios = require('axios');
const fs = require('fs-extra');
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


keith({
  pattern: "sharephone",
  aliases: ["sharecontact", "spn", "sharenumber"],
  category: "tools",
  description: "Share your phone number in chat"
}, async (from, client, conText) => {
  const { q } = conText;

  try {
    // Default to current chat if no JID provided
    const jid = q && q.includes("@s.whatsapp.net") ? q : from;

    await client.sendMessage(jid, {
      sharePhoneNumber: {}
    });

  } catch (err) {
    console.error("sharephone error:", err);
  }
});
//========================================================================================================================


keith({
  pattern: "onwhatsapp",
  aliases: ["checkwa", "waexists", "wa"],
  category: "tools",
  description: "Check if a number exists on WhatsApp"
}, async (from, client, conText) => {
  const { reply, q } = conText;

  if (!q) {
    return reply("📌 Usage: .onwhatsapp <number>\n\nExample:\n.onwhatsapp 254712345678");
  }

  try {
    // Normalize number into WhatsApp JID
    const jid = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const [result] = await client.onWhatsApp(jid);

    if (result?.exists) {
      return reply(`✅ ${q} exists on WhatsApp\nJID: ${result.jid}`);
    } else {
      return reply(`❌ ${q} does not exist on WhatsApp`);
    }
  } catch (err) {
    console.error("onwhatsapp error:", err);
    return reply("❌ Failed to check WhatsApp number.");
  }
});
//========================================================================================================================

keith({
  pattern: "gitclone",
  aliases: ["zip", "repozip"],
  description: "Clone GitHub repo and return as zip",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, reply } = conText;

  if (!q) {
    return reply("📌 Provide a GitHub repo URL.\nExample: .gitclone https://github.com/Keithkeizzah/KEITH-MD");
  }

  try {
    // Normalize repo URL
    let repoUrl = q.trim();
    if (!repoUrl.startsWith("https://github.com/")) {
      return reply("❌ Only GitHub repo URLs are supported.");
    }

    // Extract owner/repo
    const parts = repoUrl.replace("https://github.com/", "").split("/");
    if (parts.length < 2) {
      return reply("❌ Invalid GitHub repo URL format.");
    }
    const owner = parts[0];
    const repo = parts[1];

    // Build archive URL (default branch = main)
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
    const fileName = `${repo}-main.zip`;

    // Download zip
    const tmpDir = path.join(__dirname, "..", "tmp");
    await fs.ensureDir(tmpDir);
    const filePath = path.join(tmpDir, fileName);

    const response = await axios.get(zipUrl, { responseType: "arraybuffer" });
    await fs.writeFile(filePath, response.data);

    // Send zip as document
    await client.sendMessage(from, {
      document: { url: filePath },
      mimetype: "application/zip",
      fileName
    }, { quoted: mek });

    // Cleanup
    try { fs.unlinkSync(filePath); } catch {}

  } catch (err) {
    console.error("gitclone error:", err);
    await reply("❌ Failed to clone repo. Error: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "fancy",
  aliases: ["fancytext", "font", "style", "fancystyle"],
  category: "tools",
  description: "Generate fancy text styles and select by number"
},
async (from, client, conText) => {
  const { q, mek, quotedMsg, reply, api } = conText;

  let text;
  if (q) {
    text = q;
  } else if (quotedMsg) {
    text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    if (!text) return reply("❌ Could not extract quoted text.");
  } else {
    return reply("📌 Provide text or reply to a message.");
  }

  try {
    // First API: get all styles
    const apiUrl = `${api}/fancytext/styles?q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl, { timeout: 60000 });

    if (!data || !Array.isArray(data.styles)) {
      return reply("❌ Failed to fetch fancy styles.");
    }

    // Build numbered list showing actual fancy results (fallback to name if blank)
    let caption = `✨ Fancy styles for: *${data.input}*\n\n`;
    data.styles.forEach((style, i) => {
      caption += `${i + 1}. ${style.result || style.name}\n`;
    });
    caption += `\n📌 Reply with the style number to get the fancy text.`;

    const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
    const messageId = sent.key.id;

    // Listen for reply with number
    client.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;

      const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
      const chatId = msg.key.remoteJid;

      if (!isReply) return;

      const num = parseInt(responseText.trim(), 10);
      if (isNaN(num) || num < 1 || num > data.styles.length) {
        return client.sendMessage(chatId, {
          text: `❌ Invalid style number. Reply with a number between 1 and ${data.styles.length}.`,
          quoted: msg
        });
      }

      try {
        // Second API: fix off-by-one by subtracting 1
        const index = num - 1;
        const styleUrl = `${api}/fancytext?q=${encodeURIComponent(text)}&style=${index}`;
        const res = await axios.get(styleUrl, { timeout: 60000 });
        const styled = res.data?.result;

        if (!styled) {
          return client.sendMessage(chatId, {
            text: "❌ Failed to generate fancy text.",
            quoted: msg
          });
        }

        await client.sendMessage(chatId, { text: styled }, { quoted: msg });
      } catch (err) {
        console.error("Fancy error:", err);
        await client.sendMessage(chatId, {
          text: `❌ Error generating fancy text: ${err.message}`,
          quoted: msg
        });
      }
    });

  } catch (error) {
    console.error("Fancy text error:", error);
    reply("⚠️ An error occurred while fetching fancy styles.");
  }
});
    
//========================================================================================================================


keith({
  pattern: "tts",
  aliases: ["say"],
  category: "tools",
  description: "Convert text or quoted message to PTT audio"
},
async (from, client, conText) => {
  const { q, mek, quotedMsg, reply, api } = conText;

  let text;
  if (q) {
    text = q;
  } else if (quotedMsg) {
  
    text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    if (!text) {
      return reply("❌ Could not extract quoted text.");
    }
  } else {
    return reply("📌 Reply to a message with text or provide text directly.");
  }

  try {
    const apiUrl = `${api}/ai/text2speech?q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl, { timeout: 60000 });
    const result = data?.result;

    if (!result || result.Error !== 0 || !result.URL) {
      return reply("❌ Failed to generate speech.");
    }

    await client.sendMessage(from, {
      audio: { url: result.URL },
      mimetype: "audio/mpeg",
      ptt: false
    }, { quoted: mek });

  } catch (error) {
    console.error("TTS error:", error);
    reply("⚠️ An error occurred while generating speech.");
  }
});
//========================================================================================================================
//
keith({
  pattern: "langcodes",
  aliases: ["langcode", "langs"],
  category: "tools",
  description: "List available language codes for translation"
},
async (from, client, conText) => {
  const { reply } = conText;

  try {
    const url = "https://raw.githubusercontent.com/Keithkeizzah/INFO/refs/heads/main/langcode.json";
    const { data } = await axios.get(url, { timeout: 100000 });

    const langs = Array.isArray(data?.languages) ? data.languages : [];
    if (langs.length === 0) {
      return reply("❌ No language codes found.");
    }

    // Build list: code → name
    const list = langs.map(l => `${l.code} → ${l.name}`).join("\n");

    reply(`🌐 Available Language Codes:\n\n${list}`);
  } catch (err) {
    console.error("Langcodes error:", err);
    reply("❌ Failed to fetch language codes.");
  }
});
//========================================================================================================================
keith({
  pattern: "translate",
  aliases: ["trt", "tl"],
  category: "tools",
  description: "Translate quoted text into target language"
},
async (from, client, conText) => {
  const { q, quotedMsg, reply, api } = conText;

  if (!quotedMsg) {
    return reply("📌 Reply to a message with `.translate <langcode>`");
  }

  if (!q || typeof q !== "string") {
    return reply("❌ Missing target language code. Example: `.translate en`");
  }

  try {
    // Extract text from quoted message
    const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    if (!text) {
      return reply("❌ Could not extract quoted text.");
    }

    // Call translate API
    const apiUrl = `${api}/translate?text=${encodeURIComponent(text)}&to=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl, { timeout: 100000 });

    const result = data?.result;
    if (!result?.translatedText) {
      return reply("❌ Translation failed.");
    }

    // Reply with translated text only
    reply(result.translatedText);
  } catch (err) {
    console.error("Translate error:", err);
    reply("❌ Error translating text.");
  }
});
