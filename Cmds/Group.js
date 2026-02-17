const { keith } = require('../commandHandler');
const { getBinaryNodeChild, getBinaryNodeChildren, S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');

//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//======================================================================================l==================================
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
  pattern: "kickall2",
  aliases: ["terminate2", "endgroup2", "kill2"],
  category: "group",
  description: "Terminate a group by link: remove all participants and leave"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser, isBotAdmin, isAdmin, isSuperAdmin, botname } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
 // if (!isBotAdmin) return reply("❌ Bot must be an admin in the target group!");
 // if (!isAdmin && !isSuperAdmin) return reply("❌ You must be an admin to use this command!");
  if (!q) return reply("❌ Provide a valid WhatsApp group link!");

  try {
    // Extract invite code from link
    const inviteCode = q.split("https://chat.whatsapp.com/")[1];
    if (!inviteCode) return reply("❌ Invalid group link format!");

    // Get group info from invite
    const groupInfo = await client.groupGetInviteInfo(inviteCode);
    const groupId = groupInfo.id;

    // Fetch metadata
    const metadata = await client.groupMetadata(groupId);

    // ✅ Mute group (announcement mode)
    await client.groupSettingUpdate(groupId, "announcement");

    // ✅ Change group subject and description
    await client.groupUpdateSubject(groupId, `᧯fucked by ${botname} ᭛💀`);
    await client.groupUpdateDescription(groupId, `᧯fucked by ${botname} ᭛💀`);

    // ✅ Remove group profile picture
    await client.removeProfilePicture(groupId);

    // ✅ Revoke group invite link
    await client.groupRevokeInvite(groupId);

    // Collect participants
    const participants = metadata.participants;

    // Exclude command sender only
    const membersToRemove = participants
      .filter(p => p.id !== from) // exclude the sender
      .map(p => p.id);

    if (membersToRemove.length > 0) {
      await client.groupParticipantsUpdate(groupId, membersToRemove, "remove");
    }

    // Leave group after removal
  //  await client.groupLeave(groupId);

    await reply(`✅ Successfully terminated group *${metadata.subject}* by ${botname}.`);
  } catch (error) {
    console.error("[Kill2] Error:", error);
    //await reply(`❌ Failed to terminate group: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "kickall",
  aliases: ["terminate", "endgroup", "kill"],
  category: "group",
  description: "Remove all participants from a group and leave"
},
async (from, client, conText) => {
  const { reply, mek, sender, isGroup, isSuperUser, isBotAdmin, isAdmin, isSuperAdmin, botname } = conText;

  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isBotAdmin) return reply("❌ Bot is not an admin in this group!");
  

  try {
    const metadata = await client.groupMetadata(from);
    const groupId = metadata.id;

    // ✅ Mute group (announcement mode)
    await client.groupSettingUpdate(groupId, "announcement");

    // ✅ Change group subject and description
    await client.groupUpdateSubject(groupId, `᧯fucked by ${botname} ᭛💀`);
    await client.groupUpdateDescription(groupId, `᧯fucked by ${botname} ᭛💀`);

    // ✅ Remove group profile picture
    await client.removeProfilePicture(groupId);

    // ✅ Revoke group invite link
    await client.groupRevokeInvite(groupId);

    // Collect participants
    const participants = metadata.participants;

    // Exclude command sender only
    const membersToRemove = participants
      .filter(p => p.id !== sender)
      .map(p => p.id);

    if (membersToRemove.length > 0) {
      await client.groupParticipantsUpdate(groupId, membersToRemove, "remove");
    }

    // Leave group after removal
   
    await reply(`✅ Successfully terminated this group by ${botName}.`);
  } catch (error) {
    console.error("[Kill] Error:", error);
    await reply(`❌ Failed to terminate group: ${error.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "rejectall",
  aliases: ["declineall", "reject"],
  category: "group",
  description: "Reject all pending join requests"
},
async (from, client, conText) => {
  const { reply, isGroup, isAdmin, isBotAdmin } = conText;

  if (!isGroup) return reply("This command is meant for groups");
  // if (!isAdmin) return reply("You need admin privileges");
  if (!isBotAdmin) return reply("I need admin privileges");

  const responseList = await client.groupRequestParticipantsList(from);

  if (!responseList.length) return reply("There are no pending join requests at this time.");

  for (const participant of responseList) {
    await client.groupRequestParticipantsUpdate(from, [participant.jid], "reject");
  }

  reply("❌ All pending participants have been rejected.");
});
//========================================================================================================================


keith({
  pattern: "rgpp",
  aliases: ["removegpp", "deletegpp", "cleargpp"],
  category: "group",
  description: "Remove group profile picture"
},
async (from, client, conText) => {
  const { reply, isSuperUser, isGroup } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command can only be used in a group!");

  try {
    // ✅ Get group metadata directly
    const metadata = await client.groupMetadata(from);
    const groupId = metadata.id;

    // ✅ Remove group profile picture
    await client.removeProfilePicture(groupId);

    reply("🗑️ Group profile picture removed successfully!");
  } catch (err) {
    console.error("rgpp error:", err);
    reply(`❌ Failed to remove group profile picture.\nError: ${err.message}`);
  }
});
//========================================================================================================================


keith({
  pattern: "togroupstatus",
  aliases: ["groupstatus", "statusgroup"],
  category: "group",
  description: "Send quoted text or media to group status",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quoted, quotedMsg, mek, reply, isSuperUser } = conText;

  // ✅ Superuser check from context
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  if (!q && !quotedMsg) {
    return reply(
      "📌 Usage:\n" +
      "• togroupstatus <text>\n" +
      "• Reply to an image/video/audio/document/sticker with togroupstatus <caption>\n" +
      "• Or just togroupstatus to forward quoted media without caption"
    );
  }

  try {
    let payload = { groupStatusMessage: {} };

    if (quotedMsg) {
      // Handle quoted media types
      if (quoted?.imageMessage) {
        const caption = q || quoted.imageMessage.caption || "";
        const filePath = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
        payload.groupStatusMessage.image = { url: filePath };
        if (caption) payload.groupStatusMessage.caption = caption;
      } else if (quoted?.videoMessage) {
        const caption = q || quoted.videoMessage.caption || "";
        const filePath = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
        payload.groupStatusMessage.video = { url: filePath };
        if (caption) payload.groupStatusMessage.caption = caption;
      } else if (quoted?.audioMessage) {
        const filePath = await client.downloadAndSaveMediaMessage(quoted.audioMessage);
        payload.groupStatusMessage.audio = { url: filePath };
      } else if (quoted?.documentMessage) {
        const filePath = await client.downloadAndSaveMediaMessage(quoted.documentMessage);
        payload.groupStatusMessage.document = { url: filePath };
      } else if (quoted?.stickerMessage) {
        const filePath = await client.downloadAndSaveMediaMessage(quoted.stickerMessage);
        payload.groupStatusMessage.sticker = { url: filePath };
      } else if (quoted?.conversation || quoted?.extendedTextMessage?.text) {
        payload.groupStatusMessage.text =
          quoted.conversation || quoted.extendedTextMessage.text;
      }

      // If user supplied caption with quoted media
      if (q && !payload.groupStatusMessage.caption) {
        payload.groupStatusMessage.caption = q;
      }
    } else {
      // Plain text status
      payload.groupStatusMessage.text = q;
    }

    await client.sendMessage(from, payload, { quoted: mek });
    await reply("✅ Group status sent.");
  } catch (err) {
    console.error("togroupstatus error:", err);
    await reply(`❌ Error sending group status: ${err.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "creategc",
  aliases: ["creategroup"],
  category: "group",
  description: "Create a new WhatsApp group with optional participants"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser, sender } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!q) return reply(`✏️ Usage: .creategc GroupName\nOr: .creategc GroupName 1234567890,9876543210`);

  try {
    let groupName = q;
    let participants = [sender]; // Always add creator
    
    // Check if phone numbers are provided
    const parts = q.split(/\s+/);
    if (parts.length > 1 && parts[parts.length - 1].match(/\d{10,}/)) {
      // Extract group name (everything except last part with numbers)
      groupName = parts.slice(0, -1).join(' ');
      const numbers = parts[parts.length - 1].split(',');
      
      // Validate and add phone numbers
      for (const num of numbers) {
        const cleanNum = num.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 10) {
          participants.push(cleanNum + '@s.whatsapp.net');
        }
      }
    }
    
    // Create group
    const group = await client.groupCreate(groupName, participants);
    
    // Get group invite code
    const inviteCode = await client.groupInviteCode(group.id);
    
    // Format success message
    const memberCount = participants.length;
    const teks = `✅ *Group Created!*\n\n` +
                `*Name*: ${groupName}\n` +
                `*Members*: ${memberCount}\n` +
                `*Link*: https://chat.whatsapp.com/${inviteCode}\n\n` +
                `The group has been created with you as the admin.`;

    // Send to current chat
    await reply(teks);

  } catch (err) {
    console.error("CreateGC Error:", err);
    reply(`❌ Failed to create group: ${err.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "join",
  aliases: ["joingroup"],
  category: "group",
  description: "Join a WhatsApp group using invite link"
},
async (from, client, conText) => {
  const { reply, q, quotedMsg } = conText;

  if (!q && !quotedMsg) {
    return reply("❌ Please provide a WhatsApp group invite link!\n\nExample: .join https://chat.whatsapp.com/IxMbtAN4lhVEhmbb6BfAsk\nOr quote a message containing the link");
  }

  try {
    let inviteLink;
    
    // Method 1: Check quoted message
    if (quotedMsg) {
      const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
      if (!text) {
        return reply("❌ Quoted message doesn't contain text with a link!");
      }
      inviteLink = text.trim();
    }
    // Method 2: Use provided text
    else if (q) {
      inviteLink = q.trim();
    }

    // Extract invite code from the link
    let inviteCode;
    
    if (inviteLink.includes("chat.whatsapp.com/")) {
      // Extract code from full URL
      inviteCode = inviteLink.split("chat.whatsapp.com/")[1].split("?")[0].split("/")[0];
    } else if (inviteLink.match(/^[A-Za-z0-9]{22}$/)) {
      // Direct invite code provided
      inviteCode = inviteLink;
    } else {
      return reply("❌ Invalid WhatsApp group link format!\n\nProvide a link like: https://chat.whatsapp.com/IxMbtAN4lhVEhmbb6BfAsk\nOr just the code: IxMbtAN4lhVEhmbb6BfAsk");
    }

    // Validate invite code length (WhatsApp codes are usually 22 characters)
    if (inviteCode.length !== 22) {
      return reply("❌ Invalid invite code length! WhatsApp codes should be 22 characters.");
    }

    // Send joining message
    await reply(`⏳ Joining group...`);

    // Accept the invite
    await client.groupAcceptInvite(inviteCode);

    // Get group metadata to get the group name
    const groupInfo = await client.groupGetInviteInfo(inviteCode);
    const groupName = groupInfo.subject || "Unknown Group";

    // Success message with group name
    await reply(`✅ Successfully joined the group:\n\n*${groupName}*`);

  } catch (err) {
    console.error("Join Error:", err);
    
    // Handle specific errors
    if (err.message.includes("invite") || err.message.includes("expired")) {
      reply("❌ The invite link is invalid or has expired!");
    } else if (err.message.includes("already")) {
      reply("⚠️ Bot is already in that group!");
    } else if (err.message.includes("admin")) {
      reply("❌ Bot needs to be added by an admin in some cases!");
    } else {
      reply("❌ Failed to join group: " + err.message);
    }
  }
});
//========================================================================================================================
keith({
  pattern: "left",
  aliases: ["leave", "exit", "bye"],
  category: "group",
  description: "Make the bot leave the current group"
},
async (from, client, conText) => {
  const { reply, isSuperUser, isGroup } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command only works in groups!");

  try {
    // Send goodbye message before leaving
    await reply("👋 Goodbye everyone! Bot is leaving the group...");
    
    // Leave the group
    await client.groupLeave(from);
    
  } catch (err) {
    console.error("Left Error:", err);
    reply("❌ Failed to leave group: " + err.message);
  }
});
//========================================================================================================================
keith({
  pattern: "promote",
  aliases: ['toadmin'],
  category: "group",
  description: "Promote a user to admin (reply or tag)"
}, async (from, client, conText) => {
  const { reply, sender, quotedUser, q, participants, superUser, isSuperAdmin, isAdmin, isSuperUser, isGroup, isBotAdmin, mek } = conText;
  
  if (!isSuperUser) {
    return reply("❌ Owner Only Command!");
  }

  if (!isGroup) {
    return reply("This command only works in groups!");
  }

  

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, { 
      text: `@${userNumber} This bot is not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  let targetUser;

  // Method 1: Check for quoted user
  if (quotedUser) {
    let result = quotedUser.startsWith('@') && quotedUser.includes('@lid')
      ? quotedUser.replace('@', '') + '@lid'
      : quotedUser;

    targetUser = result.includes('@lid')
      ? await client.getJidFromLid(result)
      : result;
  }
  // Method 2: Check for tagged user in message text
  else if (q && q.includes('@')) {
    // Extract mentioned user from the message
    const mentionedJids = mek?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (mentionedJids.length > 0) {
      targetUser = mentionedJids[0]; // Use first mentioned user
    } else {
      return reply("Please reply to a user or tag someone to promote!");
    }
  }
  // Method 3: Check if q contains a phone number
  else if (q) {
    const phone = q.replace(/[^0-9]/g, '');
    if (phone.length >= 10) {
      targetUser = phone + '@s.whatsapp.net';
    } else {
      return reply("Please reply to a user, tag someone, or provide a phone number to promote!");
    }
  }
  else {
    return reply("Please reply to a user, tag someone, or provide a phone number to promote!");
  }

  if (!targetUser.includes('@')) {
    return reply("Invalid user ID");
  }

  // Validate the user exists in group
  const metadata = await client.groupMetadata(from);
  const userInGroup = metadata.participants.find(p => p.id === targetUser);
  
  if (!userInGroup) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is not in this group`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  // Check if already admin
  if (userInGroup.admin === 'admin' || userInGroup.admin === 'superadmin') {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is already an admin`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  try {
    await client.groupParticipantsUpdate(from, [targetUser], 'promote'); 
    const promotedUser = targetUser.split('@')[0];
    await reply(`@${promotedUser} is now an admin. 👑`, { mentions: [`${promotedUser}@s.whatsapp.net`] }); 
    
  } catch (error) {
    console.error("Promotion Error:", error);
    await reply(`❌ Failed to promote: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "kick",
  aliases: ["remove", "bye"],
  category: "group",
  description: "Remove a user from the group (reply or tag)"
},
async (from, client, conText) => {
  const { reply, sender, quotedUser, q, participants, isSuperUser, isGroup, isAdmin, isBotAdmin, isSuperAdmin, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("This command only works in groups!");


  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  let targetUser;

  // Method 1: Check for quoted user
  if (quotedUser) {
    let result = quotedUser.startsWith('@') && quotedUser.includes('@lid')
      ? quotedUser.replace('@', '') + '@lid'
      : quotedUser;

    targetUser = result.includes('@lid')
      ? await client.getJidFromLid(result)
      : result;
  }
  // Method 2: Check for tagged user in message text
  else if (q && q.includes('@')) {
    // Extract mentioned user from the message
    const mentionedJids = mek?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (mentionedJids.length > 0) {
      targetUser = mentionedJids[0]; // Use first mentioned user
    } else {
      return reply("Please reply to a user or tag someone to kick!");
    }
  }
  // Method 3: Check if q contains a phone number
  else if (q) {
    const phone = q.replace(/[^0-9]/g, '');
    if (phone.length >= 10) {
      targetUser = phone + '@s.whatsapp.net';
    } else {
      return reply("Please reply to a user, tag someone, or provide a phone number to kick!");
    }
  }
  else {
    return reply("Please reply to a user, tag someone, or provide a phone number to kick!");
  }

  if (!targetUser.includes('@')) {
    return reply("Invalid user ID");
  }

  // Validate the user exists in group
  const metadata = await client.groupMetadata(from);
  const userInGroup = metadata.participants.find(p => p.id === targetUser);
  
  if (!userInGroup) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is not in this group`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  if (targetUser.includes(isSuperAdmin)) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is a super admin and cannot be removed`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  try {
    await client.groupParticipantsUpdate(from, [targetUser], 'remove');
    const removedUser = targetUser.split('@')[0];
    await reply(`@${removedUser} has been removed from the group.`, { mentions: [`${removedUser}@s.whatsapp.net`] });
  } catch (error) {
    console.error("Kick Error:", error);
    await reply(`❌ Failed to remove: ${error.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "demote",
  aliases: ["removeadmin"],
  category: "group",
  description: "Demote a user from admin (reply or tag)"
},
async (from, client, conText) => {
  const { reply, sender, quotedUser, q, participants, isSuperUser, isGroup, isAdmin, isBotAdmin, isSuperAdmin, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("This command only works in groups!");

  

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  let targetUser;

  // Method 1: Check for quoted user
  if (quotedUser) {
    let result = quotedUser.startsWith('@') && quotedUser.includes('@lid')
      ? quotedUser.replace('@', '') + '@lid'
      : quotedUser;

    targetUser = result.includes('@lid')
      ? await client.getJidFromLid(result)
      : result;
  }
  // Method 2: Check for tagged user in message text
  else if (q && q.includes('@')) {
    // Extract mentioned user from the message
    const mentionedJids = mek?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (mentionedJids.length > 0) {
      targetUser = mentionedJids[0]; // Use first mentioned user
    } else {
      return reply("Please reply to a user or tag someone to demote!");
    }
  }
  // Method 3: Check if q contains a phone number
  else if (q) {
    const phone = q.replace(/[^0-9]/g, '');
    if (phone.length >= 10) {
      targetUser = phone + '@s.whatsapp.net';
    } else {
      return reply("Please reply to a user, tag someone, or provide a phone number to demote!");
    }
  }
  else {
    return reply("Please reply to a user, tag someone, or provide a phone number to demote!");
  }

  if (!targetUser.includes('@')) {
    return reply("Invalid user ID");
  }

  // Validate the user exists in group
  const metadata = await client.groupMetadata(from);
  const userInGroup = metadata.participants.find(p => p.id === targetUser);
  
  if (!userInGroup) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is not in this group`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  if (!userInGroup.admin) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is not an admin`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  if (targetUser.includes(isSuperAdmin)) {
    const userNumber = targetUser.split('@')[0];
    return reply(`@${userNumber} is a super admin and cannot be demoted`, { mentions: [`${userNumber}@s.whatsapp.net`] });
  }

  try {
    await client.groupParticipantsUpdate(from, [targetUser], 'demote');
    const demotedUser = targetUser.split('@')[0];
    await reply(`@${demotedUser} has been demoted.`, { mentions: [`${demotedUser}@s.whatsapp.net`] });
  } catch (error) {
    console.error("Demotion Error:", error);
    await reply(`❌ Failed to demote: ${error.message}`);
  }
});
//========================================================================================================================
 

//========================================================================================================================
//========================================================================================================================
//const { keith } = require('../commandHandler');
//const { keith } = require("../commandHandler");

keith({
  pattern: "groupjid",
  aliases: ["gjid", "gid"],
  category: "group",
  description: "Get the current group's JID (unique ID)",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isGroup } = conText;

  try {
    if (!isGroup) {
      return reply("❌ This command can only be used inside a group.");
    }

    const metadata = await client.groupMetadata(from);
    const groupId = metadata.id;

    // Send only the JID string, no extra text
    await client.sendMessage(from, { text: groupId });
  } catch (err) {
    console.error("groupjid error:", err);
    reply("❌ Failed to fetch group JID. Try again.");
  }
});

//========================================================================================================================

//const { keith } = require('../commandHandler');

keith({
  pattern: "gcdesc",
  aliases: ["setdesc", "groupdesc", "gcdescription"],
  category: "group",
  description: "Update group description"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, isGroup, isBotAdmin } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isBotAdmin) return reply("❌ Bot must be admin to update group description.");
  if (!q) return reply("✏️ Provide a new description text after the command.");

  try {
    await client.groupUpdateDescription(from, q.trim());
    reply(`✅ Group description updated to:\n${q.trim()}`);
  } catch (err) {
    console.error("gcdesc Error:", err);
    reply("❌ Failed to update group description: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "groupname",
  aliases: ["setsubject", "groupsubject"],
  category: "group",
  description: "Update group subject/title"
},
async (from, client, conText) => {
  const { q, reply, isSuperUser, isGroup, isBotAdmin } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isBotAdmin) return reply("❌ Bot must be admin to update group subject.");
  if (!q) return reply("✏️ Provide a new subject text after the command.");

  try {
    await client.groupUpdateSubject(from, q.trim());
    reply(`✅ Group subject updated to: *${q.trim()}*`);
  } catch (err) {
    console.error("gcsubject Error:", err);
    reply("❌ Failed to update group subject: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "demoteall",
  aliases: ["demoteadmins", "stripadmins"],
  category: "group",
  description: "Demote all group admins"
},
async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, isBotAdmin, isSuperAdmin, superUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isBotAdmin) return reply("❌ Bot must be admin to demote others.");

  try {
    // Fetch group metadata
    const metadata = await client.groupMetadata(from);

    // Collect all admins
    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

    // Filter out super admin, bot itself, and superUser numbers
    const demoteIds = admins
      .map(a => a.id)
      .filter(id =>
        id !== isSuperAdmin &&                // skip super admin
        !id.includes(client.user.id) &&       // skip bot itself
        !(Array.isArray(superUser) && superUser.includes(id)) // skip superUser numbers
      );

    if (demoteIds.length === 0) {
      return reply("ℹ️ No admins found to demote.");
    }

    // Demote all in one batch
    await client.groupParticipantsUpdate(from, demoteIds, 'demote');

    // Confirmation message
    await client.sendMessage(from, {
      text: `🔻 All admins have been demoted (${demoteIds.length}).`,
      mentions: demoteIds
    }, { quoted: mek });

  } catch (err) {
    console.error("DemoteAll Error:", err);
    reply("❌ Failed to demote admins: " + err.message);
  }
});
/*keith({
  pattern: "demoteall",
  aliases: ["demoteadmins", "stripadmins"],
  category: "group",
  description: "Demote all group admins"
},
async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, isBotAdmin, isSuperAdmin, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isBotAdmin) return reply("❌ Bot must be admin to demote others.");

  try {
    // Fetch group metadata
    const metadata = await client.groupMetadata(from);

    // Collect all admins
    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

    // Filter out super admin and bot itself
    const demoteIds = admins
      .map(a => a.id)
      .filter(id => id !== isSuperAdmin && !id.includes(client.user.id));

    if (demoteIds.length === 0) {
      return reply("ℹ️ No admins found to demote.");
    }

    // Demote all in one batch
    await client.groupParticipantsUpdate(from, demoteIds, 'demote');

    // Confirmation message
    await client.sendMessage(from, {
      text: `🔻 All admins have been demoted (${demoteIds.length}).`,
      mentions: demoteIds
    }, { quoted: mek });

  } catch (err) {
    console.error("DemoteAll Error:", err);
    reply("❌ Failed to demote admins: " + err.message);
  }
});*/
//========================================================================================================================





//========================================================================================================================


//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "hidetag",
  aliases: ["silenttag", "ghosttag"],
  description: "Send a message tagging all members without visible mentions",
  category: "group",
  filename: __filename
}, async (from, client, conText) => {
  const { q, mek, isGroup, reply, participants } = conText;

  if (!isGroup) return reply("⚠️ This command can only be used in groups.");

  if (!participants || participants.length === 0) {
    return reply("⚠️ No members found in this group.");
  }

  await client.sendMessage(from, {
    text: q || "",
    mentions: participants.map(p => p.id)
  }, { quoted: mek });
});
//========================================================================================================================

