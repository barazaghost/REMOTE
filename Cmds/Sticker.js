
const { keith } = require('../commandHandler');
const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
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
  pattern: "attp",
  aliases: ["texttosticker", "txtsticker"],
  description: "Convert text to animated sticker (ATTp)",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, reply, pushName, author } = conText;

  if (!q) {
    return reply(`📌 *ATTp - Any Text To Sticker*
    
Convert any text to an animated WhatsApp sticker!

*Usage:*
.attp keith
.attp Hello World
.attp I love you

*Aliases:* .texttosticker, .txtsticker`);
  }

  const encodedText = encodeURIComponent(q);
  const apiUrl = `https://api.deline.web.id/maker/attp?text=${encodedText}`;

  try {
  //  await reply(`🎨 Converting *${q.substring(0, 30)}* to animated sticker...`);

    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    if (!response.data || response.data.byteLength < 100) {
      return reply("❌ Failed to generate sticker! Try different text.");
    }

    const sticker = new Sticker(response.data, {
      pack: pushName || "ATTp Pack",
      author: author || "WhatsApp Bot",
      type: StickerTypes.FULL,
      categories: ["✨", "📝", "🎨"],
      id: `attp-${Date.now()}`,
      quality: 85,
      background: "#FFFFFF"
    });

    const stickerBuffer = await sticker.toBuffer();
    
    await client.sendMessage(from, { 
      sticker: stickerBuffer 
    }, { quoted: mek });

  } catch (err) {
    console.error("attp error:", err);
    await reply("❌ Failed to generate sticker! Please try again.");
  }
});
//========================================================================================================================
keith({
  pattern: "egif",
  aliases: ["emojisticker", "emojigif", "emosticker"],
  description: "Convert emoji to animated sticker (GIF)",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, reply, pushName, author } = conText;

  if (!q) {
    return reply("📌 Provide an emoji!\nExample: .emojisticker 😂\nExample: .emojisticker 🎉");
  }

  // Get first emoji from input
  const emojiMatch = q.match(/([\p{Emoji_Presentation}|\p{Extended_Pictographic}])/u);
  if (!emojiMatch) {
    return reply("❌ Please provide a valid emoji!");
  }

  const emoji = emojiMatch[0];
  const emojiCode = emoji.codePointAt(0).toString(16);
  const gifUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiCode}/512.gif`;

  try {
 //   await reply(`🎨 Converting ${emoji} to animated sticker...`);

    // Download the GIF
    const response = await axios.get(gifUrl, {
      responseType: 'arraybuffer'
    });

    if (!response.data) {
      return reply("❌ Failed to fetch emoji GIF!");
    }

    // Create animated sticker from GIF
    const sticker = new Sticker(response.data, {
      pack: pushName || "Emoji Sticker",
      author: author || "WhatsApp Bot",
      type: StickerTypes.FULL,
      categories: ["✨", "🎨"],
      id: `emoji-${emojiCode}`,
      quality: 80,
      background: "transparent"
    });

    const stickerBuffer = await sticker.toBuffer();
    
    await client.sendMessage(from, { 
      sticker: stickerBuffer 
    }, { quoted: mek });

  } catch (err) {
    console.error("emojisticker error:", err);
    await reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "qc",
  aliases: ["quotemaker", "quotesticker"],
  category: "Sticker",
  description: "Generate a quote sticker (reply to a message or provide text)",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, sender, reply, author, pushName, quoted, quotedUser, quotedMsg, isGroup } = conText;

  let quoteText = q;
  let targetUser = sender;
  let displayName = pushName || sender.split('@')[0];

  // Case 1: If replying to a message, get the quoted user's info and quoted message text
  if (quotedMsg && quotedUser) {
    targetUser = quotedUser;
    displayName = pushName; // Use pushName from the quoted user context
    
    // Get the quoted user's name if possible
    try {
      const contact = await client.getContact(targetUser);
      displayName = contact.pushname || contact.verifiedName || contact.name || targetUser.split('@')[0];
    } catch {
      displayName = targetUser.split('@')[0];
    }
    
    // If no text provided in command, use the quoted message text
    if (!quoteText && quotedMsg.text) {
      quoteText = quotedMsg.text;
    } else if (!quoteText && quotedMsg.caption) {
      quoteText = quotedMsg.caption;
    }
    
    // If still no text, use the quoted message content
    if (!quoteText) {
      quoteText = "✨ Quote Sticker ✨";
    }
  }

  // Case 2: If text is provided in command (not replying)
  if (!quoteText && q) {
    quoteText = q;
  }

  // Validate if we have text to generate quote
  if (!quoteText) {
    return reply("📌 *Usage:*\n• `.qc <text>` - Create quote with your profile\n• *Reply* to a message with `.qc` - Create quote with that user's profile and message\n• *Reply* with `.qc <text>` - Create quote with that user's profile and custom text");
  }

  // Get profile picture URL (without fallback)
  let ppUrl;
  try {
    ppUrl = await client.profilePictureUrl(targetUser, 'image');
  } catch (err) {
    return reply(`❌ Could not fetch profile picture. Make sure they have a profile picture set.`);
  }

  // WhatsApp style configuration
  const obj = {
    type: 'quote',
    format: 'png',
    backgroundColor: '#0B141A', // WhatsApp dark mode background
    width: 512,
    height: 768,
    scale: 2,
    messages: [{
      entities: [],
      avatar: true,
      from: {
        id: 1,
        name: pushName,
        photo: { url: ppUrl }
      },
      text: quoteText,
      replyMessage: {}
    }],
    
    style: {
      backgroundColor: '#0B141A',
      textColor: '#E9EDEF', 
      nameColor: '#00A884', 
      messageColor: '#E9EDEF',
      linkColor: '#53BDEB',
      replyColor: '#8696A0',
      bubble: {
        backgroundColor: '#202C33', 
        borderRadius: 16,
        padding: 12
      }
    }
  };

  try {
    // Generate quote
    const response = await axios.post('https://bot.lyo.su/quote/generate', obj, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(response.data.result.image, 'base64');

    // Create sticker with pushName for pack name
    const sticker = new Sticker(buffer, {
      pack: pushName || "Quote Maker",
      type: StickerTypes.FULL,
      categories: ["💬", "✨"],
      quality: 70,
      background: "transparent"
    });

    const stickerBuffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

  } catch (err) {
    console.error("QC Sticker error:", err);
    await reply("❌ Failed to generate quote sticker. Please try again later.");
  }
});
//========================================================================================================================

keith({
  pattern: "emomix",
  aliases: ["emojimix", "emix"],
  description: "Mix two emojis into a custom sticker",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, reply, pushName, author } = conText;

  if (!q) {
    return reply("📌 Provide two emojis separated by +\nExample: .emomix 😹+😹");
  }

  try {
    // Call API
    const res = await axios.get(`https://levanter.onrender.com/emix?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to generate emoji mix.");
    }

    // Build sticker with pack/author metadata
    const sticker = new Sticker(data.result, {
      pack: pushName || "EmojiMix",
      type: StickerTypes.FULL,
      categories: ["✨", "🔥"],
      id: "emomix-001",
      quality: 70,
      background: "transparent"
    });

    const buffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: buffer }, { quoted: mek });

  } catch (err) {
    console.error("emomix error:", err);
    await reply("❌ Error generating emoji mix: " + err.message);
  }
});
//========================================================================================================================

