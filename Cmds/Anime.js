
const { keith } = require('../commandHandler');




// ============================================================
// Business Address
// ============================================================
keith({
  pattern: "bizaddress",
  aliases: ["setaddress", "bizaddr"],
  category: "wa-business",
  description: "Set business address",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply(`📌 *Set Business Address*
    
Set your business address.

*Usage:*
.bizaddress 123 Main St, City, Country

*Example:*
.bizaddress 123 Main Street, Nairobi, Kenya`);
  }

  try {
    await reply("Updating business address...");
    await client.updateBussinesProfile({ address: q.trim() });
    await reply(`✅ Business address updated to: ${q.trim()}`);
  } catch (err) {
    console.error("bizaddress error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Business Email
// ============================================================
keith({
  pattern: "bizemail",
  aliases: ["setemail", "bizmail"],
  category: "wa-business",
  description: "Set business email",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply(`📌 *Set Business Email*
    
Set your business email address.

*Usage:*
.bizemail business@example.com

*Example:*
.bizemail info@mycompany.com`);
  }

  // Basic email validation
  if (!q.includes('@') || !q.includes('.')) {
    return reply("Invalid email format. Please provide a valid email address.");
  }

  try {
    await reply("Updating business email...");
    await client.updateBussinesProfile({ email: q.trim() });
    await reply(`✅ Business email updated to: ${q.trim()}`);
  } catch (err) {
    console.error("bizemail error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Business Description
// ============================================================
keith({
  pattern: "bizdesc",
  aliases: ["setdescription", "bizdescription", "bizbio"],
  category: "wa-business",
  description: "Set business description",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply(`📌 *Set Business Description*
    
Set your business description.

*Usage:*
.bizdesc We sell amazing products...

*Example:*
.bizdesc Premium quality products delivered worldwide`);
  }

  if (q.length > 500) {
    return reply("Description too long. Maximum 500 characters.");
  }

  try {
    await reply("Updating business description...");
    await client.updateBussinesProfile({ description: q.trim() });
    await reply(`✅ Business description updated!`);
  } catch (err) {
    console.error("bizdesc error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Business Website
// ============================================================
keith({
  pattern: "bizwebsite",
  aliases: ["setwebsite", "bizurl", "bizsite"],
  category: "wa-business",
  description: "Set business website",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply(`📌 *Set Business Website*
    
Set your business website URL.

*Usage:*
.bizwebsite https://example.com

*Example:*
.bizwebsite https://mycompany.com`);
  }

  if (!q.startsWith('http://') && !q.startsWith('https://')) {
    return reply("Invalid URL. Please include http:// or https://");
  }

  try {
    await reply("Updating business website...");
    await client.updateBussinesProfile({ websites: [q.trim()] });
    await reply(`✅ Business website updated to: ${q.trim()}`);
  } catch (err) {
    console.error("bizwebsite error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Business Hours
// ============================================================
keith({
  pattern: "bizhours",
  aliases: ["biztime", "businesshours", "sethours"],
  category: "wa-business",
  description: "Set business hours",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply(`📌 *Set Business Hours*
    
Set your business opening hours.

*Usage:*
.bizhours monday | 09:00 | 17:00
.bizhours sunday | closed

*Examples:*
.bizhours monday | 09:00 | 17:00
.bizhours tuesday | 09:00 | 17:00
.bizhours wednesday | 09:00 | 17:00
.bizhours sunday | closed

*Set all at once using JSON:*
.bizhours json | {"timezone":"America/New_York","days":[{"day":"monday","mode":"specific_hours","openTimeInMinutes":540,"closeTimeInMinutes":1020}]}`);
  }

  try {
    let hoursData;

    if (q.toLowerCase().startsWith('json')) {
      const jsonStr = q.replace(/^json\s*\|?\s*/, '');
      hoursData = JSON.parse(jsonStr);
    } else {
      const parts = q.split('|').map(s => s.trim());
      
      if (parts.length < 2) {
        return reply("Invalid format. Use: .bizhours day | open | close");
      }

      const dayMap = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
      };
      
      const day = parts[0].toLowerCase();
      
      if (dayMap[day] === undefined) {
        return reply(`Invalid day: ${day}\nAvailable: monday, tuesday, wednesday, thursday, friday, saturday, sunday`);
      }

      const open = parts[1];
      const close = parts[2];

      if (open.toLowerCase() === 'closed') {
        hoursData = {
          timezone: 'America/New_York',
          days: [{ day: day, mode: 'appointment_only' }]
        };
      } else if (!close) {
        return reply("Please provide both open and close time.\nExample: .bizhours monday | 09:00 | 17:00");
      } else {
        const [openHour, openMin] = open.split(':').map(Number);
        const [closeHour, closeMin] = close.split(':').map(Number);
        
        if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
          return reply("Invalid time format. Use HH:MM (e.g., 09:00)");
        }
        
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        hoursData = {
          timezone: 'America/New_York',
          days: [{ 
            day: day, 
            mode: 'specific_hours', 
            openTimeInMinutes: openMinutes, 
            closeTimeInMinutes: closeMinutes 
          }]
        };
      }
    }

    await client.updateBussinesProfile({ hours: hoursData });
    await reply("✅ Business hours updated successfully!");

  } catch (err) {
    console.error("bizhours error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Business Profile - View All
// ============================================================
keith({
  pattern: "bizview",
  aliases: ["viewbiz", "bizinfo", "bizprofile"],
  category: "wa-business",
  description: "View business profile information",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  try {
    await reply("Fetching business profile...");
    
    // Note: You may need to fetch the profile differently depending on your Baileys version
    // This is a placeholder - adjust based on available methods
    const profile = await client.getBusinessProfile(client.user.id);
    
    if (!profile) {
      return reply("No business profile found.");
    }

    let text = `📊 *Business Profile*\n\n`;
    text += `📍 *Address:* ${profile.address || 'Not set'}\n`;
    text += `📧 *Email:* ${profile.email || 'Not set'}\n`;
    text += `📝 *Description:* ${profile.description || 'Not set'}\n`;
    text += `🌐 *Website:* ${profile.websites?.[0] || 'Not set'}\n`;
    text += `⏰ *Hours:* ${profile.hours ? 'Configured' : 'Not set'}\n`;
    text += `🖼️ *Cover Photo:* ${profile.coverPhoto ? '✅ Set' : 'Not set'}`;

    await client.sendMessage(from, { text }, { quoted: mek });

  } catch (err) {
    console.error("bizview error:", err);
    reply(`Error: ${err.message}`);
  }
});

// ============================================================
// Cover Photo Commands
// ============================================================
keith({
  pattern: "bizcover",
  aliases: ["coverphoto", "updatecover", "bizcoverphoto"],
  category: "wa-business",
  description: "Update business cover photo",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser, quotedMsg } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!quotedMsg?.imageMessage) {
    return reply("Reply to an image with .bizcover to set as business cover photo");
  }

  try {
    await reply("Updating cover photo...");

    const filePath = await client.downloadAndSaveMediaMessage(quotedMsg.imageMessage);
    const coverId = await client.updateCoverPhoto({ url: filePath });
    
    fs.unlinkSync(filePath);
    
    await reply(`✅ Cover photo updated successfully!\n🆔 Cover ID: ${coverId}`);

  } catch (err) {
    console.error("bizcover error:", err);
    reply(`Error: ${err.message}`);
  }
});

keith({
  pattern: "removecover",
  aliases: ["deletecover", "removebizcover"],
  category: "wa-business",
  description: "Remove business cover photo",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q) {
    return reply("Provide the cover ID to remove.\n\nUsage: .removecover <cover_id>");
  }

  try {
    await reply("Removing cover photo...");
    await client.removeCoverPhoto(q.trim());
    await reply("✅ Cover photo removed successfully!");

  } catch (err) {
    console.error("removecover error:", err);
    reply(`Error: ${err.message}`);
  }
});
//========================================================================================================================
// All commands below map directly to the community methods exposed by your baileys build
// (lib/Socket/communities.js): communityCreate, communityMetadata, communityFetchAllParticipating,
// communityLinkGroup, communityUnlinkGroup, communityFetchLinkedGroups, communityUpdateSubject,
// communityUpdateDescription, communityInviteCode, communityRevokeInvite, communityAcceptInvite,
// communityLeave, communityMemberAddMode, communityJoinApprovalMode, communityToggleEphemeral.
//========================================================================================================================

keith({
  pattern: "communitycreate",
  aliases: ["createcommunity", "newcommunity"],
  category: "Community",
  description: "Create a new WhatsApp Community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!q) return reply("📌 Usage: .communitycreate <name> | <description>\nExample: .communitycreate My Community | A place for everyone");

  const [subject, ...rest] = q.split("|");
  const body = rest.join("|").trim();

  if (!subject.trim()) return reply("❌ Please provide a community name.");

  try {
    const result = await client.communityCreate(subject.trim(), body);
    if (!result) return reply("❌ Failed to create community.");

    await client.sendMessage(from, {
      text: `✅ Community created!\n\n*Name:* ${subject.trim()}\n${body ? `*Description:* ${body}\n` : ''}*JID:* ${result.id || 'unknown'}`
    }, { quoted: mek });
  } catch (err) {
    console.error("communitycreate error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityinfo",
  aliases: ["communitymetadata", "cinfo"],
  category: "Community",
  description: "Show metadata for the current community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");

  try {
    const meta = await client.communityMetadata(from);
    if (!meta) return reply("❌ Could not fetch community metadata. Is this actually a community?");

    const info = [
      `*🏘️ Community Info*`,
      ``,
      `*Name:* ${meta.subject}`,
      `*JID:* ${meta.id}`,
      `*Owner:* ${meta.owner ? `wa.me/${meta.owner.split('@')[0]}` : 'unknown'}`,
      `*Members:* ${meta.size ?? 'unknown'}`,
      `*Description:* ${meta.desc || 'None'}`,
      `*Join approval required:* ${meta.joinApprovalMode ? 'Yes' : 'No'}`,
      `*Member add mode (all members):* ${meta.memberAddMode ? 'Yes' : 'No (admins only)'}`
    ].join("\n");

    await client.sendMessage(from, { text: info }, { quoted: mek });
  } catch (err) {
    console.error("communityinfo error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communitylist",
  aliases: ["mycommunities", "communities"],
  category: "Community",
  description: "List all communities the bot is participating in",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const all = await client.communityFetchAllParticipating();
    const list = Object.values(all || {});

    if (!list.length) return reply("⚠️ Bot is not in any communities.");

    let msg = `*🏘️ My Communities (${list.length})*\n\n`;
    list.forEach((c, i) => {
      msg += `${i + 1}. *${c.subject || 'Unnamed'}*\n   🆔 ${c.id}\n   👥 ${c.size ?? '?'} members\n\n`;
    });

    await client.sendMessage(from, { text: msg.trim() }, { quoted: mek });
  } catch (err) {
    console.error("communitylist error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communitylink",
  aliases: ["linkgroup", "attachgroup"],
  category: "Community",
  description: "Link a group to the current community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communitylink <groupJid>\nExample: .communitylink 12345-6789@g.us");

  const groupJid = q.trim().includes('@g.us') ? q.trim() : `${q.trim()}@g.us`;

  try {
    await client.communityLinkGroup(groupJid, from);
    await client.sendMessage(from, { text: `✅ Linked group ${groupJid} to this community.` }, { quoted: mek });
  } catch (err) {
    console.error("communitylink error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityunlink",
  aliases: ["unlinkgroup", "detachgroup"],
  category: "Community",
  description: "Unlink a group from the current community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communityunlink <groupJid>\nExample: .communityunlink 12345-6789@g.us");

  const groupJid = q.trim().includes('@g.us') ? q.trim() : `${q.trim()}@g.us`;

  try {
    await client.communityUnlinkGroup(groupJid, from);
    await client.sendMessage(from, { text: `✅ Unlinked group ${groupJid} from this community.` }, { quoted: mek });
  } catch (err) {
    console.error("communityunlink error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communitylinkedgroups",
  aliases: ["subgroups", "clinked"],
  category: "Community",
  description: "List all groups linked to this community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community (or a linked group) chat.");

  try {
    const result = await client.communityFetchLinkedGroups(from);
    const groups = result?.linkedGroups || [];

    if (!groups.length) return reply("⚠️ No linked groups found.");

    let msg = `*🔗 Linked Groups (${groups.length})*\n\n`;
    groups.forEach((g, i) => {
      msg += `${i + 1}. *${g.subject || 'Unnamed'}*\n   🆔 ${g.id}\n   👥 ${g.size ?? '?'} members\n\n`;
    });

    await client.sendMessage(from, { text: msg.trim() }, { quoted: mek });
  } catch (err) {
    console.error("communitylinkedgroups error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communitysubject",
  aliases: ["communityname", "csubject"],
  category: "Community",
  description: "Update the community's name",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communitysubject <new name>");

  try {
    await client.communityUpdateSubject(from, q.trim());
    await client.sendMessage(from, { text: `✅ Community name updated to: *${q.trim()}*` }, { quoted: mek });
  } catch (err) {
    console.error("communitysubject error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communitydesc",
  aliases: ["communitydescription", "cdesc"],
  category: "Community",
  description: "Update the community's description",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communitydesc <new description>");

  try {
    await client.communityUpdateDescription(from, q.trim());
    await client.sendMessage(from, { text: `✅ Community description updated.` }, { quoted: mek });
  } catch (err) {
    console.error("communitydesc error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityinvite",
  aliases: ["communitylink2", "cinvite"],
  category: "Community",
  description: "Get the community's invite link",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");

  try {
    const code = await client.communityInviteCode(from);
    if (!code) return reply("❌ Failed to fetch invite code.");

    await client.sendMessage(from, {
      text: `🔗 Community invite link:\nhttps://chat.whatsapp.com/${code}`
    }, { quoted: mek });
  } catch (err) {
    console.error("communityinvite error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityrevoke",
  aliases: ["crevoke", "resetcommunitylink"],
  category: "Community",
  description: "Revoke and regenerate the community's invite link",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");

  try {
    const code = await client.communityRevokeInvite(from);
    if (!code) return reply("❌ Failed to revoke invite code.");

    await client.sendMessage(from, {
      text: `✅ Invite link reset.\n🔗 New link:\nhttps://chat.whatsapp.com/${code}`
    }, { quoted: mek });
  } catch (err) {
    console.error("communityrevoke error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityjoin",
  aliases: ["joincommunity", "cjoin"],
  category: "Community",
  description: "Join a community via invite code or link",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!q) return reply("📌 Usage: .communityjoin <code or link>\nExample: .communityjoin https://chat.whatsapp.com/ABC123");

  const code = q.trim().split('/').pop();

  try {
    const jid = await client.communityAcceptInvite(code);
    if (!jid) return reply("❌ Failed to join community. Check the invite link/code.");

    await client.sendMessage(from, { text: `✅ Joined community: ${jid}` }, { quoted: mek });
  } catch (err) {
    console.error("communityjoin error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityleave",
  aliases: ["leavecommunity", "cleave"],
  category: "Community",
  description: "Leave the current community",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");

  try {
    await client.communityLeave(from);
    await reply("✅ Left the community.");
  } catch (err) {
    console.error("communityleave error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityaddmode",
  aliases: ["caddmode"],
  category: "Community",
  description: "Set who can add members: all members or admins only",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communityaddmode <all|admin>");

  const value = q.trim().toLowerCase();
  if (!['all', 'admin'].includes(value)) {
    return reply("❌ Invalid value.\nAvailable options: all, admin");
  }

  try {
    // Baileys' communityMemberAddMode expects the raw mode string sent to WhatsApp servers.
    const mode = value === 'all' ? 'all_member_add' : 'admin_add';
    await client.communityMemberAddMode(from, mode);
    await client.sendMessage(from, {
      text: `✅ Member add mode set to: *${value === 'all' ? 'All members' : 'Admins only'}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("communityaddmode error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "communityapproval",
  aliases: ["cjoinapproval"],
  category: "Community",
  description: "Toggle whether new members need admin approval to join",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser, isGroup, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");
  if (!isGroup) return reply("❌ Run this inside the community chat.");
  if (!q) return reply("📌 Usage: .communityapproval <on|off>");

  const value = q.trim().toLowerCase();
  if (!['on', 'off'].includes(value)) {
    return reply("❌ Invalid value.\nAvailable options: on, off");
  }

  try {
    await client.communityJoinApprovalMode(from, value === 'on' ? 'on' : 'off');
    await client.sendMessage(from, {
      text: `✅ Join approval mode turned *${value.toUpperCase()}*`
    }, { quoted: mek });
  } catch (err) {
    console.error("communityapproval error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================