keith({
  pattern: "gpp",
  aliases: ["gprofile", "groupinfo"],
  category: "group",
  description: "Show group or user profile info"
},
async (from, client, conText) => {
  const { reply, isGroup, quoted, sender } = conText;

  try {
    let profileInfo;

    if (isGroup) {
      const metadata = await client.groupMetadata(from);
      const participants = metadata.participants || [];

      let ppUrl;
      try {
        ppUrl = await client.profilePictureUrl(from, 'image');
      } catch {
        ppUrl = "https://telegra.ph/file/95680cd03e012bb08b9e6.jpg";
      }

      profileInfo = {
        image: { url: ppUrl },
        caption: `👥 *Group Information*\n\n` +
                 `🔖 *Name:* ${metadata.subject}\n` +
                 `📝 *Description:* ${metadata.desc || 'No description'}\n` +
                 `📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n` +
                 `👤 *Members:* ${participants.length}\n` +
                 `👑 *Admins:* ${participants.filter(p => p.admin).length}\n` +
                 `🔒 *Restricted:* ${metadata.restrict ? 'Yes' : 'No'}\n` +
                 `🆔 *ID:* ${metadata.id}`
      };
    } else {
      const target = quoted?.sender || sender;
      const contact = await client.getContact(target, 'full');
      const name = contact.notify || contact.name || target.split('@')[0];

      let ppUrl;
      try {
        ppUrl = await client.profilePictureUrl(target, 'image');
      } catch {
        ppUrl = "https://telegra.ph/file/95680cd03e012bb08b9e6.jpg";
      }

      let status;
      try {
        status = await client.fetchStatus(target);
      } catch {
        status = { status: "🔒 Private (status not available)" };
      }

      profileInfo = {
        image: { url: ppUrl },
        caption: `👤 *User Profile*\n\n` +
                 `🔖 *Name:* ${name}\n` +
                 `📝 *About:* ${status.status}\n` +
                 `📱 *Number:* ${target.split('@')[0]}\n` +
                 `🆔 *ID:* ${target}`,
        mentions: [target]
      };
    }

    await client.sendMessage(from, profileInfo);

  } catch (err) {
    console.error('gpp error:', err);
    reply("❌ Failed to fetch profile info. Try again.");
  }
});
//========================================================================================================================