const namedColors = {
  black: "000000", white: "ffffff", red: "ff0000", blue: "0000ff", green: "00ff00",
  yellow: "ffff00", pink: "ffc0cb", purple: "800080", orange: "ffa500", gray: "808080",
  darkblue: "00008b", lightblue: "87ceeb", gold: "ffd700", silver: "c0c0c0", brown: "8b4513",
  cyan: "00ffff", turquoise: "40e0d0", magenta: "ff00ff", olive: "808000", navy: "000080",
  lavender: "e6e6fa", cream: "fdf5e6", transparent: "00000000"
};

const BASE_IMAGE = "https://akunv53-brat.hf.space/maker/brat";
const makeURL = (txt, bg, color) =>
  `${BASE_IMAGE}?text=${encodeURIComponent(txt)}&background=%23${bg}&color=%23${color}`;

async function createSticker(url, pushName, author, quality) {
  return (new Sticker(url, {
    type: 'full',
    pack: pushName,   // sticker pack name = sender’s pushName
    author: author,   // author from conText
    quality
  })).toBuffer();
}

keith({
  pattern: "brat",
  aliases: ["bratsticker", "brattext", "bratgen"],
  description: "Generate brat sticker",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, pushName, author } = conText;
  if (!q) return reply("📌 Usage: .brat Hello |background,textColor\nExample: .brat Hey |black,white");

  // Split text and optional colors
  let [textPart, colorPart] = q.split("|");
  const realText = textPart.trim() || " ";
  let bg = "000000";   // default black background
  let color = "ffffff"; // default white text

  if (colorPart) {
    const colors = colorPart.split(",").map(c => c.trim().toLowerCase());
    if (colors[0]) bg = namedColors[colors[0]] || colors[0].replace("#", "");
    if (colors[1]) color = namedColors[colors[1]] || colors[1].replace("#", "");
  }

  try {
    const { data } = await axios.get(makeURL(realText, bg, color));
    if (!data.image_url) throw new Error("API did not return a valid image_url");

    const sticker = await createSticker(data.image_url, pushName, author, 50);
    await client.sendMessage(from, { sticker }, { quoted: mek });
  } catch (err) {
    reply(`❌ Failed: ${err.message}`);
  }
});
//========================================================================================================================




