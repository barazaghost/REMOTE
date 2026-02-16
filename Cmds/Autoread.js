
const { keith } = require('../commandHandler');
const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

async function decodeQR(filePath) {
  const image = await Jimp.read(filePath);
  const qr = new QrCode();

  return new Promise((resolve, reject) => {
    qr.callback = (err, value) => {
      if (err) return reject(err);
      resolve(value?.result || null);
    };
    qr.decode(image.bitmap);
  });
}

keith({
  pattern: "scan",
  aliases: ["readqr", "scanqr"],
  description: "Read QR code from quoted image",
  category: "Tools",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply("📌 Reply to an *image* containing a QR code.");
  }

  try {
    const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    const result = await decodeQR(filePath);

    if (!result) {
      return reply("❌ No QR code detected in the image.");
    }

    // Reply only with the decoded QR content
    await reply(result);
  } catch (err) {
    console.error("qrread command error:", err);
    reply("❌ Failed to read QR code. Try again.");
  }
});