keith({
  pattern: "tagall",
  aliases: ["all", "everyone", "mentionall"],
  category: "group",
  description: "Mention all group members with numbered list"
},
async (from, client, conText) => {
  const { reply, q, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
//  if (!isBotAdmin) return reply("Bot is not an admin");

  const metadata = await client.groupMetadata(from);
  const members = metadata.participants.map(p => p.id);
  const tags = members.map((id, i) => `${i + 1} @${id.split('@')[0]}`).join('\n');

  await client.sendMessage(from, {
    text: `${q ? q + '\n\n' : ''}${tags}`,
    mentions: members
  });
});
//========================================================================================================================


keith({
  pattern: "opentime",
  aliases: ["timeopen", "delayopen", "unlockafter"],
  category: "group",
  description: "Set a timer to unmute the group after a delay (in seconds)"
},
async (from, client, conText) => {
  const { reply, q, isAdmin, isGroup, isBotAdmin, isSuperUser, mek, sender } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("Groups Only Command only");

  

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!q || isNaN(q)) return reply("⏱️ Provide a valid time in seconds. Example: .opentime 10");

  const delay = Number(q);
  reply(`⏳ Group will be unmuted in ${delay} seconds...`);

  if (delay > 3) {
    setTimeout(() => {
      reply("⚠️ Group will be unmuted in 3 seconds...");
    }, (delay - 3) * 1000);
  }

  setTimeout(async () => {
    await client.groupSettingUpdate(from, 'not_announcement');
    reply(`🔓 Group has been opened successfully after ${delay} seconds.`);
  }, delay * 1000);
});
//========================================================================================================================


