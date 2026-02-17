
const { keith } = require('../commandHandler');
const axios = require('axios');
const { 
    getGroupEventsSettings, 
    updateGroupEventsSettings,
    clearAllWarns
} = require('../database/groupevents');
const { 
    getWarnSettings,
    updateWarnSettings,
    getAllWarnGroups,
    addWarn,
    removeWarn,
    getUserWarnCount,
    getUserWarns,
    getAllWarns,
    clearUserWarns,
    clearAllWarns,
    initWarnDB  // Make sure to import initWarnDB
} = require('../database/warn');

// ✅ Initialize warn table on startup
initWarnDB().catch(err => {
  console.error("❌ Failed to initialize warn database:", err);
});

keith({
  pattern: "warn",
  aliases: ["warning", "strike"],
  category: "Owner",
  desc: "Warn users in the group",
  use: '.warn @user <reason> / .warn list / .warn reset',
  react: "⚠️"
},
async (from, client, conText) => {
  const { reply, q, sender, quotedUser, mek, isGroup, isBotAdmin, isAdmin, isSuperUser, groupName, participants } = conText;

  if (!isGroup) return reply("❌ This command only works in groups!");
  if (!isBotAdmin) return reply("❌ I need to be an admin to warn users!");
  if (!isSuperUser) return reply("❌ Only admins can use this command!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const value = args.slice(1).join(" ");

  // Get settings for this group
  const settings = await getWarnSettings(from);

  // Helper to get target user from reply/tag
  const getTargetUser = async () => {
    // Method 1: Check for quoted user
    if (quotedUser) {
      let result = quotedUser.startsWith('@') && quotedUser.includes('@lid')
        ? quotedUser.replace('@', '') + '@lid'
        : quotedUser;

      return result.includes('@lid')
        ? await client.getJidFromLid(result)
        : result;
    }
    
    // Method 2: Check for tagged user in message text
    if (q && q.includes('@')) {
      const mentionedJids = mek?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentionedJids.length > 0) {
        return mentionedJids[0];
      }
    }
    
    // Method 3: Check if q contains a phone number
    if (args[0] && !args[0].startsWith('@') && !['list', 'reset', 'clear', 'settings', 'remove'].includes(args[0])) {
      const phone = args[0].replace(/[^0-9]/g, '');
      if (phone.length >= 10) {
        return phone + '@s.whatsapp.net';
      }
    }
    
    return null;
  };

  // ===== LIST ALL WARNS IN GROUP =====
  if (subcommand === 'list' || subcommand === 'all') {
    const allWarns = await getAllWarns(from);
    const warnCount = Object.keys(allWarns).length;
    
    if (warnCount === 0) {
      return reply("📋 No warnings have been issued in this group.");
    }

    let message = `*📋 Warning List (${warnCount} users)*\n\n`;
    
    for (const [userJid, warns] of Object.entries(allWarns)) {
      const userName = userJid.split('@')[0];
      message += `*👤 @${userName}* - ${warns.length}/${settings.warn_limit} warnings\n`;
      
      warns.slice(0, 3).forEach((warn, index) => {
        const warner = warn.warnedBy.split('@')[0];
        const date = new Date(warn.createdAt).toLocaleDateString();
        message += `   └ ⚠️ ${index + 1}. ${warn.reason} (by @${warner} • ${date})\n`;
      });
      
      if (warns.length > 3) {
        message += `   └ ... and ${warns.length - 3} more\n`;
      }
      message += '\n';
    }
    
    return reply(message, { mentions: [...Object.keys(allWarns), ...Object.values(allWarns).flat().map(w => w.warnedBy)] });
  }

  // ===== CHECK USER'S WARNS =====
  if (subcommand === 'check' || subcommand === 'status') {
    const targetUser = await getTargetUser();
    
    if (!targetUser) {
      return reply("❌ Please reply to a user or tag someone to check warnings!");
    }
    
    const warns = await getUserWarns(from, targetUser);
    const warnCount = warns.length;
    const userName = targetUser.split('@')[0];
    
    if (warnCount === 0) {
      return reply(`✅ @${userName} has no warnings.`, { mentions: [targetUser] });
    }
    
    let message = `*⚠️ Warnings for @${userName}* (${warnCount}/${settings.warn_limit})\n\n`;
    
    warns.forEach((warn, index) => {
      const warner = warn.warnedBy.split('@')[0];
      const date = new Date(warn.createdAt).toLocaleString();
      message += `*${index + 1}.* ${warn.reason}\n`;
      message += `   └ 👮 By: @${warner}\n`;
      message += `   └ 📅 ${date}\n\n`;
    });
    
    if (warnCount >= settings.warn_limit) {
      message += `\n⚠️ *This user has reached the warning limit!*`;
    }
    
    return reply(message, { mentions: [targetUser, ...warns.map(w => w.warnedBy)] });
  }

  // ===== REMOVE A SPECIFIC WARN =====
  if (subcommand === 'remove' || subcommand === 'delete') {
    if (!value || isNaN(parseInt(value))) {
      return reply("❌ Please provide the warn ID to remove.\nExample: .warn remove 5");
    }
    
    const warnId = parseInt(value);
    const success = await removeWarn(warnId);
    
    if (success) {
      return reply(`✅ Warning #${warnId} has been removed.`);
    } else {
      return reply(`❌ Warning #${warnId} not found.`);
    }
  }

  // ===== CLEAR ALL WARNS FOR A USER =====
  if (subcommand === 'clear' || subcommand === 'reset') {
    const targetUser = await getTargetUser();
    
    if (!targetUser) {
      // Clear all warns in group
      if (value === 'all' || value === '--all') {
        await clearAllWarns(from);
        return reply(`✅ All warnings have been cleared in this group.`);
      }
      return reply("❌ Please reply to a user or tag someone to clear warnings!");
    }
    
    const userName = targetUser.split('@')[0];
    await clearUserWarns(from, targetUser);
    
    return reply(`✅ All warnings cleared for @${userName}.`, { mentions: [targetUser] });
  }

  // ===== WARN SETTINGS =====
  if (subcommand === 'settings') {
    if (!value) {
      return reply(
        `*⚙️ Warn Settings for this Group*\n\n` +
        `📌 *Group:* ${groupName || 'Unknown'}\n` +
        `📍 *JID:* \`${from}\`\n\n` +
        `🔹 *Status:* ${settings.status === 'on' ? '✅ ON' : '❌ OFF'}\n` +
        `🔹 *Warn Limit:* ${settings.warn_limit}\n` +
        `🔹 *Action:* ${settings.action === 'kick' ? '🚫 Kick' : '🗑️ Delete Messages'}\n` +
        `🔹 *Exempt Admins:* ${settings.exempt_admins ? '✅ Yes' : '❌ No'}\n` +
        `🔹 *Auto Reset:* ${settings.auto_reset_days} days\n\n` +
        `*Commands:*\n` +
        `▸ ${conText.prefix}warn settings limit <number>\n` +
        `▸ ${conText.prefix}warn settings action kick/delete\n` +
        `▸ ${conText.prefix}warn settings adminexempt on/off\n` +
        `▸ ${conText.prefix}warn settings resetdays <1-30>`
      );
    }
    
    const settingArgs = value.split(' ');
    const settingName = settingArgs[0]?.toLowerCase();
    const settingValue = settingArgs[1];
    
    if (settingName === 'limit') {
      const limit = parseInt(settingValue);
      if (isNaN(limit) || limit < 1 || limit > 20) {
        return reply("❌ Limit must be between 1 and 20");
      }
      await updateWarnSettings(from, { warn_limit: limit });
      return reply(`✅ Warn limit set to: *${limit}*`);
    }
    
    if (settingName === 'action') {
      if (!['kick', 'delete'].includes(settingValue)) {
        return reply("❌ Action must be 'kick' or 'delete'");
      }
      await updateWarnSettings(from, { action: settingValue });
      const actionMsg = settingValue === 'kick' ? '🚫 Users will be kicked' : '🗑️ Messages will be deleted';
      return reply(`✅ Warn action set to: *${settingValue.toUpperCase()}*\n${actionMsg}`);
    }
    
    if (settingName === 'adminexempt') {
      if (!['on', 'off'].includes(settingValue)) {
        return reply("❌ Use: on or off");
      }
      await updateWarnSettings(from, { exempt_admins: settingValue === 'on' });
      return reply(`✅ Admin exemption ${settingValue === 'on' ? 'enabled' : 'disabled'}.`);
    }
    
    if (settingName === 'resetdays') {
      const days = parseInt(settingValue);
      if (isNaN(days) || days < 1 || days > 30) {
        return reply("❌ Days must be between 1 and 30");
      }
      await updateWarnSettings(from, { auto_reset_days: days });
      return reply(`✅ Auto-reset set to *${days} days*`);
    }
    
    return reply("❌ Invalid setting. Use: limit, action, adminexempt, or resetdays");
  }

  // ===== MAIN WARN COMMAND =====
  const targetUser = await getTargetUser();
  
  if (!targetUser) {
    return reply(
      `*⚠️ Warn Command Usage*\n\n` +
      `▸ Reply to a message: *${conText.prefix}warn <reason>*\n` +
      `▸ Tag a user: *${conText.prefix}warn @user <reason>*\n` +
      `▸ Check warns: *${conText.prefix}warn check @user*\n` +
      `▸ List all: *${conText.prefix}warn list*\n` +
      `▸ Clear warns: *${conText.prefix}warn clear @user*\n` +
      `▸ Settings: *${conText.prefix}warn settings*`
    );
  }

  // Check if user is admin and if admins are exempt
  const isTargetAdmin = participants.some(p => 
    (p.id === targetUser) && (p.admin === 'admin' || p.admin === 'superadmin')
  );
  
  if (settings.exempt_admins && isTargetAdmin) {
    return reply("❌ Cannot warn an admin!");
  }

  // Check if target is super user (owner)
  const devNumbers = ['254748387615', '254110190196', '254796299159', '254752925938', '254786989022', '254743995989'];
  const targetNumber = targetUser.split('@')[0];
  if (devNumbers.includes(targetNumber)) {
    return reply("❌ Cannot warn the owner!");
  }

  // Get reason
  const reason = value || 'No reason provided';
  
  // Add warn
  const result = await addWarn(from, targetUser, sender, reason);
  
  if (!result.success) {
    return reply(`❌ Failed to warn: ${result.error}`);
  }

  const warnCount = result.warnCount;
  const limit = result.limit;
  const userName = targetUser.split('@')[0];
  const warnerName = sender.split('@')[0];

  // Check if reached limit
  if (warnCount >= limit) {
    // Take action based on settings
    if (settings.action === 'kick') {
      try {
        await client.groupParticipantsUpdate(from, [targetUser], 'remove');
        await clearUserWarns(from, targetUser); // Clear warns after kicking
        
        return reply(
          `🚫 @${userName} has been *REMOVED* from the group!\n\n` +
          `⚠️ *Warning ${warnCount}/${limit}*\n` +
          `👮 Warned by: @${warnerName}\n` +
          `📝 Last reason: ${reason}\n\n` +
          `_User reached warning limit and was removed._`,
          { mentions: [targetUser, sender] }
        );
      } catch (err) {
        return reply(
          `⚠️ @${userName} has reached ${warnCount}/${limit} warnings!\n` +
          `❌ Failed to remove user: ${err.message}`,
          { mentions: [targetUser] }
        );
      }
    } else {
      // Just show warning
      return reply(
        `⚠️ @${userName} has reached ${warnCount}/${limit} warnings!\n` +
        `👮 Warned by: @${warnerName}\n` +
        `📝 Last reason: ${reason}\n\n` +
        `_User has reached warning limit._`,
        { mentions: [targetUser, sender] }
      );
    }
  } else {
    const remaining = limit - warnCount;
    return reply(
      `⚠️ *Warning ${warnCount}/${limit}* for @${userName}\n\n` +
      `👮 Warned by: @${warnerName}\n` +
      `📝 Reason: ${reason}\n\n` +
      `_${remaining} more warning${remaining > 1 ? 's' : ''} until ${settings.action === 'kick' ? 'removal' : 'action'}._`,
      { mentions: [targetUser, sender] }
    );
  }
});




