

const { keith } = require('../commandHandler');
const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const moment = require('moment-timezone');
const fs = require('fs/promises');
const { exec } = require("child_process");
//const { keith } = require('../commandHandler');
const axios = require('axios');
const util = require('util');

const { sendInteractiveMessage } = require('gifted-btns');
//========================================================================================================================

keith({
  pattern: "mygroups",
  aliases: ["groups", "botgroups", "glist"],
  category: "Owner",
  description: "List all groups the bot is in (interactive)",
  filename: __filename
}, async (from, client, { reply, isSuperUser }) => {
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const allGroups = await client.groupFetchAllParticipating();
    const groupList = Object.values(allGroups);

    if (!groupList.length) return reply("⚠️ Bot is not in any groups.");

    // Build interactive rows including JID
    const rows = groupList.map(g => ({
      header: "📛",
      title: g.subject || "Unnamed Group",
      description: `👥 Members: ${g.participants?.length || 0}\n🆔 JID: ${g.id}`,
      id: `group_${g.id}`
    }));

    await sendInteractiveMessage(client, from, {
      text: `*📋 My Groups*\n\nBot is in ${groupList.length} groups.\nSelect one to view metadata:`,
      interactiveButtons: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Groups',
            sections: [
              {
                title: 'Available Groups',
                rows
              }
            ]
          })
        }
      ]
    });

  } catch (err) {
    console.error("mygroups error:", err);
    reply("❌ Error while accessing bot groups.\n\n" + err.message);
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



keith({
  pattern: "disappearing",
  aliases: ["updatedisappearing", "ephemeral"],
  category: "Owner",
  description: "Update your WhatsApp default disappearing messages duration"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .disappearing <0|86400|604800|7776000>\n\nValues:\n0 = Remove\n86400 = 24h\n604800 = 7d\n7776000 = 90d");
  }

  const value = parseInt(q.trim(), 10);
  const validValues = [0, 86400, 604800, 7776000];

  if (!validValues.includes(value)) {
    return reply("❌ Invalid value.\nAvailable options: 0, 86400, 604800, 7776000");
  }

  try {
    await client.updateDefaultDisappearingMode(value);

    // Map seconds to human-readable label
    const labels = {
      0: "Removed (No disappearing messages)",
      86400: "24 hours",
      604800: "7 days",
      7776000: "90 days"
    };

    await client.sendMessage(from, {
      text: `✅ Default disappearing messages updated to: *${labels[value]}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("disappearing error:", err);
    reply(`❌ Error updating disappearing messages.\n${err.message}`);
  }
});
//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "groupprivacy",
  aliases: ["updategroupprivacy"],
  category: "Owner",
  description: "Update your WhatsApp Group Add privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .groupprivacy <all|contacts|contact_blacklist>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "contacts", "contact_blacklist"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateGroupsAddPrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Group Add privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("groupprivacy error:", err);
    reply(`❌ Error updating Group Add privacy.\n${err.message}`);
  }
});

//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "readreceipts",
  aliases: ["updatereadreceipts"],
  category: "Owner",
  description: "Update your WhatsApp Read Receipts privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .readreceipts <all|none>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "none"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateReadReceiptsPrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Read Receipts privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("readreceipts privacy error:", err);
    reply(`❌ Error updating Read Receipts privacy.\n${err.message}`);
  }
});

//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "statusprivacy",
  aliases: ["updatestatusprivacy"],
  category: "Owner",
  description: "Update your WhatsApp Status privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .statusprivacy <all|contacts|contact_blacklist|none>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "contacts", "contact_blacklist", "none"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateStatusPrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Status privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("statusprivacy error:", err);
    reply(`❌ Error updating Status privacy.\n${err.message}`);
  }
});

//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "profileprivacy",
  aliases: ["updateprofileprivacy"],
  category: "Owner",
  description: "Update your WhatsApp Profile Picture privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .profileprivacy <all|contacts|contact_blacklist|none>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "contacts", "contact_blacklist", "none"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateProfilePicturePrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Profile Picture privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("profileprivacy error:", err);
    reply(`❌ Error updating Profile Picture privacy.\n${err.message}`);
  }
});

//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "updateonline",
  aliases: ["online"],
  category: "Owner",
  description: "Update your WhatsApp Online privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .online <all|match_last_seen>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "match_last_seen"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateOnlinePrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Online privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("online privacy error:", err);
    reply(`❌ Error updating Online privacy.\n${err.message}`);
  }
});

//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "lastseen",
  aliases: ["updatelastseen"],
  category: "Owner",
  description: "Update your WhatsApp Last Seen privacy setting"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q) {
    return reply("📌 Usage: .lastseen <all|contacts|contact_blacklist|none>");
  }

  const value = q.trim().toLowerCase();
  const validValues = ["all", "contacts", "contact_blacklist", "none"];

  if (!validValues.includes(value)) {
    return reply(`❌ Invalid value.\nAvailable options: ${validValues.join(", ")}`);
  }

  try {
    await client.updateLastSeenPrivacy(value);

    await client.sendMessage(from, {
      text: `✅ Last Seen privacy updated to: *${value}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("lastseen error:", err);
    reply(`❌ Error updating Last Seen privacy.\n${err.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "privacy",
  aliases: ["fetchprivacy", "ownersettings"],
  category: "Owner",
  description: "Show your WhatsApp privacy settings"
},
async (from, client, conText) => {
  const { reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const settings = await client.fetchPrivacySettings(true);

    if (!settings) {
      return reply("❌ Failed to fetch privacy settings.");
    }

    // Build caption with Unicode box styling
    let caption = `╭━━━━━━━━━━━━━━━╮\n`;
    caption += `│ 🔒 *Privacy Settings*\n`;
    caption += `├━━━━━━━━━━━━━━━┤\n`;
    caption += `│ 📞 Call Add: ${settings.calladd}\n`;
    caption += `│ 🛡️ Defense: ${settings.defense}\n`;
    caption += `│ 👥 Group Add: ${settings.groupadd}\n`;
    caption += `│ 💬 Messages: ${settings.messages}\n`;
    caption += `│ 🌐 Online: ${settings.online}\n`;
    caption += `│ ⏳ Last Seen: ${settings.last}\n`;
    caption += `│ 🖼️ Profile: ${settings.profile}\n`;
    caption += `│ 👁️ Read Receipts: ${settings.readreceipts}\n`;
    caption += `│ 📢 Status: ${settings.status}\n`;
    caption += `│ 🎭 Stickers: ${settings.stickers}\n`;
    caption += `╰━━━━━━━━━━━━━━━╯`;

    await client.sendMessage(from, { text: caption }, { quoted: mek });

  } catch (err) {
    console.error("privacy error:", err);
    reply(`❌ Error fetching privacy settings.\n${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "blocklist",
  category: "Owner",
  aliases: ["listblock", "blacklist"],
  description: "Show list of blocked members and allow unblock by reply"
},
async (from, client, conText) => {
  const { reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const blocked = await client.fetchBlocklist();

    if (!blocked || blocked.length === 0) {
      return reply("✅ You have not blocked any members.");
    }

    // Build message with @tags
    let message = `🚫 You have blocked ${blocked.length} members:\n\n`;
    message += blocked.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join("\n");
    message += `\n📌 Reply with the number to unblock that member.`;

    const sent = await client.sendMessage(from, {
      text: message,
      mentions: blocked
    }, { quoted: mek });

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
      if (isNaN(num) || num < 1 || num > blocked.length) {
        return client.sendMessage(chatId, {
          text: `❌ Invalid number. Reply with a number between 1 and ${blocked.length}.`,
          quoted: msg
        });
      }

      try {
        const jidToUnblock = blocked[num - 1];
        await client.updateBlockStatus(jidToUnblock, "unblock");

        await client.sendMessage(chatId, {
          text: `✅ Unblocked @${jidToUnblock.split('@')[0]}`,
          mentions: [jidToUnblock],
          quoted: msg
        });
      } catch (err) {
        console.error("Unblock error:", err);
        await client.sendMessage(chatId, {
          text: `❌ Failed to unblock.\nError: ${err.message}`,
          quoted: msg
        });
      }
    });

  } catch (err) {
    console.error("blocklist error:", err);
    reply(`❌ Failed to fetch blocklist.\nError: ${err.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "rpp",
  aliases: ["removepic", "deletepp", "clearpp"],
  category: "Owner",
  description: "Remove your own profile picture"
},
async (from, client, conText) => {
  const { reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    // ✅ Proper IQ node for removal: include <picture> with empty content
    const iqNode = {
      tag: "iq",
      attrs: {
        to: S_WHATSAPP_NET,
        type: "set",
        xmlns: "w:profile:picture"
      },
      content: [
        {
          tag: "picture",
          attrs: { type: "image" },
          content: [] // empty signals removal
        }
      ]
    };

    await client.query(iqNode);
    reply("🗑️ Profile picture removed successfully!");
  } catch (err) {
    console.error("rpp error:", err);
    reply(`❌ Failed to remove profile picture.\nError: ${err.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "setgpp",
  aliases: ["gcpic", "groupfullpp", "gupdateprofile", "gfullpp"],
  category: "group",
  description: "Set group profile picture (raw upload, no resizing)"
},
async (from, client, conText) => {
  const { reply, quoted, isSuperUser, isGroup } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command can only be used in a group!");

  let tempFilePath;
  try {
    const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
    if (!quotedImg) return reply("📸 Quote an image to set as group profile picture.");

    // Download quoted image directly
    tempFilePath = await client.downloadAndSaveMediaMessage(quotedImg, 'temp_media');

    // Get group metadata
    const metadata = await client.groupMetadata(from);
    const groupId = metadata.id;

    // ✅ Upload image as-is (no resizing)
    if (client.updateProfilePicture) {
      await client.updateProfilePicture(groupId, { url: tempFilePath });
      await fs.unlink(tempFilePath);
      return reply("✅ Group profile picture updated successfully");
    }

    reply("❌ updateProfilePicture method not available in this Baileys version.");

  } catch (err) {
    console.error("gpp error:", err);
    if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
    reply(`❌ Failed to update group profile picture.\nError: ${err.message}`);
  }
});

//========================================================================================================================


keith({
  pattern: "logout",
  aliases: ["exit"],
  category: "Owner",
  description: "Log the bot out of WhatsApp"
},
async (from, client, conText) => {
  const { isSuperUser } = conText;

  if (!isSuperUser) return;

  await client.logout();
});
//========================================================================================================================

keith({
  pattern: "eval",
  description: "Evaluate JavaScript code",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const {
    m, mek, edit, react, del, arg, quoted, isCmd, command,
    isAdmin, isBotAdmin, sender, pushName, setSudo, delSudo,
    isSudo, devNumbers, q, reply, superUser, tagged, mentionedJid,
    isGroup, groupInfo, groupName, getSudoNumbers, authorMessage,
    user, keithBuffer, keithJson, formatAudio, formatVideo,
    keithRandom, groupMember, dev, groupAdmins, participants,
    repliedMessage, quotedMsg, quotedKey, quotedSender, quotedUser,
    isSuperUser, api, botMode, botPic, packname, author, botVersion,
    ownerNumber, ownerName, botname, sourceUrl, isSuperAdmin,
    prefix, timeZone, getExpiryDisplay, expiryDisplay, updateSettings, getSettings, botSettings
  } = conText;
  if (!isSuperUser) return reply("❌ Superuser only command.");

  try {
    const isAsync = q.includes('await') || q.includes('async');

    let evaled;
    if (isAsync) {
      evaled = await eval(`(async () => { 
        try { 
          return ${q.includes('return') ? q : `(${q})`} 
        } catch (e) { 
          return "❌ Async Eval Error: " + e.message; 
        } 
      })()`);
    } else {
      evaled = eval(q);
    }

    if (typeof evaled !== 'string') {
      evaled = util.inspect(evaled, { depth: 1 });
    }

    // Use reply instead of client.sendMessage
    await reply(evaled);

  } catch (error) {
    console.error("Eval Error:", error);
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================
/*const fs = require("fs");
const { keith } = require("../commandHandler");

keith({
  pattern: "toviewonce",
  aliases: ["tovo", "tovv"],
  description: "Send quoted media (image/video/audio) as view-once message",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) {
    return reply("❌ Reply to an image, video, or audio message to make it view-once.");
  }

  try {
    if (quoted?.imageMessage) {
      const caption = quoted.imageMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
      await client.sendMessage(
        from,
        { image: { url: filePath }, caption, viewOnce: true },
        { quoted: mek }
      );
      try { fs.unlinkSync(filePath); } catch {}
    }

    if (quoted?.videoMessage) {
      const caption = quoted.videoMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
      await client.sendMessage(
        from,
        { video: { url: filePath }, caption, viewOnce: true },
        { quoted: mek }
      );
      try { fs.unlinkSync(filePath); } catch {}
    }

    if (quoted?.audioMessage) {
      const filePath = await client.downloadAndSaveMediaMessage(quoted.audioMessage);
      await client.sendMessage(
        from,
        {
          audio: { url: filePath },
          mimetype: "audio/mpeg",
          ptt: true,
          viewOnce: true   // flag added here
        },
        { quoted: mek }
      );
      try { fs.unlinkSync(filePath); } catch {}
    }
  } catch (err) {
    console.error("toviewonce command error:", err);
    reply("❌ Couldn't send the media. Try again.");
  }
});*/
//=====================================my===================================================================================

//========================================================================================================================


keith({
  pattern: "fetch",
  aliases: ["get", "curl"],
  description: "Fetch and display content from a URL",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek } = conText;
  if (!q) return reply("❌ Provide a valid URL to fetch.");

  try {
    const response = await axios.get(q, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];

    if (!contentType) return reply("❌ Server did not return a content-type.");
    console.log("Content-Type:", contentType);

    const buffer = Buffer.from(response.data);
    const filename = q.split('/').pop() || "file";

    if (contentType.includes('application/json')) {
      const json = JSON.parse(buffer.toString());
      return reply("```json\n" + JSON.stringify(json, null, 2).slice(0, 4000) + "\n```");
    }

    if (contentType.includes('text/html')) {
      const html = buffer.toString();
      return reply(html.slice(0, 4000));
    }

    if (contentType.includes('image')) {
      return client.sendMessage(from, { image: buffer, caption: q }, { quoted: mek });
    }

    if (contentType.includes('video')) {
      return client.sendMessage(from, { video: buffer, caption: q }, { quoted: mek });
    }

    if (contentType.includes('audio')) {
      return client.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: filename
      }, { quoted: mek });
    }

    if (contentType.includes('application/pdf')) {
      return client.sendMessage(from, {
        document: buffer,
        mimetype: "application/pdf",
        fileName: filename
      }, { quoted: mek });
    }

    if (contentType.includes('application')) {
      return client.sendMessage(from, {
        document: buffer,
        mimetype: contentType,
        fileName: filename
      }, { quoted: mek });
    }

    if (contentType.includes('text/')) {
      return reply(buffer.toString().slice(0, 4000));
    }

    return reply("❌ Unsupported or unknown content type.");
  } catch (err) {
    console.error("fetch error:", err);
    return reply("❌ Failed to fetch the URL.");
  }
});
//========================================================================================================================


keith({
  pattern: "shell",
  aliases: ["sh", "exec"],
  description: "Execute shell commands",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Superuser only command.");
  if (!q) return reply("❌ No command provided. Please provide a valid shell command.");

  try {
    exec(q, (err, stdout, stderr) => {
      if (err) return reply(`❌ Error: ${err.message}`);
      if (stderr) return reply(`⚠️ stderr: ${stderr}`);
      if (stdout) return reply(stdout);
    });
  } catch (error) {
    await reply("❌ An error occurred while running the shell command:\n" + error);
  }
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "chunk",
  aliases: ["details", "det", "ret"],
  description: "Displays raw quoted message in JSON format",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, react, quotedMsg, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Superuser only command.");
  if (!quotedMsg) return reply("❌ Please reply to a message to inspect it.");

  try {
    const json = JSON.stringify(quotedMsg, null, 2);
    const chunks = json.match(/[\s\S]{1,100000}/g) || [];

    for (const chunk of chunks) {
      const formatted = "```json\n" + chunk + "\n```";
      await client.sendMessage(from, { text: formatted }, { quoted: mek });
      //await react("✅");
    }
  } catch (err) {
    console.error("Error dumping message:", err);
  }
});
//========================================================================================================================
keith({
  pattern: "save",
  aliases: ["savestatus", "statussave"],
  description: "Retrieve quoted media (image, video, audio)",
  category: "Owner",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quoted, quotedMsg, reply } = conText;

  if (!quotedMsg) return reply("📌 Reply to a status message to save.");

  try {
    if (quoted?.imageMessage) {
      const caption = quoted.imageMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
      await client.sendMessage(from, { image: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.videoMessage) {
      const caption = quoted.videoMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
      await client.sendMessage(from, { video: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.audioMessage) {
      const filePath = await client.downloadAndSaveMediaMessage(quoted.audioMessage);
      await client.sendMessage(from, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
    }

  } catch (err) {
    console.error("vv command error:", err);
    reply("❌ Failed to retrieve media. Try again.");
  }
});
//========================================================================================================================


keith({
  pattern: "vv2",
  aliases: ["amazing", "lovely"],
  description: "Retrieve quoted media (image, video, audio, view-once)",
  category: "Owner",
  filename: __filename
}, async (sender, client, { mek, quoted, quotedMsg, reply }) => {
  if (!quotedMsg) return reply("📌 Reply to a media message to retrieve it.");

  try {
    // Handle normal media
    if (quoted?.imageMessage) {
      const caption = quoted.imageMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
      await client.sendMessage(sender, { image: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.videoMessage) {
      const caption = quoted.videoMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
      await client.sendMessage(sender, { video: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.audioMessage) {
      const filePath = await client.downloadAndSaveMediaMessage(quoted.audioMessage);
      await client.sendMessage(sender, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
    }

    // Handle view-once media
    let viewOnceContent, mediaType;
    if (
      quoted.imageMessage?.viewOnce ||
      quoted.videoMessage?.viewOnce ||
      quoted.audioMessage?.viewOnce
    ) {
      mediaType = Object.keys(quoted).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t))
      );
      viewOnceContent = { [mediaType]: quoted[mediaType] };
    } else if (quoted.viewOnceMessage) {
      viewOnceContent = quoted.viewOnceMessage.message;
      mediaType = Object.keys(viewOnceContent).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t))
      );
    }

    if (viewOnceContent && mediaType) {
      const mediaMessage = {
        ...viewOnceContent[mediaType],
        viewOnce: false, // disable view-once flag
      };

      const filePath = await client.downloadAndSaveMediaMessage(mediaMessage);

      if (mediaType === "imageMessage") {
        const caption = mediaMessage.caption || "";
        await client.sendMessage(sender, { image: { url: filePath }, caption }, { quoted: mek });
      } else if (mediaType === "videoMessage") {
        const caption = mediaMessage.caption || "";
        await client.sendMessage(sender, { video: { url: filePath }, caption }, { quoted: mek });
      } else if (mediaType === "audioMessage") {
        await client.sendMessage(sender, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
      }
    }

  } catch (err) {
    console.error("vv2 command error:", err);
    reply("❌ Failed to retrieve media. Try again.");
  }
});

//========================================================================================================================

keith({
  pattern: "vv",
  aliases: ["wow", "retrieve"],
  description: "Retrieve quoted media (image, video, audio, view-once)",
  category: "Owner",
  filename: __filename
}, async (from, client, { mek, quoted, quotedMsg, reply }) => {
  if (!quotedMsg) return reply("📌 Reply to a media message to retrieve it.");

  try {
    // Handle normal media
    if (quoted?.imageMessage) {
      const caption = quoted.imageMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
      await client.sendMessage(from, { image: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.videoMessage) {
      const caption = quoted.videoMessage.caption || "";
      const filePath = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
      await client.sendMessage(from, { video: { url: filePath }, caption }, { quoted: mek });
    }

    if (quoted?.audioMessage) {
      const filePath = await client.downloadAndSaveMediaMessage(quoted.audioMessage);
      await client.sendMessage(from, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
    }

    // Handle view-once media
    let viewOnceContent, mediaType;
    if (
      quoted.imageMessage?.viewOnce ||
      quoted.videoMessage?.viewOnce ||
      quoted.audioMessage?.viewOnce
    ) {
      mediaType = Object.keys(quoted).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t))
      );
      viewOnceContent = { [mediaType]: quoted[mediaType] };
    } else if (quoted.viewOnceMessage) {
      viewOnceContent = quoted.viewOnceMessage.message;
      mediaType = Object.keys(viewOnceContent).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t))
      );
    }

    if (viewOnceContent && mediaType) {
      const mediaMessage = {
        ...viewOnceContent[mediaType],
        viewOnce: false, 
      };

      const filePath = await client.downloadAndSaveMediaMessage(mediaMessage);

      if (mediaType === "imageMessage") {
        const caption = mediaMessage.caption || "";
        await client.sendMessage(from, { image: { url: filePath }, caption }, { quoted: mek });
      } else if (mediaType === "videoMessage") {
        const caption = mediaMessage.caption || "";
        await client.sendMessage(from, { video: { url: filePath }, caption }, { quoted: mek });
      } else if (mediaType === "audioMessage") {
        await client.sendMessage(from, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: mek });
      }
    }

  } catch (err) {
    console.error("vv command error:", err);
    reply("❌ Failed to retrieve media. Try again.");
  }
});
//========================================================================================================================



keith({
  pattern: "profile",
  aliases: ["getpp"],
  category: "Owner",
  description: "Get someone's full profile info",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, quoted, quotedUser, quotedMsg, q, isGroup, timeZone, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  let target;

  // Case 1: quoted user
  if (quotedMsg && quotedUser) {
    target = quotedUser;
    if (isGroup && !target.endsWith('@s.whatsapp.net')) {
      try {
        const jid = await client.getJidFromLid(target);
        if (jid) target = jid;
      } catch {}
    }
  }

  // Case 2: direct number in args
  if (!target && q) {
    const possibleNumber = q.trim().split(/\s+/).find(part => /^\d+$/.test(part));
    if (!possibleNumber || possibleNumber.length < 5) {
      return reply("❌ Please provide a valid phone number (at least 5 digits).");
    }
    target = `${possibleNumber}@s.whatsapp.net`;
  }

  if (!target) {
    return reply("📛 Reply to a user or provide a phone number.\nExample: .profile 254748387615");
  }

  let statusText = "Not Found";
  let setAt = "Not Available";

  try {
    let ppUrl;
    try {
      ppUrl = await client.profilePictureUrl(target, 'image');
    } catch {
      ppUrl = "https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg";
    }

    try {
      const status = await client.fetchStatus(target);
      if (status?.length && status[0]?.status) {
        statusText = status[0].status.status || "Not Found";
        setAt = status[0].status.setAt || "Not Available";
      }
    } catch {}

    let formatted = "Not Available";
    if (setAt !== "Not Available") {
      try {
        formatted = moment(setAt).tz(timeZone).format('dddd, MMMM Do YYYY, h:mm A z');
      } catch {}
    }

    const number = target.replace(/@s\.whatsapp\.net$/, "");

    await client.sendMessage(from, {
      image: { url: ppUrl },
      caption: `*👤 User Profile*\n\n` +
               `*• Name:* @${number}\n` +
               `*• Number:* ${number}\n` +
               `*• About:* ${statusText}\n` +
               `*• Last Updated:* ${formatted}`,
      mentions: [target]
    }, { quoted: mek });

  } catch (err) {
    console.error("profile error:", err);
    reply(`❌ Failed to fetch profile info.\nError: ${err.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "fullpp",
  aliases: ["setfullpp"],
  category: "Owner",
  description: "Set full profile picture without cropping"
},
async (from, client, conText) => {
  const { reply, quoted, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  let tempFilePath;

  try {
    const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
    if (!quotedImg) return reply("📸 Quote an image to set as profile picture.");

    tempFilePath = await client.downloadAndSaveMediaMessage(quotedImg, 'temp_media');

    const image = await Jimp.read(tempFilePath);
    const resized = await image.scaleToFit(720, 720);
    const buffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

    const iqNode = {
      tag: "iq",
      attrs: { to: S_WHATSAPP_NET, type: "set", xmlns: "w:profile:picture" },
      content: [{ tag: "picture", attrs: { type: "image" }, content: buffer }]
    };

    await client.query(iqNode);
    await fs.unlink(tempFilePath);
    reply("✅ Profile picture updated successfully (full image).");

  } catch (err) {
    console.error("fullpp error:", err);
    if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
    reply(`❌ Failed to update profile picture.\nError: ${err.message}`);
  }
});
//========================================================================================================================


/*keith({
  pattern: "block",
  aliases: ["ban", "blacklist"],
  category: "Owner",
  description: "Block a user by tag, mention, quoted message, or phone number",
  filename: __filename
}, async (from, client, { reply, q, quotedUser, quotedMsg, mentionedJid, isSuperUser }) => {
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  let target;

  // Case 1: quoted user
  if (quotedMsg && quotedUser) {
    target = quotedUser;
  }
  // Case 2: mentioned user
  else if (mentionedJid?.length) {
    target = mentionedJid[0];
  }
  // Case 3: direct number in args
  else if (q) {
    const possibleNumber = q.trim().split(/\s+/).find(part => /^\d+$/.test(part));
    if (possibleNumber && possibleNumber.length >= 5) {
      target = `${possibleNumber}@s.whatsapp.net`;
    }
  }

  if (!target) {
    return reply("⚠️ Reply, tag, mention, or provide a phone number to block.\nExample: .block 254748387615");
  }

  try {
    const number = target.split('@')[0];
    await client.updateBlockStatus(target, 'block');
    reply(`🚫 @${number} has been blocked.`);
  } catch (err) {
    console.error("block error:", err);
    reply(`❌ Failed to block user.\nError: ${err.message}`);
  }
});*/

//========================================================================================================================

keith({
  pattern: "jid",
  category: "Owner",
  description: "Get User/Group JID"
},
async (from, client, conText) => {
  const { q, mek, reply, isGroup, isSuperUser, quotedUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    let result;

    if (quotedUser) {
      if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
        result = quotedUser.replace('@', '') + '@lid';
      } else {
        result = quotedUser;
      }
    } else if (isGroup) {
      result = from;
    } else {
      result = from || mek.key.remoteJid;
    }

    let finalResult = result;
    if (result && result.includes('@lid')) {
      finalResult = await client.getJidFromLid(result);
    }

    reply(`${finalResult}`);

  } catch (error) {
    console.error("jid error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================



//========================================================================================================================


keith({
  pattern: "setsudo",
  aliases: ['sudo', 'sudoadd', 'addsudo'],
  category: "Owner",
  description: "Sets User as Sudo",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, isSuperUser, quotedUser, quotedMsg, q, setSudo } = conText;

  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  let targetNumber;

  // Case 1: quoted user
  if (quotedMsg && quotedUser) {
    let result = quotedUser;
    if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
      result = quotedUser.replace('@', '') + '@lid';
    }
    let finalResult = result;
    if (result.includes('@lid')) {
      finalResult = await client.getJidFromLid(result);
    }
    targetNumber = finalResult.split("@")[0];
  }

  // Case 2: direct number in args
  if (!targetNumber && q) {
    const possibleNumber = q.trim().split(/\s+/).find(part => /^\d+$/.test(part));
    if (!possibleNumber || possibleNumber.length < 5) {
      return reply("❌ Please provide a valid phone number (at least 5 digits).");
    }
    targetNumber = possibleNumber;
  }

  if (!targetNumber) {
    return reply("❌ Please reply to a user or provide a phone number.\nExample: .setsudo 254748387615");
  }

  try {
    const added = await setSudo(targetNumber);
    const msg = added
      ? `✅ Added @${targetNumber} to sudo list.`
      : `⚠️ @${targetNumber} is already in sudo list.`;

    await client.sendMessage(from, {
      text: msg,
      mentions: quotedUser ? [quotedUser] : []
    }, { quoted: mek });

  } catch (error) {
    console.error("setsudo error:", error);
    await reply(`❌ Error: ${error.message}`);
  }
});

//========================================================================================================================


// Delete sudo
keith({
  pattern: "delsudo",
  aliases: ['removesudo'],
  category: "Owner",
  description: "Deletes User as Sudo",
  filename: __filename
}, async (from, client, { mek, reply, isSuperUser, quotedUser, quotedMsg, q, delSudo }) => {
  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  let targetNumber;

  // Case 1: quoted user
  if (quotedMsg && quotedUser) {
    let result = quotedUser;
    if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
      result = quotedUser.replace('@', '') + '@lid';
    }
    let finalResult = result;
    if (result.includes('@lid')) {
      finalResult = await client.getJidFromLid(result);
    }
    targetNumber = finalResult.split("@")[0];
  }

  // Case 2: direct number in args
  if (!targetNumber && q) {
    const possibleNumber = q.trim().split(/\s+/).find(part => /^\d+$/.test(part));
    if (!possibleNumber || possibleNumber.length < 5) {
      return reply("❌ Please provide a valid phone number (at least 5 digits).");
    }
    targetNumber = possibleNumber;
  }

  if (!targetNumber) {
    return reply("❌ Please reply to a user or provide a phone number.\nExample: .delsudo 254748387615");
  }

  try {
    const removed = await delSudo(targetNumber);
    const msg = removed
      ? `❌ Removed @${targetNumber} from sudo list.`
      : `⚠️ @${targetNumber} is not in the sudo list.`;

    await client.sendMessage(from, {
      text: msg,
      mentions: quotedUser ? [quotedUser] : []
    }, { quoted: mek });

  } catch (error) {
    console.error("delsudo error:", error);
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================

// Check sudo
keith({
  pattern: "issudo",
  aliases: ['checksudo'],
  category: "Owner",
  description: "Check if user is sudo",
  filename: __filename
}, async (from, client, { mek, reply, isSuperUser, quotedUser, quotedMsg, q, isSudo }) => {
  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  let targetNumber;

  // Case 1: quoted user
  if (quotedMsg && quotedUser) {
    let result = quotedUser;
    if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
      result = quotedUser.replace('@', '') + '@lid';
    }
    let finalResult = result;
    if (result.includes('@lid')) {
      finalResult = await client.getJidFromLid(result);
    }
    targetNumber = finalResult.split("@")[0];
  }

  // Case 2: direct number in args
  if (!targetNumber && q) {
    const possibleNumber = q.trim().split(/\s+/).find(part => /^\d+$/.test(part));
    if (!possibleNumber || possibleNumber.length < 5) {
      return reply("❌ Please provide a valid phone number (at least 5 digits).");
    }
    targetNumber = possibleNumber;
  }

  if (!targetNumber) {
    return reply("❌ Please reply to a user or provide a phone number.\nExample: .issudo 254748387615");
  }

  try {
    const isUserSudo = await isSudo(targetNumber);
    const msg = isUserSudo
      ? `✅ @${targetNumber} is a sudo user.`
      : `❌ @${targetNumber} is not a sudo user.`;

    await client.sendMessage(from, {
      text: msg,
      mentions: quotedUser ? [quotedUser] : []
    }, { quoted: mek });

  } catch (error) {
    console.error("issudo error:", error);
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "getsudo",
  aliases: ['getsudos', 'listsudo', 'listsudos'],
  //react: "👑",
  category: "Owner",
  description: "Get All Sudo Users",
}, async (from, client, conText) => {
  const { mek, reply, react, isSuperUser, getSudoNumbers, dev, devNumbers } = conText;

  try {
    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    // Get sudo numbers from database
    const sudoFromDB = await getSudoNumbers() || [];
    
    // Current dev from settings
    const currentDev = dev ? [dev.replace(/\D/g, '')] : [];

    // Combine all sudo users
    const allSudos = [...new Set([...sudoFromDB, ...devNumbers, ...currentDev])];

    if (!allSudos.length) {
      return reply("⚠️ No sudo users found.");
    }

    let msg = "*👑 ALL SUDO USERS*\n\n";
    
    // Database sudo users
    if (sudoFromDB.length > 0) {
      msg += `*Database Sudo Users (${sudoFromDB.length}):*\n`;
      sudoFromDB.forEach((num, i) => {
        msg += `${i + 1}. wa.me/${num}\n`;
      });
      msg += '\n';
    }

    // Hardcoded dev numbers from context
    if (devNumbers && devNumbers.length > 0) {
      msg += `*Hardcoded Dev Numbers (${devNumbers.length}):*\n`;
      devNumbers.forEach((num, i) => {
        msg += `${i + 1}. wa.me/${num}\n`;
      });
      msg += '\n';
    }

    // Current dev from settings
    if (currentDev.length > 0) {
      msg += `*Current Dev (${currentDev.length}):*\n`;
      currentDev.forEach((num, i) => {
        msg += `${i + 1}. wa.me/${num}\n`;
      });
      msg += '\n';
    }

    msg += `*Total Sudo Users: ${allSudos.length}*`;
    
    await reply(msg);
    await react("✅");

  } catch (error) {
    console.error("getsudo error:", error);
    await react("❌");
    await reply(`❌ Error: ${error.message}`);
  }
});