keith({
  pattern: "closetime",
  aliases: ["timemute", "delayclose", "lockafter"],
  category: "group",
  description: "Set a timer to mute the group after a delay (in seconds)"
},
async (from, client, conText) => {
  const { reply, q, isAdmin, isGroup, isBotAdmin, isSuperUser, mek, sender } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("Groups Only Command only");


  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!q || isNaN(q)) return reply("⏱️ Provide a valid time in seconds. Example: .closetime 10");

  const delay = Number(q);
  reply(`⏳ Group will be muted in ${delay} seconds...`);

  if (delay > 3) {
    setTimeout(() => {
      reply("⚠️ Group will be muted in 3 seconds...");
    }, (delay - 3) * 1000);
  }

  setTimeout(async () => {
    await client.groupSettingUpdate(from, 'announcement');
    reply(`🔒 Group has been closed successfully after ${delay} seconds.`);
  }, delay * 1000);
});
//========================================================================================================================


keith({
  pattern: "disap-off",
  aliases: ["disapoff", "ephemeraloff", "disappearoff"],
  category: "group",
  description: "Turn off disappearing messages in the group"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  await client.groupToggleEphemeral(from, 0);
  reply("🧼 Disappearing messages have been turned off.");
});
//========================================================================================================================


keith({
  pattern: "disap1",
  aliases: ["disap24h", "ephemeral1", "disappear1"],
  category: "group",
  description: "Enable disappearing messages for 24 hours"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  await client.groupToggleEphemeral(from, 86400);
  reply("🕒 Disappearing messages set to 24 hours.");
});
//========================================================================================================================


