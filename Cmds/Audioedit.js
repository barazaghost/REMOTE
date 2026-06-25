const { keith } = require('../commandHandler');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const os = require('os');

//========================================================================================================================
// Robust jids.json loader — tries multiple paths, works on Heroku + local
//========================================================================================================================

function loadJids() {
  // Try these locations in order
  const candidates = [
    path.join(__dirname, '..', 'jids.json'),          // normal: commands/../jids.json
    path.join(process.cwd(), 'jids.json'),             // Heroku: root of app
    path.join(process.cwd(), 'data', 'jids.json'),     // optional: data/ subfolder
    path.join(__dirname, 'jids.json'),                 // same folder as this file
  ];

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const jids = raw.filter(jid => typeof jid === 'string' && jid.endsWith('@s.whatsapp.net'));
        console.log(`✅ Loaded ${jids.length} JIDs from: ${filePath}`);
        return jids;
      }
    } catch (err) {
      console.warn(`⚠️ Could not read ${filePath}:`, err.message);
    }
  }

  console.error('❌ jids.json not found in any expected location.');
  return [];
}

//========================================================================================================================
// reshare — Post quoted image/video as WhatsApp status
//========================================================================================================================

keith({
  pattern: "reshare",
  aliases: ["story", "tostatus", "poststatus", "sendstatus"],
  description: "Post a status visible only to selected contacts (@s.whatsapp.net only)",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!quotedMsg) return reply("❌ Please quote an image or video message to post.");

  // Load jids fresh at runtime (handles Heroku env where module-load paths differ)
  const statusJidList = loadJids();
  if (statusJidList.length === 0) {
    return reply("❌ No valid contacts found in jids.json. Check that the file exists and has @s.whatsapp.net entries.");
  }

  const tmpDir = os.tmpdir(); // ✅ Use system temp dir — always writable on Heroku

  try {
    const sendStatus = async (media, type) => {
      const filePath = await client.downloadAndSaveMediaMessage(
        media,
        path.join(tmpDir, `${type}-${Date.now()}`)
      );
      const caption = media.caption || "";

      await client.sendMessage("status@broadcast", {
        [type]: { url: filePath },
        ...(caption && { caption }),
        mimetype: media.mimetype,
        ...(type === 'video' && { seconds: media.seconds })
      }, {
        statusJidList,
        backgroundColor: '#000000'
      });

      try { fs.unlinkSync(filePath); } catch {}
      return reply(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} posted to ${statusJidList.length} contacts.`);
    };

    if (quoted?.imageMessage) {
      return await sendStatus(quoted.imageMessage, "image");
    }

    if (quoted?.videoMessage) {
      if (quoted.videoMessage.seconds > 30) return reply("⚠️ Video must be 30 seconds or shorter.");
      return await sendStatus(quoted.videoMessage, "video");
    }

    return reply("⚠️ Only image or video messages are supported.");

  } catch (err) {
    console.error("reshare error:", err);
    return reply("❌ Failed to post status: " + err.message);
  }
});

//========================================================================================================================
// jidcount — Show number of loaded JIDs + which file was found
//========================================================================================================================

keith({
  pattern: "jidcount",
  aliases: ["totaljids", "jidsize"],
  description: "Show total number of saved JIDs",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  // Load fresh so it reflects any runtime changes to jids.json
  const statusJidList = loadJids();

  const candidates = [
    path.join(__dirname, '..', 'jids.json'),
    path.join(process.cwd(), 'jids.json'),
    path.join(process.cwd(), 'data', 'jids.json'),
    path.join(__dirname, 'jids.json'),
  ];

  let foundPath = 'not found';
  for (const p of candidates) {
    if (fs.existsSync(p)) { foundPath = p; break; }
  }

  return reply(
    `📌 Total saved JIDs: *${statusJidList.length}*\n` +
    `📂 File: \`${foundPath}\``
  );
});
