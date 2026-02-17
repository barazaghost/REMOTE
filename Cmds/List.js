
const { keith } = require('../commandHandler');
const axios = require('axios');

keith({
  pattern: "walink",
  aliases: ["waurl", "whatsappurl"],
  description: "Generate WhatsApp short link with message | number",
  category: "Tools",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, api } = conText;


  if (!q || !q.includes("|")) {
    return reply("📌 Usage: .walink <message> | <number>\nExample: .walink Hey | 254748387615");
  }

  try {
    const [message, number] = q.split("|").map(s => s.trim());

    if (!message || !number) return reply("❌ Provide both message and number.");
    if (!/^\d+$/.test(number)) {
      return reply("❌ Number must be digits and start with a valid country code.");
    }

    const { data } = await axios.get(
      `${api}/tools/walink?q=${encodeURIComponent(message)}&number=${number}`
    );

    if (!data?.status || !data?.result?.shortUrl) {
      return reply("❌ Failed to generate WhatsApp link.");
    }

    
    await reply(data.result.shortUrl);
  } catch (err) {
    console.error("walink command error:", err);
    reply("❌ Error generating WhatsApp link. Try again.");
  }
});
/*const { keith } = require('../commandHandler');
const axios = require('axios');*/

keith({
  pattern: "qrgenerator",
  aliases: ["qrgen", "makeqr", "qr"],
  description: "Generate QR code from text",
  category: "Tools",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, q, api } = conText;

  // Expect input like: .qrgenerator hello world
  if (!q) return reply("📌 Usage: .qrgenerator <text>");

  try {
    const { data } = await axios.get(
      `${api}/tools/qrgenerator?q=${encodeURIComponent(q)}`
    );

    if (!data?.status || !data?.result) {
      return reply("❌ Failed to generate QR code.");
    }

    // Reply with QR code image only
    await client.sendMessage(from, {
      image: { url: data.result }
    }, { quoted: mek });
  } catch (err) {
    console.error("qrgenerator command error:", err);
    reply("❌ Error generating QR code. Try again.");
  }
});