keith({
  pattern: "antidemote",
  aliases: ["antidem", "nodemote"],
  category: "Settings",
  description: "Prevent unauthorized demotions in group"
  
},
async (from, client, conText) => {
  const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

  if (!isGroup) return reply("❌ This command can only be used in groups!");
if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-demote!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const value = args[1];

  // Get settings for this specific group
  const settings = await getGroupEventsSettings(from);

  // Handle list command - shows all groups with anti-demote enabled
  if (subcommand === 'list') {
    const allGroups = await require('../database/groupevents').getAllGroupEventsGroups();
    const antiDemoteGroups = allGroups.filter(g => g.antiDemote === 'on');
    
    if (antiDemoteGroups.length === 0) {
      return reply("📋 No groups have anti-demote enabled.");
    }

    let listMessage = "*🔄 Anti-Demote Active Groups*\n\n";
    
    for (let i = 0; i < antiDemoteGroups.length; i++) {
      const group = antiDemoteGroups[i];
      const groupNameDisplay = group.groupName || 'Unknown Group';
      
      listMessage += `*${i + 1}.* ${groupNameDisplay}\n`;
      listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
      listMessage += `   └ ⚙️ Action: *${group.antiDemoteAction?.toUpperCase() || 'PROMOTE'}*\n`;
      listMessage += `   └ ⚠️ Warn Limit: *${group.warn_limit || 3}*\n\n`;
    }
    
    return reply(listMessage);
  }

  // Check permissions for other commands
  if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

  if (!subcommand) {
    const statusText = settings?.antiDemote === 'on' ? '✅ ENABLED' : '❌ DISABLED';
    const actionMap = {
      'promote': '⬆️ Re-promote + Demote demoter',
      'remove': '🚫 Remove Both',
      'warn': '⚠️ Warn + Re-promote'
    };

    return reply(
      `*🔄 Anti-Demote Settings for this Group*\n\n` +
      `📌 *Group:* ${groupName || 'Unknown'}\n` +
      `📍 *JID:* \`${from}\`\n\n` +
      `🔹 *Status:* ${statusText}\n` +
      `🔹 *Action:* ${actionMap[settings?.antiDemoteAction || 'promote']}\n` +
      `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
      `*What it does:*\n` +
      `Prevents unauthorized demotions by taking action against the demoter and protecting the victim.\n\n` +
      `*Actions:*\n` +
      `▸ *promote* - Re-promote victim + demote demoter\n` +
      `▸ *remove* - Remove both users from group\n` +
      `▸ *warn* - Warn first, then remove after limit\n\n` +
      `*Commands:*\n` +
      `▸ *${conText.prefix}antidemote on* - Enable\n` +
      `▸ *${conText.prefix}antidemote off* - Disable\n` +
      `▸ *${conText.prefix}antidemote action promote/remove/warn* - Set action\n` +
      `▸ *${conText.prefix}antidemote limit <1-10>* - Set warn limit\n` +
      `▸ *${conText.prefix}antidemote reset* - Reset warnings\n` +
      `▸ *${conText.prefix}antidemote list* - List active groups`
    );
  }

  switch (subcommand) {
    case 'on':
    case 'enable':
      await updateGroupEventsSettings(from, { 
        antiDemote: 'on', 
        groupName: groupName 
      });
      return reply(`✅ Anti-Demote has been *ENABLED* for this group!\nAction: *${(settings?.antiDemoteAction || 'promote').toUpperCase()}*`);

    case 'off':
    case 'disable':
      await updateGroupEventsSettings(from, { antiDemote: 'off' });
      return reply(`❌ Anti-Demote has been *DISABLED* for this group!`);

    case 'action':
      if (!value || !['promote', 'remove', 'warn'].includes(value)) {
        return reply("❌ Use: `antidemote action promote/remove/warn`");
      }
      await updateGroupEventsSettings(from, { 
        antiDemoteAction: value,
        antiDemote: settings?.antiDemote || 'on' // Auto-enable if setting action
      });
      const actionMessages = {
        'promote': '⬆️ Victim re-promoted, demoter demoted',
        'remove': '🚫 Both users will be removed',
        'warn': '⚠️ Users will be warned, then removed after limit'
      };
      return reply(`✅ Anti-Demote action set to: *${value.toUpperCase()}*\n${actionMessages[value]}`);

    case 'limit':
      const limit = parseInt(value);
      if (isNaN(limit) || limit < 1 || limit > 10) {
        return reply("❌ Limit must be between 1 and 10");
      }
      await updateGroupEventsSettings(from, { warn_limit: limit });
      return reply(`✅ Anti-Demote warn limit set to: *${limit}*`);

    case 'reset':
    case 'resetwarns':
      clearAllWarns(from);
      return reply(`✅ All anti-demote warning counts reset for this group!`);

    default:
      return reply(
        "❌ Invalid command!\n\n" +
        `▸ *${conText.prefix}antidemote on* - Enable\n` +
        `▸ *${conText.prefix}antidemote off* - Disable\n` +
        `▸ *${conText.prefix}antidemote action promote/remove/warn* - Set action\n` +
        `▸ *${conText.prefix}antidemote limit <1-10>* - Set warn limit\n` +
        `▸ *${conText.prefix}antidemote reset* - Reset warnings\n` +
        `▸ *${conText.prefix}antidemote list* - List active groups`
      );
  }
});



keith({
  pattern: "antipromote",
  aliases: ["antiprom", "nopromote"],
  category: "Settings",
  description: "Prevent unauthorized promotions in group"
  
},
async (from, client, conText) => {
  const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

  if (!isGroup) return reply("❌ This command can only be used in groups!");
if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");

    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-promote!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const value = args[1];

  // Get settings for this specific group
  const settings = await getGroupEventsSettings(from);

  // Handle list command - shows all groups with anti-promote enabled
  if (subcommand === 'list') {
    const allGroups = await require('../database/groupevents').getAllGroupEventsGroups();
    const antiPromoteGroups = allGroups.filter(g => g.antiPromote === 'on');
    
    if (antiPromoteGroups.length === 0) {
      return reply("📋 No groups have anti-promote enabled.");
    }

    let listMessage = "*🚫 Anti-Promote Active Groups*\n\n";
    
    for (let i = 0; i < antiPromoteGroups.length; i++) {
      const group = antiPromoteGroups[i];
      const groupNameDisplay = group.groupName || 'Unknown Group';
      
      listMessage += `*${i + 1}.* ${groupNameDisplay}\n`;
      listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
      listMessage += `   └ ⚙️ Action: *${group.antiPromoteAction?.toUpperCase() || 'DEMOTE'}*\n`;
      listMessage += `   └ ⚠️ Warn Limit: *${group.warn_limit || 3}*\n\n`;
    }
    
    return reply(listMessage);
  }

  // Check permissions for other commands
  if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

  if (!subcommand) {
    const statusText = settings?.antiPromote === 'on' ? '✅ ENABLED' : '❌ DISABLED';
    const actionMap = {
      'demote': '⬇️ Demote Both',
      'remove': '🚫 Remove Both',
      'warn': '⚠️ Warn + Demote'
    };

    return reply(
      `*🚫 Anti-Promote Settings for this Group*\n\n` +
      `📌 *Group:* ${groupName || 'Unknown'}\n` +
      `📍 *JID:* \`${from}\`\n\n` +
      `🔹 *Status:* ${statusText}\n` +
      `🔹 *Action:* ${actionMap[settings?.antiPromoteAction || 'demote']}\n` +
      `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
      `*What it does:*\n` +
      `Prevents unauthorized promotions by taking action against both the promoter and promoted person.\n\n` +
      `*Actions:*\n` +
      `▸ *demote* - Demote both users\n` +
      `▸ *remove* - Remove both users from group\n` +
      `▸ *warn* - Warn first, then remove after limit\n\n` +
      `*Commands:*\n` +
      `▸ *${conText.prefix}antipromote on* - Enable\n` +
      `▸ *${conText.prefix}antipromote off* - Disable\n` +
      `▸ *${conText.prefix}antipromote action demote/remove/warn* - Set action\n` +
      `▸ *${conText.prefix}antipromote limit <1-10>* - Set warn limit\n` +
      `▸ *${conText.prefix}antipromote reset* - Reset warnings\n` +
      `▸ *${conText.prefix}antipromote list* - List active groups`
    );
  }

  switch (subcommand) {
    case 'on':
    case 'enable':
      await updateGroupEventsSettings(from, { 
        antiPromote: 'on', 
        groupName: groupName 
      });
      return reply(`✅ Anti-Promote has been *ENABLED* for this group!\nAction: *${(settings?.antiPromoteAction || 'demote').toUpperCase()}*`);

    case 'off':
    case 'disable':
      await updateGroupEventsSettings(from, { antiPromote: 'off' });
      return reply(`❌ Anti-Promote has been *DISABLED* for this group!`);

    case 'action':
      if (!value || !['demote', 'remove', 'warn'].includes(value)) {
        return reply("❌ Use: `antipromote action demote/remove/warn`");
      }
      await updateGroupEventsSettings(from, { 
        antiPromoteAction: value,
        antiPromote: settings?.antiPromote || 'on' // Auto-enable if setting action
      });
      const actionMessages = {
        'demote': '⬇️ Both users will be demoted',
        'remove': '🚫 Both users will be removed',
        'warn': '⚠️ Users will be warned, then removed after limit'
      };
      return reply(`✅ Anti-Promote action set to: *${value.toUpperCase()}*\n${actionMessages[value]}`);

    case 'limit':
      const limit = parseInt(value);
      if (isNaN(limit) || limit < 1 || limit > 10) {
        return reply("❌ Limit must be between 1 and 10");
      }
      await updateGroupEventsSettings(from, { warn_limit: limit });
      return reply(`✅ Anti-Promote warn limit set to: *${limit}*`);

    case 'reset':
    case 'resetwarns':
      clearAllWarns(from);
      return reply(`✅ All anti-promote warning counts reset for this group!`);

    default:
      return reply(
        "❌ Invalid command!\n\n" +
        `▸ *${conText.prefix}antipromote on* - Enable\n` +
        `▸ *${conText.prefix}antipromote off* - Disable\n` +
        `▸ *${conText.prefix}antipromote action demote/remove/warn* - Set action\n` +
        `▸ *${conText.prefix}antipromote limit <1-10>* - Set warn limit\n` +
        `▸ *${conText.prefix}antipromote reset* - Reset warnings\n` +
        `▸ *${conText.prefix}antipromote list* - List active groups`
      );
  }
});

keith({
  pattern: "gtcdd",
  aliases: ["get", "plugin"],
  description: "Fetch a command snippet from the remote repository",
  category: "owner",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("❌ You are not authorized to use this command.");
  }

  if (!q) {
    return reply("⚠️ Provide the name of the command.\n\nExample: getcmd block");
  }

  try {
    const apiUrl = 'https://api.github.com/repos/barazaghost/REMOTE/contents/Cmds';
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const files = response.data.filter(item =>
      item.type === 'file' && item.name.endsWith('.js')
    );

    for (const file of files) {
      const fileResponse = await axios.get(file.download_url);
      const content = fileResponse.data;

      const regex = new RegExp(`keith\\s*\\(\\s*{[^}]*pattern\\s*:\\s*["'\`]${q}["'\`]`, 'i');
      if (regex.test(content)) {
        const startIndex = content.search(regex);
        const snippet = content.slice(startIndex);
        const nextBlock = snippet.indexOf('keith(', 1);
        const endIndex = nextBlock !== -1 ? startIndex + nextBlock : content.length;
        const commandCode = content.slice(startIndex, endIndex).trim();

        return reply(`// From ${file.name}\n\n${commandCode}`);
      }
    }

    reply(`❌ Command *${q}* not found in the repository.`);
  } catch (err) {
    console.error("getcmd error:", err);
    reply("❌ Failed to fetch commands from the repository.");
  }
});
