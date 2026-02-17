
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
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
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
      author: pushName,
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