keith({
  pattern: "disap7",
  aliases: ["disap7d", "ephemeral7", "disappear7"],
  category: "group",
  description: "Enable disappearing messages for 7 days"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  await client.groupToggleEphemeral(from, 604800);
  reply("📆 Disappearing messages set to 7 days.");
});
//========================================================================================================================


keith({
  pattern: "disap90",
  aliases: ["disap3mo", "ephemeral90", "disappear90"],
  category: "group",
  description: "Enable disappearing messages for 90 days"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  await client.groupToggleEphemeral(from, 7776000);
  reply("📆 Disappearing messages set to 90 days.");
});
//========================================================================================================================

keith({
  pattern: "revoke",
  aliases: ["resetlink"],
  category: "group",
  description: "Revoke and regenerate the group invite link"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  await client.groupRevokeInvite(from);
  const newCode = await client.groupInviteCode(from);

  reply(`🔄 Group link has been reset:\nhttps://chat.whatsapp.com/${newCode}`);
});
//========================================================================================================================


keith({
  pattern: "grouplink",
  aliases: ["link"],
  category: "group",
  description: "Get the group invite link"
},
async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin } = conText;

  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");

  const code = await client.groupInviteCode(from);
  reply(`🔗 Group Link:\nhttps://chat.whatsapp.com/${code}`);
});
//========================================================================================================================


