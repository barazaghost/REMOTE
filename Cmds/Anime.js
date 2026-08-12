
const { keith } = require('../commandHandler');

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