const TG_API = "https://api.telegram.org/bot8313451751:AAHN_5RniuG3iGKIiDJ9_DsOaiVxmejzTcE";

keith({
  pattern: "tgs",
  aliases: ["telesticker"],
  description: "Import Telegram sticker set or search stickers and convert to WhatsApp",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, author, pushName, isSuperUser, mek } = conText;

  // Restrict to super users
  if (!isSuperUser) return reply("❌ Only Mods can use this command.");
  if (!q) return reply("📌 Provide a Telegram sticker link or search term.");

  // Handle Telegram sticker set link
  if (q.includes('/addstickers/')) {
    const name = q.split('/addstickers/')[1];
    const setUrl = `${TG_API}/getStickerSet?name=${encodeURIComponent(name)}`;

    try {
      const res = await axios.get(setUrl);
      const set = res.data.result;

      await reply(`*Telegram Sticker Set*\nName: ${set.name}\nTotal: ${set.stickers.length}\nSending...`);

      for (const item of set.stickers) {
        if (item.is_animated || item.is_video) continue; // skip unsupported formats

        const fileRes = await axios.get(`${TG_API}/getFile?file_id=${item.file_id}`);
        const filePath = fileRes.data.result.file_path;

        const bufferRes = await axios({
          method: 'GET',
          url: `https://api.telegram.org/file/bot${TG_API.split('/bot')[1]}/${filePath}`,
          responseType: 'arraybuffer'
        });

        const sticker = new Sticker(bufferRes.data, {
          pack: pushName,
          author: author,
          type: 'full',
          quality: 60
        });

        const stickerBuffer = await sticker.toBuffer();
        await client.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
      }
    } catch (err) {
      console.error("tgs url error:", err);
      reply("❌ Error importing Telegram sticker set: " + err.message);
    }
    return;
  }

  // Handle search query
  try {
    const res = await axios.get(`https://apiskeith.top/search/telesticker?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No stickers found for that query.");
    }

    const pack = data.result[0];
    await reply(`*Sticker Search: ${q}*\nPack: ${pack.title}\nSending...`);

    for (const item of pack.stickers) {
      const bufferRes = await axios({
        method: 'GET',
        url: item.imageUrl,
        responseType: 'arraybuffer'
      });

      const sticker = new Sticker(bufferRes.data, {
        pack: pushName,
        author: author,
        type: 'full',
        quality: 60
      });

      const stickerBuffer = await sticker.toBuffer();
      await client.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
    }
  } catch (err) {
    console.error("tgs search error:", err);
    reply("❌ Error searching stickers: " + err.message);
  }
});

//========================================================================================================================


keith({
  pattern: "stickersearch",
  aliases: ["ssearch"],
  description: "Search Tenor and send animated stickers",
  category: "Sticker",
  filename: __filename
  
}, async (from, client, conText) => {
  const { q, reply, pushName, author, mek } = conText;

  if (!q) return reply("❌ Where is the request?\n\nExample: stickersearch happy dance");

  const tenorApiKey = "AIzaSyCyouca1_KKy4W_MG1xsPzuku5oa8W358c";
  const searchTerm = encodeURIComponent(q);

  try {
    for (let i = 0; i < 5; i++) {
      const res = await axios.get(
        `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${tenorApiKey}&client_key=keith-md&limit=8&media_filter=gif`
      );

      const gifUrl = res.data.results[i]?.media_formats?.gif?.url;
      if (!gifUrl) continue;

      const sticker = new Sticker(gifUrl, {
        pack: pushName,
        author: author,
        type: StickerTypes.FULL,
        categories: ["🤩", "🎉"],
        id: "keith-md",
        quality: 60,
        background: "transparent"
      });

      const buffer = await sticker.toBuffer();
      await client.sendMessage(from, { sticker: buffer }, { quoted: mek });
    }
  } catch (err) {
    console.error("stickersearch error:", err);
    reply("❌ Error while searching for stickers.");
  }
});
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================


//========================================================================================================================
// From Sticker.js

keith({
  pattern: "circle",
  description: "Quote a sticker and resend it with your packname and author",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, pushName, author, mek, reply } = conText;

  if (!quotedMsg?.stickerMessage) {
    return reply("❌ Quote a sticker to restick.");
  }

  try {
    const media = quotedMsg.stickerMessage;
    const result = await client.downloadAndSaveMediaMessage(media);

    const sticker = new Sticker(result, {
      pack: pushName,
      author: pushName,
      type: StickerTypes.CIRCLE,
      categories: ["🤩", "🎉"],
      id: "restick-123",
      quality: 70,
      background: "transparent"
    });

    const buffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: buffer }, { quoted: mek });
  } catch (err) {
    console.error("take error:", err);
    await reply("❌ Failed to restick the quoted sticker.");
  }
});
//========================================================================================================================
// From Sticker.js

keith({
  pattern: "round",
  aliases: ["rounded"],
  description: "Quote a sticker and resend it with your packname and author",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, pushName, author, mek, reply } = conText;

  if (!quotedMsg?.stickerMessage) {
    return reply("❌ Quote a sticker to restick.");
  }

  try {
    const media = quotedMsg.stickerMessage;
    const result = await client.downloadAndSaveMediaMessage(media);

    const sticker = new Sticker(result, {
      pack: pushName,
      author: pushName,
      type: StickerTypes.ROUNDED,
      categories: ["🤩", "🎉"],
      id: "restick-123",
      quality: 70,
      background: "transparent"
    });

    const buffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: buffer }, { quoted: mek });
  } catch (err) {
    console.error("take error:", err);
    await reply("❌ Failed to restick the quoted sticker.");
  }
});
//========================================================================================================================
//=======================
//========================================================================================================================
//=======================
//========================================================================================================================
keith({
  pattern: "take",
  aliases: ["restick", "grabsticker"],
  description: "Quote a sticker and resend it with your packname and author",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, pushName, author, mek, reply } = conText;

  if (!quotedMsg?.stickerMessage) {
    return reply("❌ Quote a sticker to restick.");
  }

  try {
    const media = quotedMsg.stickerMessage;
    const result = await client.downloadAndSaveMediaMessage(media);

    const sticker = new Sticker(result, {
      pack: pushName,
      type: StickerTypes.FULL,
      categories: ["🤩", "🎉"],
      id: "restick-123",
      quality: 70,
      background: "transparent"
    });

    const buffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: buffer }, { quoted: mek });
  } catch (err) {
    console.error("take error:", err);
    await reply("❌ Failed to restick the quoted sticker.");
  }
});
//========================================================================================================================
//=======================
keith({
  pattern: "sticker",
  aliases: ["stik", "s", "stikpack"],
  description: "Create sticker from quoted image or video",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, pushName, author, mek, reply } = conText;

  if (!quotedMsg) return reply("❌ Quote an image or a short video.");

  let media;
  if (quotedMsg.imageMessage) {
    media = quotedMsg.imageMessage;
  } else if (quotedMsg.videoMessage) {
    media = quotedMsg.videoMessage;
  } else {
    return reply("❌ That is neither an image nor a short video.");
  }

  try {
    const result = await client.downloadAndSaveMediaMessage(media);

    const sticker = new Sticker(result, {
      pack: pushName,
      author: author,
      type: StickerTypes.FULL,
      categories: ["🤩", "🎉"],
      id: "12345",
      quality: 70,
      background: "transparent"
    });

    const buffer = await sticker.toBuffer();
    await client.sendMessage(from, { sticker: buffer }, { quoted: mek });
  } catch (err) {
    console.error("sticker error:", err);
    await reply("❌ Failed to generate sticker.");
  }
});
//=======================