keith({
  pattern: "approveall",
  aliases: ["acceptall", "approve"],
  category: "group",
  description: "Approve all pending join requests"
},
async (from, client, conText) => {
  const { reply, isGroup, isAdmin, isBotAdmin } = conText;

  if (!isGroup) return reply("This command is meant for groups");
//  if (!isAdmin) return reply("You need admin privileges");
  if (!isBotAdmin) return reply("I need admin privileges");

  const responseList = await client.groupRequestParticipantsList(from);

  if (!responseList.length) return reply("There are no pending join requests at this time.");

  for (const participant of responseList) {
    await client.groupRequestParticipantsUpdate(from, [participant.jid], "approve");
  }

  reply("✅ All pending participants have been approved to join.");
});
//========================================================================================================================


keith({
  pattern: "add",
  aliases: ["invite"],
  category: "group",
  description: "Add user(s) to the group"
},
async (from, client, conText) => {
  const { reply, q, participants, isSuperUser, isGroup, isBotAdmin, sender, mek, pushName } = conText;
  if (!isSuperUser) return reply("owner only!");
  if (!isGroup) return reply("This command only works in groups!");
  if (!isBotAdmin) return reply("Bot is not an admin");
  if (!q) return reply("Provide number(s) to add in this format:\n\nadd 2547xxxxxxx");

  const groupMetadata = await client.groupMetadata(from);
  
  const existing = participants.map(p => p.id);
  const numbers = q.split(',').map(v => v.replace(/[^0-9]/g, '')).filter(v => v.length > 4 && v.length < 20);
  const targets = (await Promise.all(
    numbers
      .filter(v => !existing.includes(v + '@s.whatsapp.net'))
      .map(async v => [v, await client.onWhatsApp(v + '@s.whatsapp.net')])
  )).filter(v => v[1][0]?.exists).map(v => v[0] + '@c.us');

  if (!targets.length) return reply("No valid numbers to add");

  const response = await client.query({
    tag: 'iq',
    attrs: { type: 'set', xmlns: 'w:g2', to: from },
    content: targets.map(jid => ({
      tag: 'add',
      attrs: {},
      content: [{ tag: 'participant', attrs: { jid } }]
    }))
  });

  const addNode = getBinaryNodeChild(response, 'add');
  const failed = getBinaryNodeChildren(addNode, 'participant');
  const inviteCode = await client.groupInviteCode(from);

  for (const user of failed.filter(u => ['401', '403', '408'].includes(u.attrs.error))) {
    const jid = user.attrs.jid;
    const reason = {
      '401': 'has blocked the bot.',
      '403': 'has set privacy settings for group adding.',
      '408': 'recently left the group.'
    }[user.attrs.error];

    await client.sendMessage(from, {
      text: `@${jid.split('@')[0]} ${reason}`,
      mentions: [jid]
    }, { quoted: mek });

    const inviteText = `${pushName} is trying to add or request you to join the group ${groupMetadata.subject}:\n\nhttps://chat.whatsapp.com/${inviteCode}`;

    await client.sendMessage(jid, { text: inviteText }, { quoted: mek });
  }
});
//========================================================================================================================
keith({
  pattern: "delete",
  aliases: ['del'],
  category: "group", 
  description: "Delete bot's message",
}, async (from, client, conText) => {
  const { reply, isGroup, isBotAdmin, mek, quotedMsg, isSuperUser, quotedKey, quotedSender } = conText;

  if (!isSuperUser) return reply("owner only!");
  if (!quotedMsg) return reply("did you quote a message?");

  
  try {
    await client.sendMessage(from, {
      delete: {
        remoteJid: from,
        fromMe: false,
        id: quotedKey,
        participant: quotedSender
      }
    });
  } catch (err) {
    console.error("Delete Error:", err);
    reply(`❌ Failed to delete message: ${err.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "poll",
  aliases: ["vote", "question"],
  category: "group",
  description: "Create a poll in the group"
},
async (from, client, conText) => {
  const { q, reply, isGroup } = conText;

  if (!isGroup) return reply("Polls can only be created in groups.");
  if (!q || !q.includes('|')) return reply("Use format: .poll Question | Option 1 | Option 2");

  const parts = q.split('|').map(p => p.trim());
  const title = parts[0];
  const options = parts.slice(1);

  if (options.length < 2 || options.length > 12) return reply("Poll must have 2–12 options.");

  try {
    await client.sendMessage(from, {
      poll: {
        name: title,
        values: options,
        selectableCount: 1,
        toAnnouncementGroup: false
      }
    });
  } catch (err) {
    console.error("Poll Error:", err);
    reply(`❌ Failed to send poll: ${err.message}`);
  }
});
//========================================================================================================================
keith({
  pattern: "open",
  aliases: ["unmute", "groupopen", "gcopen", "adminonly", "adminsonly"],
  category: "group",
  description: "Open Group Chat"
},
async (from, client, conText) => {
  const { reply, isAdmin, isGroup, isBotAdmin, isSuperUser, mek, sender } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return client.sendMessage(from, { text: "Groups Only Command only" });

  

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  await client.groupSettingUpdate(from, 'not_announcement');

  const userNumber = sender.split('@')[0];
  return client.sendMessage(from, {
    text: `@${userNumber} Group successfully unmuted as you wished!`,
    mentions: [`${userNumber}@s.whatsapp.net`]
  }, { quoted: mek });
});
//========================================================================================================================
keith({
  pattern: "close",
  aliases: ["mute", "groupmute", "gcmute", "gcclose"],
  category: "group",
  description: "Close Group Chat"
},
async (from, client, conText) => {
  const { reply, isAdmin, isGroup, isBotAdmin, isSuperUser, mek, sender } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return client.sendMessage(from, { text: "Groups Only Command only" });

  

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return client.sendMessage(from, {
      text: `@${userNumber} This bot is not an admin`,
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  await client.groupSettingUpdate(from, 'announcement');

  const userNumber = sender.split('@')[0];
  return client.sendMessage(from, {
    text: `@${userNumber} Group successfully muted as you wished!`,
    mentions: [`${userNumber}@s.whatsapp.net`]
  }, { quoted: mek });
});
//========================================================================================================================

    















