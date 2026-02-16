
// From Owner.js

const { keith } = require("../commandHandler");
const PDFDocument = require("pdfkit");

keith({
  pattern: "pdf",
  aliases: ["makepdf", "textpdf"],
  description: "Convert quoted text or media into a PDF file",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quoted, quotedMsg, reply, mek } = conText;

  if (!quotedMsg) {
    return reply("📌 Reply to a text, image, or document with `.pdf <filename>`");
  }

  if (!q) {
    return reply("❌ Provide a filename. Example: `.pdf keith`");
  }

  try {
    const filename = `${q.trim()}.pdf`;

    // Case 1: Quoted text → PDF
    if (quoted?.conversation || quoted?.extendedTextMessage?.text) {
      const text = quoted.conversation || quoted.extendedTextMessage.text;
      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        await client.sendMessage(from, {
          document: buffer,
          mimetype: "application/pdf",
          fileName: filename
        }, { quoted: mek });
      });
      doc.fontSize(12).text(text, { align: "left" });
      doc.end();
      return;
    }

    // Case 2: Quoted image → PDF (with caption if present)
    if (quoted?.imageMessage) {
      const filePathImg = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
      const caption = quoted.imageMessage.caption || "";

      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        await client.sendMessage(from, {
          document: buffer,
          mimetype: "application/pdf",
          fileName: filename
        }, { quoted: mek });
      });

      doc.image(filePathImg, { fit: [500, 700], align: "center", valign: "center" });
      if (caption) {
        doc.moveDown();
        doc.fontSize(12).text(caption, { align: "left" });
      }
      doc.end();
      return;
    }

    // Case 3: Quoted document → wrap into PDF
    if (quoted?.documentMessage) {
      const filePathDoc = await client.downloadAndSaveMediaMessage(quoted.documentMessage);
      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        await client.sendMessage(from, {
          document: buffer,
          mimetype: "application/pdf",
          fileName: filename
        }, { quoted: mek });
      });
      doc.fontSize(12).text(`Attached file: ${filePathDoc}`, { align: "left" });
      doc.end();
      return;
    }

    return reply("❌ Unsupported quoted type for PDF conversion.");

  } catch (err) {
    console.error("pdf command error:", err);
    return reply(`❌ Failed to generate PDF: ${err.message}`);
  }
});
