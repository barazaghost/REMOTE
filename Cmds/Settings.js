//========================================================================================================================
//========================================================================================================================

//
const { keith } = require('../commandHandler');
const { getAntiDeleteSettings, updateAntiDeleteSettings } = require('../database/antidelete');
const { getAutoBioSettings, updateAutoBioSettings } = require('../database/autobio');
//const { getAutoStatusSettings, updateAutoStatusSettings } = require('../database/autostatus');
const { getAutoReadSettings, updateAutoReadSettings } = require('../database/autoread');
const { getAutoStatusSettings, updateAutoStatusSettings } = require('../database/autostatus');
//const { getAutoStatusSettings, updateAutoStatusSettings } = require('../database/autostatus');
const axios = require('axios');
const { getGreetSettings, updateGreetSettings, clearRepliedContacts } = require('../database/greet');
const { getPresenceSettings, updatePresenceSettings } = require('../database/presence');
const { updateSettings, getSettings } = require('../database/settings');

//========================================================================================================================


// ==================== DATABASE IMPORTS ====================
const { 
    getAntiSpamSettings, 
    updateAntiSpamSettings, 
    getAllAntiSpamGroups,
    clearAllGroupMessages,
    clearAllSpamWarns
} = require('../database/antispam');

const { 
    getAntiCallSettings, 
    updateAntiCallSettings,
    clearAllCallWarns
} = require('../database/anticall');

const { 
    getAutoBlockSettings, 
    updateAutoBlockSettings, 
    addTriggerWord,
    removeTriggerWord,
    getTriggerWords,
    clearAllTriggerWords,
    clearAllBlockWarns
} = require('../database/autoblock');

const { 
    getAntiBadSettings, 
    updateAntiBadSettings, 
    getAllAntiBadGroups,
    addBadWord,
    removeBadWord,
    getBadWords,
    clearAllBadWords,
    clearAllBadWarns
} = require('../database/antibad');

const { 
    getAntiTagSettings, 
    updateAntiTagSettings, 
    getAllAntiTagGroups,
    clearAllTagWarns,
    toggleAntiTag 
} = require('../database/antitag');

const { 
    getAntiStickerSettings, 
    updateAntiStickerSettings, 
    getAllAntiStickerGroups,
    clearAllStickerWarns,
    toggleAntiSticker 
} = require('../database/antisticker');

const { 
    getChatbotSettings, 
    updateChatbotSettings, 
    clearConversationHistory, 
    getConversationHistory, 
    getAllActiveChatbots,
    availableVoices 
} = require('../database/chatbot');

const { 
    getGroupEventsSettings, 
    updateGroupEventsSettings,
    getAllGroupEventsGroups
} = require('../database/groupevents');

const { 
    getAntiStatusMentionSettings, 
    updateAntiStatusMentionSettings, 
    getAllAntiStatusMentionGroups,
    clearAllStatusWarns,
    toggleAntiStatusMention 
} = require('../database/antistatusmention');

const { 
    getAntiLinkSettings, 
    updateAntiLinkSettings, 
    getAllAntiLinkGroups,
    clearAllWarns,
    toggleAntiLink 
} = require('../database/antilink');


    
    



// ==================== HELPER FUNCTIONS ====================
async function downloadMedia(mediaUrl) {
    try {
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error downloading media:', error);
        return null;
    }
}

function getTypeIcon(type) {
    const icons = {
        'text': '📝',
        'audio': '🎵',
        'video': '🎥',
        'image': '🖼️',
        'vision': '🔍'
    };
    return icons[type] || '📝';
}

// ==================== BOT SETTINGS COMMAND ====================
keith({
    pattern: "botsettings",
    aliases: ["allsettings", "configlist", "settingslist", "settings", "setting"],
    category: "Settings",
    description: "List all bot configuration settings",
    filename: __filename
}, async (from, client, conText) => {
    const { reply, isSuperUser, prefix } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");

    try {
        // Fetch all settings in parallel
        const [
            botSettings,
            antiDelete,
            antiSpam,
            antiCall,
            autoBlock,
            antiBad,
            antiTag,
            antiSticker,
            chatbot,
            groupEvents,
            antiStatusMention,
            antiLink,
            autoBio,
            autoRead,
            autoStatus,
            greet,
            presence
        ] = await Promise.all([
            // Basic settings
            getSettings(),
            // Anti features
            getAntiDeleteSettings(),
            getAntiSpamSettings(from), // Global spam settings
            getAntiCallSettings(),
            getAutoBlockSettings(),
            getAntiBadSettings(from),
            getAntiTagSettings(from),
            getAntiStickerSettings(from),
            // Chat and events
            getChatbotSettings(from),
            getGroupEventsSettings(from),
            getAntiStatusMentionSettings(from),
            getAntiLinkSettings(from),
            // Auto features
            getAutoBioSettings(),
            getAutoReadSettings(),
            getAutoStatusSettings(),
            getGreetSettings(),
            getPresenceSettings()
        ]);

        // Get counts for dynamic data
        const triggerWords = await getTriggerWords();
        const badWords = await getBadWords(from);
        
        // Format all settings
        let settingsList = `*🤖 BOT SETTINGS DASHBOARD*\n`;
        settingsList += `📊 *Complete Configuration Overview*\n\n`;

        // 1. BOT BASIC SETTINGS
        settingsList += `*📌 BASIC SETTINGS*\n`;
        settingsList += `├─ Bot Name: ${botSettings.botname}\n`;
        settingsList += `├─ Author: ${botSettings.author}\n`;
        settingsList += `├─ Prefix: ${botSettings.prefix}\n`;
        settingsList += `├─ Mode: ${botSettings.mode.toUpperCase()}\n`;
        settingsList += `├─ Packname: ${botSettings.packname}\n`;
        settingsList += `├─ Timezone: ${botSettings.timezone}\n`;
        settingsList += `├─ Profile URL: ${botSettings.url ? '✅ Set' : '❌ Not Set'}\n`;
        settingsList += `└─ GitHub URL: ${botSettings.gurl ? '✅ Set' : '❌ Not Set'}\n\n`;

        // 2. PROTECTION SETTINGS
        settingsList += `*🛡️ PROTECTION SETTINGS*\n`;
        
        // Anti-Delete
        settingsList += `├─ Anti-Delete: ${antiDelete.status ? '✅ ON' : '❌ OFF'}\n`;
        
        // Anti-Spam
        const spamStatus = antiSpam?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Spam: ${spamStatus} (${antiSpam?.action || 'warn'}, ${antiSpam?.message_limit || 5}msgs/${antiSpam?.time_window || 5}s)\n`;
        
        // Anti-Call
        const callStatus = antiCall?.status ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Call: ${callStatus} (${antiCall?.action || 'reject'}, limit:${antiCall?.warn_limit || 3})\n`;
        
        // Auto-Block
        const blockStatus = autoBlock?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Auto-Block: ${blockStatus} (${autoBlock?.action || 'block'}, words:${triggerWords.length})\n`;
        
        // Anti-Bad
        const badStatus = antiBad?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Bad Words: ${badStatus} (${antiBad?.action || 'delete'}, filter:${antiBad?.filter_type || 'normal'}, words:${badWords.length})\n`;
        
        // Anti-Tag
        const tagStatus = antiTag?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Tag: ${tagStatus} (${antiTag?.action || 'delete'}, allowed:${antiTag?.allowed_mentions || 0})\n`;
        
        // Anti-Sticker
        const stickerStatus = antiSticker?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Sticker: ${stickerStatus} (${antiSticker?.action || 'delete'})\n`;
        
        // Anti-Status-Mention
        const statusMentionStatus = antiStatusMention?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `├─ Anti-Status-Mention: ${statusMentionStatus} (${antiStatusMention?.action || 'warn'})\n`;
        
        // Anti-Link
        const linkStatus = antiLink?.status === 'on' ? '✅ ON' : '❌ OFF';
        settingsList += `└─ Anti-Link: ${linkStatus} (${antiLink?.action || 'warn'})\n\n`;

        // 3. AUTO FEATURES
        settingsList += `*⚡ AUTO FEATURES*\n`;
        settingsList += `├─ Auto-Read: ${autoRead.status ? '✅ ON' : '❌ OFF'} (${autoRead.chatTypes.join(', ') || 'none'})\n`;
        settingsList += `├─ Auto-Bio: ${autoBio.status === 'on' ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `├─ Auto-Reply Greet: ${greet.enabled ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `├─ Auto-View Status: ${autoStatus.autoviewStatus === 'true' ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `├─ Auto-Reply Status: ${autoStatus.autoReplyStatus === 'true' ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `└─ Auto-Like Status: ${autoStatus.autoLikeStatus === 'true' ? '✅ ON' : '❌ OFF'}\n\n`;

        // 4. CHATBOT SETTINGS
        const chatbotStatusMap = { 'on': '✅ ON', 'off': '❌ OFF' };
        const chatbotModeMap = { 'private': '🔒 Private', 'group': '👥 Group', 'both': '🌐 Both' };
        settingsList += `*🤖 CHATBOT*\n`;
        settingsList += `├─ Status: ${chatbotStatusMap[chatbot?.status] || '❌ OFF'}\n`;
        settingsList += `├─ Mode: ${chatbotModeMap[chatbot?.mode] || 'N/A'}\n`;
        settingsList += `├─ Trigger: ${chatbot?.trigger === 'dm' ? '📨 DM' : chatbot?.trigger === 'mention' ? '🔔 Mention' : '📢 All'}\n`;
        settingsList += `├─ Response: ${chatbot?.default_response === 'audio' ? '🎵 Audio' : '📝 Text'}\n`;
        settingsList += `└─ Voice: ${chatbot?.voice || 'Kimberly'}\n\n`;

        // 5. GROUP EVENTS
        settingsList += `*🎉 GROUP EVENTS*\n`;
        settingsList += `├─ Welcome/Goodbye: ${groupEvents?.enabled ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `├─ Show Promotions: ${groupEvents?.showPromotions ? '✅ ON' : '❌ OFF'}\n`;
        settingsList += `├─ Anti-Demote: ${groupEvents?.antiDemote === 'on' ? '✅ ON' : '❌ OFF'} (${groupEvents?.antiDemoteAction || 'promote'})\n`;
        settingsList += `└─ Anti-Promote: ${groupEvents?.antiPromote === 'on' ? '✅ ON' : '❌ OFF'} (${groupEvents?.antiPromoteAction || 'demote'})\n\n`;

        // 6. PRESENCE SETTINGS
        const presenceMap = {
            'off': '❌ OFF',
            'online': '🟢 ONLINE',
            'typing': '✍️ TYPING',
            'recording': '🎙️ RECORDING'
        };
        settingsList += `*🔄 PRESENCE*\n`;
        settingsList += `├─ Private: ${presenceMap[presence.privateChat] || '❌ OFF'}\n`;
        settingsList += `└─ Group: ${presenceMap[presence.groupChat] || '❌ OFF'}\n\n`;

        // 7. QUICK STATS
        settingsList += `*📊 QUICK STATS*\n`;
        settingsList += `├─ Warn Limits: Spam(${antiSpam?.warn_limit || 3}), Call(${antiCall?.warn_limit || 3}), Block(${autoBlock?.warn_limit || 3})\n`;
        settingsList += `├─ Bad Words(${antiBad?.filter_type || 'normal'}): ${badWords.length} words\n`;
        settingsList += `├─ Trigger Words: ${triggerWords.length} words\n`;
        settingsList += `├─ Status Like Emojis: ${autoStatus.statusLikeEmojis || 'Default'}\n`;
        settingsList += `└─ Status Reply: ${autoStatus.statusReplyText || 'Default'}\n\n`;

        // 8. COMMANDS SECTION
        settingsList += `*🔧 AVAILABLE COMMANDS*\n`;
        settingsList += `▸ ${prefix}settings - Basic bot settings\n`;
        settingsList += `▸ ${prefix}antispam - Anti-spam settings\n`;
        settingsList += `▸ ${prefix}anticall - Anti-call settings\n`;
        settingsList += `▸ ${prefix}autoblock - Auto-block words\n`;
        settingsList += `▸ ${prefix}antibad - Bad words filter\n`;
        settingsList += `▸ ${prefix}antitag - Anti-tag settings\n`;
        settingsList += `▸ ${prefix}antisticker - Anti-sticker settings\n`;
        settingsList += `▸ ${prefix}chatbot - Chatbot settings\n`;
        settingsList += `▸ ${prefix}events - Group events\n`;
        settingsList += `▸ ${prefix}antistatusmention - Anti-status-mention\n`;
        settingsList += `▸ ${prefix}antilink - Anti-link settings\n`;
        settingsList += `▸ ${prefix}autoread - Auto-read settings\n`;
        settingsList += `▸ ${prefix}autobio - Auto-bio settings\n`;
        settingsList += `▸ ${prefix}presence - Presence settings\n`;
        settingsList += `▸ ${prefix}greet - Greeting settings\n`;
        settingsList += `▸ ${prefix}antidelete - Anti-delete settings\n`;

        // Send the settings list
        await reply(settingsList);

    } catch (error) {
        console.error('Error fetching settings:', error);
        return reply("❌ Error fetching settings. Please check console for details.");
    }
});
// ==================== ANTI-SPAM COMMAND ====================

keith({
    pattern: "antispam",
    aliases: ["spamguard", "nospam"],
    category: "Settings",
    description: "Prevent message spamming in group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-spam!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];
    const secondValue = args[2];

    const settings = await getAntiSpamSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllAntiSpamGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-spam enabled.");
        
        let listMessage = "*🛡️ Anti-Spam Active Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            const groupNameDisplay = group.groupName || 'Unknown Group';
            listMessage += `*${i + 1}.* ${groupNameDisplay}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
            listMessage += `   └ ⚙️ Action: *${group.action?.toUpperCase() || 'WARN'}*\n`;
            listMessage += `   └ 📊 Limit: *${group.message_limit}* msgs / *${group.time_window}* sec\n`;
            listMessage += `   └ ⚠️ Warn Limit: *${group.warn_limit}*\n\n`;
        }
        return reply(listMessage);
    }

    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'delete': '🗑️ Delete Spam', 'remove': '🚫 Remove User', 'warn': '⚠️ Warn + Remove' };
        const adminExempt = settings?.exempt_admins ? '✅ Yes' : '❌ No';

        return reply(
            `*🛡️ Anti-Spam Settings for this Group*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'warn']}\n` +
            `🔹 *Message Limit:* ${settings?.message_limit || 5} messages\n` +
            `🔹 *Time Window:* ${settings?.time_window || 5} seconds\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n` +
            `🔹 *Exempt Admins:* ${adminExempt}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antispam on/off*\n` +
            `▸ *${conText.prefix}antispam delete/remove/warn*\n` +
            `▸ *${conText.prefix}antispam set <msgs> <seconds>*\n` +
            `▸ *${conText.prefix}antispam limit <1-10>*\n` +
            `▸ *${conText.prefix}antispam adminexempt on/off*\n` +
            `▸ *${conText.prefix}antispam reset*\n` +
            `▸ *${conText.prefix}antispam list*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await updateAntiSpamSettings(from, { status: 'on', groupName: groupName });
            return reply(`✅ Anti-Spam has been *ENABLED* for this group!`);

        case 'off':
        case 'disable':
            await updateAntiSpamSettings(from, { status: 'off' });
            clearAllGroupMessages(from);
            return reply(`❌ Anti-Spam has been *DISABLED* for this group!`);

        case 'delete':
        case 'remove':
        case 'warn':
            await updateAntiSpamSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Anti-Spam action set to: *${subcommand.toUpperCase()}*`);

        case 'set':
            const msgLimit = parseInt(value);
            const timeWin = parseInt(secondValue);
            if (isNaN(msgLimit) || msgLimit < 2 || msgLimit > 50) return reply("❌ Message limit must be between 2 and 50");
            if (isNaN(timeWin) || timeWin < 2 || timeWin > 60) return reply("❌ Time window must be between 2 and 60 seconds");
            await updateAntiSpamSettings(from, { message_limit: msgLimit, time_window: timeWin });
            return reply(`✅ Anti-Spam limit set to: *${msgLimit} messages* in *${timeWin} seconds*`);

        case 'warnlimit':
            const warnLimit = parseInt(value);
            if (isNaN(warnLimit) || warnLimit < 1 || warnLimit > 10) return reply("❌ Warn limit must be between 1 and 10");
            await updateAntiSpamSettings(from, { warn_limit: warnLimit });
            return reply(`✅ Anti-Spam warn limit set to: *${warnLimit}*`);

        case 'adminexempt':
            if (!value || !['on', 'off'].includes(value)) return reply("❌ Use: `antispam adminexempt on/off`");
            await updateAntiSpamSettings(from, { exempt_admins: value === 'on' });
            return reply(`✅ Admin exemption ${value === 'on' ? 'enabled' : 'disabled'}.`);

        case 'reset':
        case 'resetall':
            clearAllGroupMessages(from);
            clearAllSpamWarns(from);
            return reply(`✅ All spam counters and warnings reset for this group!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antispam on/off*\n` +
                `▸ *${conText.prefix}antispam delete/remove/warn*\n` +
                `▸ *${conText.prefix}antispam set <msgs> <seconds>*\n` +
                `▸ *${conText.prefix}antispam warnlimit <1-10>*\n` +
                `▸ *${conText.prefix}antispam adminexempt on/off*\n` +
                `▸ *${conText.prefix}antispam reset*\n` +
                `▸ *${conText.prefix}antispam list*`
            );
    }
});

// ==================== ANTI-CALL COMMAND ====================
keith({
    pattern: "anticall",
    aliases: ["callblock", "blockcalls"],
    category: "Settings",
    description: "Manage anti-call settings"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");
    const firstValue = args[1];

    const settings = await getAntiCallSettings();

    if (!subcommand) {
        const statusText = settings?.status ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'reject': '📵 Reject Call', 'block': '🔨 Block Caller', 'warn': '⚠️ Warn + Block' };

        return reply(
            `*📵 Anti-Call Settings*\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'reject']}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n` +
            `🔹 *Message:* ${settings?.message || 'Not set'}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}anticall on/off*\n` +
            `▸ *${conText.prefix}anticall reject*\n` +
            `▸ *${conText.prefix}anticall block*\n` +
            `▸ *${conText.prefix}anticall warn*\n` +
            `▸ *${conText.prefix}anticall message <text>*\n` +
            `▸ *${conText.prefix}anticall limit <1-10>*\n` +
            `▸ *${conText.prefix}anticall reset*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await updateAntiCallSettings({ status: true });
            return reply(`✅ Anti-Call has been *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiCallSettings({ status: false });
            return reply(`❌ Anti-Call has been *DISABLED*!`);

        case 'reject':
            await updateAntiCallSettings({ action: 'reject' });
            return reply(`✅ Anti-Call action set to: *REJECT*`);

        case 'block':
            await updateAntiCallSettings({ action: 'block' });
            return reply(`✅ Anti-Call action set to: *BLOCK*`);

        case 'warn':
            await updateAntiCallSettings({ action: 'warn' });
            return reply(`✅ Anti-Call action set to: *WARN*`);

        case 'message':
        case 'msg':
            if (!value) return reply("❌ Please provide a message.");
            await updateAntiCallSettings({ message: value });
            return reply(`✅ Anti-Call message set.`);

        case 'limit':
            const limit = parseInt(firstValue);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiCallSettings({ warn_limit: limit });
            return reply(`✅ Anti-Call warn limit set to: *${limit}*`);

        case 'reset':
        case 'resetwarns':
            clearAllCallWarns();
            return reply(`✅ All call warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}anticall on/off*\n` +
                `▸ *${conText.prefix}anticall reject*\n` +
                `▸ *${conText.prefix}anticall block*\n` +
                `▸ *${conText.prefix}anticall warn*\n` +
                `▸ *${conText.prefix}anticall message <text>*\n` +
                `▸ *${conText.prefix}anticall limit <1-10>*\n` +
                `▸ *${conText.prefix}anticall reset*`
            );
    }
});

// ==================== AUTO-BLOCK COMMAND ====================
keith({
    pattern: "autoblock",
    aliases: ["blockwords", "autoban"],
    category: "Settings",
    description: "Manage auto-block trigger words for DMs"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, sender } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");
    const firstValue = args[1];

    const settings = await getAutoBlockSettings();
    const triggerWords = await getTriggerWords();

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'block': '🔨 Block User', 'delete': '🗑️ Delete Only', 'warn': '⚠️ Warn + Block' };

        return reply(
            `*🔨 Auto-Block Settings (DM Only)*\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'block']}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n` +
            `🔹 *Trigger Words:* ${triggerWords.length} words\n` +
            `🔹 *Block Message:* ${settings?.block_message || 'Not set'}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}autoblock on/off*\n` +
            `▸ *${conText.prefix}autoblock add <word>*\n` +
            `▸ *${conText.prefix}autoblock remove <word>*\n` +
            `▸ *${conText.prefix}autoblock list*\n` +
            `▸ *${conText.prefix}autoblock clear*\n` +
            `▸ *${conText.prefix}autoblock block/delete/warn*\n` +
            `▸ *${conText.prefix}autoblock message <text>*\n` +
            `▸ *${conText.prefix}autoblock limit <1-10>*\n` +
            `▸ *${conText.prefix}autoblock reset*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await updateAutoBlockSettings({ status: 'on' });
            return reply(`✅ Auto-Block has been *ENABLED* for DMs!`);

        case 'off':
        case 'disable':
            await updateAutoBlockSettings({ status: 'off' });
            return reply(`❌ Auto-Block has been *DISABLED* for DMs!`);

        case 'add':
            if (!value) return reply("❌ Please provide a word to add.");
            const result = await addTriggerWord(value, sender);
            return reply(result.success ? `✅ Added "*${value}*" to trigger words.` : `❌ ${result.message}`);

        case 'remove':
        case 'rm':
            if (!value) return reply("❌ Please provide a word to remove.");
            const removed = await removeTriggerWord(value);
            return removed ? reply(`✅ Removed "*${value}*" from trigger words.`) : reply(`❌ Word not found.`);

        case 'list':
        case 'words':
            if (triggerWords.length === 0) return reply("📋 No trigger words added yet.");
            let wordList = `*📋 Trigger Words (${triggerWords.length})*\n\n`;
            triggerWords.forEach((item, index) => {
                const addedBy = item.addedBy.split('@')[0];
                wordList += `*${index + 1}.* "${item.word}" (added by @${addedBy})\n`;
            });
            return reply(wordList);

        case 'clear':
        case 'clearall':
            const confirm = firstValue === 'confirm' || firstValue === '--yes';
            if (!confirm) return reply(`⚠️ This will delete ALL ${triggerWords.length} trigger words.\nType: *${conText.prefix}autoblock clear confirm* to proceed.`);
            await clearAllTriggerWords();
            return reply(`✅ Cleared all trigger words.`);

        case 'block':
        case 'delete':
        case 'warn':
            await updateAutoBlockSettings({ action: subcommand });
            return reply(`✅ Auto-Block action set to: *${subcommand.toUpperCase()}*`);

        case 'message':
        case 'msg':
            if (!value) return reply("❌ Please provide a block message.");
            await updateAutoBlockSettings({ block_message: value });
            return reply(`✅ Block message set.`);

        case 'limit':
            const limit = parseInt(firstValue);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAutoBlockSettings({ warn_limit: limit });
            return reply(`✅ Auto-Block warn limit set to: *${limit}*`);

        case 'reset':
        case 'resetwarns':
            clearAllBlockWarns();
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}autoblock on/off*\n` +
                `▸ *${conText.prefix}autoblock add <word>*\n` +
                `▸ *${conText.prefix}autoblock remove <word>*\n` +
                `▸ *${conText.prefix}autoblock list*\n` +
                `▸ *${conText.prefix}autoblock clear*\n` +
                `▸ *${conText.prefix}autoblock block/delete/warn*\n` +
                `▸ *${conText.prefix}autoblock message <text>*\n` +
                `▸ *${conText.prefix}autoblock limit <1-10>*\n` +
                `▸ *${conText.prefix}autoblock reset*`
            );
    }
});

// ==================== ANTI-BAD COMMAND ====================
keith({
    pattern: "antibad",
    aliases: ["badword", "filter", "antiprofanity"],
    category: "Settings",
    description: "Manage bad words filter"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName, sender } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-bad!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");
    const firstValue = args[1];

    const settings = await getAntiBadSettings(from);
    const badWords = await getBadWords(from);

    if (subcommand === 'listgroups') {
        if (!isSuperUser) return reply("❌ Only owner can view all groups!");
        const allGroups = await getAllAntiBadGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-bad enabled.");
        
        let listMessage = "*🔞 Anti-Bad Active Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
            listMessage += `   └ ⚙️ Action: *${group.action?.toUpperCase() || 'DELETE'}*\n\n`;
        }
        return reply(listMessage);
    }

    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'delete': '🗑️ Delete Only', 'remove': '🚫 Remove User', 'warn': '⚠️ Warn + Delete' };
        const typeMap = { 'strict': '🔍 Strict', 'normal': '📝 Normal', 'loose': '🌊 Loose' };
        const adminExempt = settings?.exempt_admins ? '✅ Yes' : '❌ No';

        return reply(
            `*🔞 Anti-Bad Words Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'delete']}\n` +
            `🔹 *Filter Type:* ${typeMap[settings?.filter_type || 'normal']}\n` +
            `🔹 *Exempt Admins:* ${adminExempt}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n` +
            `🔹 *Bad Words:* ${badWords.length} words\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antibad on/off*\n` +
            `▸ *${conText.prefix}antibad add <word>*\n` +
            `▸ *${conText.prefix}antibad remove <word>*\n` +
            `▸ *${conText.prefix}antibad list*\n` +
            `▸ *${conText.prefix}antibad clear*\n` +
            `▸ *${conText.prefix}antibad delete/remove/warn*\n` +
            `▸ *${conText.prefix}antibad type strict/normal/loose*\n` +
            `▸ *${conText.prefix}antibad adminexempt on/off*\n` +
            `▸ *${conText.prefix}antibad limit <1-10>*\n` +
            `▸ *${conText.prefix}antibad reset*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await updateAntiBadSettings(from, { status: 'on', groupName: groupName });
            return reply(`✅ Anti-Bad has been *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiBadSettings(from, { status: 'off' });
            return reply(`❌ Anti-Bad has been *DISABLED*!`);

        case 'add':
            if (!value) return reply("❌ Please provide a word to add.");
            const result = await addBadWord(from, value, sender);
            return result.success ? reply(`✅ Added "*${value}*" to bad words.`) : reply(`❌ ${result.message}`);

        case 'remove':
        case 'rm':
            if (!value) return reply("❌ Please provide a word to remove.");
            const removed = await removeBadWord(from, value);
            return removed ? reply(`✅ Removed "*${value}*" from bad words.`) : reply(`❌ Word not found.`);

        case 'list':
        case 'words':
            if (badWords.length === 0) return reply("📋 No bad words added yet.");
            let wordList = `*📋 Bad Words List (${badWords.length})*\n\n`;
            badWords.forEach(word => wordList += `• ${word}\n`);
            return reply(wordList);

        case 'clear':
        case 'clearall':
            const confirm = firstValue === 'confirm' || firstValue === '--yes';
            if (!confirm) return reply(`⚠️ This will delete ALL ${badWords.length} bad words.\nType: *${conText.prefix}antibad clear confirm* to proceed.`);
            await clearAllBadWords(from);
            return reply(`✅ Cleared all bad words.`);

        case 'delete':
        case 'remove':
        case 'warn':
            await updateAntiBadSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Anti-Bad action set to: *${subcommand.toUpperCase()}*`);

        case 'type':
        case 'filter':
            if (!['strict', 'normal', 'loose'].includes(value)) return reply("❌ Filter type must be: strict, normal, or loose");
            await updateAntiBadSettings(from, { filter_type: value });
            return reply(`✅ Filter type set to: *${value.toUpperCase()}*`);

        case 'adminexempt':
            if (!value || !['on', 'off'].includes(value)) return reply("❌ Use: `antibad adminexempt on/off`");
            await updateAntiBadSettings(from, { exempt_admins: value === 'on' });
            return reply(`✅ Admin exemption ${value === 'on' ? 'enabled' : 'disabled'}.`);

        case 'limit':
            const limit = parseInt(firstValue);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiBadSettings(from, { warn_limit: limit });
            return reply(`✅ Warn limit set to: *${limit}*`);

        case 'reset':
        case 'resetwarns':
            clearAllBadWarns(from);
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antibad on/off*\n` +
                `▸ *${conText.prefix}antibad add <word>*\n` +
                `▸ *${conText.prefix}antibad remove <word>*\n` +
                `▸ *${conText.prefix}antibad list*\n` +
                `▸ *${conText.prefix}antibad clear*\n` +
                `▸ *${conText.prefix}antibad delete/remove/warn*\n` +
                `▸ *${conText.prefix}antibad type strict/normal/loose*\n` +
                `▸ *${conText.prefix}antibad adminexempt on/off*\n` +
                `▸ *${conText.prefix}antibad limit <1-10>*\n` +
                `▸ *${conText.prefix}antibad reset*`
            );
    }
});

// ==================== ANTI-TAG COMMAND ====================
keith({
    pattern: "antitag",
    aliases: ["antiment", "notag", "antimention"],
    category: "Settings",
    description: "Prevent mentioning/tagging in group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-tag!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];

    const settings = await getAntiTagSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllAntiTagGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-tag enabled.");
        
        let listMessage = "*🚫 Anti-Tag Active Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
            listMessage += `   └ ⚙️ Action: *${group.action?.toUpperCase() || 'DELETE'}*\n\n`;
        }
        return reply(listMessage);
    }

    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'delete': '🗑️ Delete Only', 'remove': '🚫 Remove User', 'warn': '⚠️ Warn + Delete' };
        const adminExempt = settings?.exempt_admins ? '✅ Yes' : '❌ No';

        return reply(
            `*🚫 Anti-Tag Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'delete']}\n` +
            `🔹 *Allowed Mentions:* ${settings?.allowed_mentions || 0}\n` +
            `🔹 *Exempt Admins:* ${adminExempt}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antitag on/off*\n` +
            `▸ *${conText.prefix}antitag delete/remove/warn*\n` +
            `▸ *${conText.prefix}antitag allowed <0-10>*\n` +
            `▸ *${conText.prefix}antitag adminexempt on/off*\n` +
            `▸ *${conText.prefix}antitag limit <1-10>*\n` +
            `▸ *${conText.prefix}antitag reset*\n` +
            `▸ *${conText.prefix}antitag list*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await toggleAntiTag(from, groupName, 'on', settings?.action || 'delete', settings?.warn_limit || 3, settings?.allowed_mentions || 0, settings?.exempt_admins !== false);
            return reply(`✅ Anti-Tag has been *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiTagSettings(from, { status: 'off' });
            return reply(`❌ Anti-Tag has been *DISABLED*!`);

        case 'delete':
        case 'remove':
        case 'warn':
            await updateAntiTagSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Anti-Tag action set to: *${subcommand.toUpperCase()}*`);

        case 'allowed':
            const allowed = parseInt(value);
            if (isNaN(allowed) || allowed < 0 || allowed > 10) return reply("❌ Allowed mentions must be between 0 and 10");
            await updateAntiTagSettings(from, { allowed_mentions: allowed });
            return reply(`✅ Allowed mentions set to: *${allowed}*`);

        case 'adminexempt':
            if (!value || !['on', 'off'].includes(value)) return reply("❌ Use: `antitag adminexempt on/off`");
            await updateAntiTagSettings(from, { exempt_admins: value === 'on' });
            return reply(`✅ Admin exemption ${value === 'on' ? 'enabled' : 'disabled'}.`);

        case 'limit':
            const limit = parseInt(value);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiTagSettings(from, { warn_limit: limit });
            return reply(`✅ Warn limit set to: *${limit}*`);

        case 'reset':
        case 'resetwarns':
            clearAllTagWarns(from);
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antitag on/off*\n` +
                `▸ *${conText.prefix}antitag delete/remove/warn*\n` +
                `▸ *${conText.prefix}antitag allowed <0-10>*\n` +
                `▸ *${conText.prefix}antitag adminexempt on/off*\n` +
                `▸ *${conText.prefix}antitag limit <1-10>*\n` +
                `▸ *${conText.prefix}antitag reset*\n` +
                `▸ *${conText.prefix}antitag list*`
            );
    }
});

// ==================== ANTI-STICKER COMMAND ====================
keith({
    pattern: "antisticker",
    aliases: ["antistick", "nosticker", "antis"],
    category: "Settings",
    description: "Prevent stickers in group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isBotAdmin) return reply("❌ I need to be an admin to manage anti-sticker!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];

    const settings = await getAntiStickerSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllAntiStickerGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-sticker enabled.");
        
        let listMessage = "*🚫 Anti-Sticker Active Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
            listMessage += `   └ ⚙️ Action: *${group.action?.toUpperCase() || 'DELETE'}*\n\n`;
        }
        return reply(listMessage);
    }

    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'delete': '🗑️ Delete Only', 'remove': '🚫 Remove User', 'warn': '⚠️ Warn + Delete' };

        return reply(
            `*🚫 Anti-Sticker Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'delete']}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antisticker on/off*\n` +
            `▸ *${conText.prefix}antisticker delete/remove/warn*\n` +
            `▸ *${conText.prefix}antisticker limit <1-10>*\n` +
            `▸ *${conText.prefix}antisticker reset*\n` +
            `▸ *${conText.prefix}antisticker list*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await toggleAntiSticker(from, groupName, 'on', settings?.action || 'delete', settings?.warn_limit || 3);
            return reply(`✅ Anti-Sticker has been *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiStickerSettings(from, { status: 'off' });
            return reply(`❌ Anti-Sticker has been *DISABLED*!`);

        case 'delete':
        case 'remove':
        case 'warn':
            await updateAntiStickerSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Anti-Sticker action set to: *${subcommand.toUpperCase()}*`);

        case 'limit':
            const limit = parseInt(value);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiStickerSettings(from, { warn_limit: limit });
            return reply(`✅ Warn limit set to: *${limit}*`);

        case 'reset':
        case 'resetwarns':
            clearAllStickerWarns(from);
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antisticker on/off*\n` +
                `▸ *${conText.prefix}antisticker delete/remove/warn*\n` +
                `▸ *${conText.prefix}antisticker limit <1-10>*\n` +
                `▸ *${conText.prefix}antisticker reset*\n` +
                `▸ *${conText.prefix}antisticker list*`
            );
    }
});

// ==================== CHATBOT COMMAND ====================
keith({
    pattern: "chatbot",
    aliases: ["chatai", "bot"],
    category: "Settings",
    description: "Manage chatbot per chat/group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isGroup, groupName, pushName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");

    const chatName = isGroup ? groupName : pushName || 'Private Chat';
    const chatType = isGroup ? 'group' : 'private';

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");

    const settings = await getChatbotSettings(from, chatName, chatType);

    if (subcommand === 'list') {
        const activeChats = await getAllActiveChatbots();
        if (activeChats.length === 0) return reply("📋 No active chatbots found.");
        
        let listMessage = "*🤖 Active Chatbots*\n\n";
        for (let i = 0; i < activeChats.length; i++) {
            const chat = activeChats[i];
            const typeIcon = chat.chat_type === 'group' ? '👥' : '👤';
            listMessage += `*${i + 1}.* ${typeIcon} ${chat.chat_name || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${chat.chat_jid}\`\n`;
        }
        return reply(listMessage);
    }

    if (subcommand === 'status' || !subcommand) {
        const statusIcon = settings?.status === 'on' ? '✅' : '❌';
        const triggerMap = { 'dm': '📨 DM Only', 'mention': '🔔 @mention', 'all': '📢 All Messages' };
        const responseMap = { 'text': '📝 Text', 'audio': '🎵 Audio' };

        return reply(
            `*🤖 Chatbot Settings*\n\n` +
            `📌 *Name:* ${chatName}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusIcon} ${settings?.status?.toUpperCase() || 'OFF'}\n` +
            `🔹 *Trigger:* ${triggerMap[settings?.trigger || (isGroup ? 'mention' : 'dm')]}\n` +
            `🔹 *Response:* ${responseMap[settings?.default_response || 'text']}\n` +
            `🔹 *Voice:* ${settings?.voice || 'Kimberly'}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}chatbot on/off*\n` +
            `▸ *${conText.prefix}chatbot trigger ${isGroup ? 'mention/all' : 'dm/all'}*\n` +
            `▸ *${conText.prefix}chatbot response text/audio*\n` +
            `▸ *${conText.prefix}chatbot voice <name>*\n` +
            `▸ *${conText.prefix}chatbot voices*\n` +
            `▸ *${conText.prefix}chatbot clear*\n` +
            `▸ *${conText.prefix}chatbot history*\n` +
            `▸ *${conText.prefix}chatbot status*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'off':
            await updateChatbotSettings(from, { status: subcommand, chat_name: chatName, chat_type: chatType });
            return reply(`✅ Chatbot *${subcommand.toUpperCase()}* for this ${chatType}!`);

        case 'trigger':
            const validTriggers = isGroup ? ['mention', 'all'] : ['dm', 'all'];
            if (!validTriggers.includes(value)) return reply(`❌ Invalid trigger! Use: ${validTriggers.join(' or ')}`);
            await updateChatbotSettings(from, { trigger: value });
            return reply(`✅ Trigger set to: *${value.toUpperCase()}*`);

        case 'response':
            if (!['text', 'audio'].includes(value)) return reply("❌ Invalid response! Use: text or audio");
            await updateChatbotSettings(from, { default_response: value });
            return reply(`✅ Default response: *${value.toUpperCase()}*`);

        case 'voice':
            if (!availableVoices.includes(value)) return reply(`❌ Invalid voice! Available: ${availableVoices.join(', ')}`);
            await updateChatbotSettings(from, { voice: value });
            return reply(`✅ Voice set to: *${value}*`);

        case 'voices':
            return reply(`*🎙️ Available Voices:*\n\n${availableVoices.join(', ')}`);

        case 'clear':
            const cleared = await clearConversationHistory(from);
            return reply(cleared ? "✅ Conversation history cleared!" : "❌ No history to clear!");

        case 'history':
            const history = await getConversationHistory(from, 10);
            if (history.length === 0) return reply("📝 No conversations yet.");
            let historyText = `*📚 Recent Conversations (${history.length})*\n\n`;
            history.forEach((conv, index) => {
                const typeIcon = getTypeIcon(conv.type);
                historyText += `*${index + 1}.* ${typeIcon}: ${conv.user.substring(0, 30)}...\n`;
            });
            return reply(historyText);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}chatbot on/off*\n` +
                `▸ *${conText.prefix}chatbot trigger ${isGroup ? 'mention/all' : 'dm/all'}*\n` +
                `▸ *${conText.prefix}chatbot response text/audio*\n` +
                `▸ *${conText.prefix}chatbot voice <name>*\n` +
                `▸ *${conText.prefix}chatbot voices*\n` +
                `▸ *${conText.prefix}chatbot clear*\n` +
                `▸ *${conText.prefix}chatbot history*\n` +
                `▸ *${conText.prefix}chatbot status*`
            );
    }
});

// ==================== EVENTS COMMAND ====================
keith({
    pattern: "events",
    aliases: ["gevents", "groupevents"],
    category: "Settings",
    description: "Manage group welcome/leave events"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");
  //  if (!isBotAdmin) return reply("❌ I need to be an admin to manage group events!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];

    const settings = await getGroupEventsSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllGroupEventsGroups();
        const activeGroups = allGroups.filter(g => g.enabled === true);
        if (activeGroups.length === 0) return reply("📋 No groups have events enabled.");
        
        let listMessage = "*🎉 Active Events Groups*\n\n";
        for (let i = 0; i < activeGroups.length; i++) {
            const group = activeGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
        }
        return reply(listMessage);
    }

    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.enabled ? '✅ ENABLED' : '❌ DISABLED';

        return reply(
            `*🎉 Welcome/Goodbye Events Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Show Promotions:* ${settings?.showPromotions ? '✅' : '❌'}\n\n` +
            `*💬 Welcome:* ${settings?.welcomeMessage || 'Not set'}\n` +
            `*👋 Goodbye:* ${settings?.goodbyeMessage || 'Not set'}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}events on/off*\n` +
            `▸ *${conText.prefix}events promote on/off*\n` +
            `▸ *${conText.prefix}events welcome <message>*\n` +
            `▸ *${conText.prefix}events goodbye <message>*\n` +
            `▸ *${conText.prefix}events list*`
        );
    }

    switch (subcommand) {
        case 'on':
            await updateGroupEventsSettings(from, { enabled: true, groupName: groupName });
            return reply(`✅ Events enabled!`);

        case 'off':
            await updateGroupEventsSettings(from, { enabled: false });
            return reply(`❌ Events disabled!`);

        case 'promote':
            if (!value || !['on', 'off'].includes(value)) return reply("❌ Use: `events promote on/off`");
            await updateGroupEventsSettings(from, { showPromotions: value === 'on' });
            return reply(`✅ Promotions ${value === 'on' ? 'enabled' : 'disabled'}.`);

        case 'welcome':
            if (!value) return reply("❌ Provide a welcome message.");
            await updateGroupEventsSettings(from, { welcomeMessage: q.substring('welcome'.length).trim() });
            return reply("✅ Welcome message updated.");

        case 'goodbye':
            if (!value) return reply("❌ Provide a goodbye message.");
            await updateGroupEventsSettings(from, { goodbyeMessage: q.substring('goodbye'.length).trim() });
            return reply("✅ Goodbye message updated.");

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}events on/off*\n` +
                `▸ *${conText.prefix}events promote on/off*\n` +
                `▸ *${conText.prefix}events welcome <message>*\n` +
                `▸ *${conText.prefix}events goodbye <message>*\n` +
                `▸ *${conText.prefix}events list*`
            );
    }
});

// ==================== ANTI-STATUS-MENTION COMMAND ====================
keith({
    pattern: "antistatusmention",
    aliases: ["antistatus", "statusguard"],
    category: "Settings",
    description: "Manage anti-status-mention settings per group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];

    const settings = await getAntiStatusMentionSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllAntiStatusMentionGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-status-mention enabled.");
        
        let listMessage = "*📋 Active Anti-Status-Mention Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
        }
        return reply(listMessage);
    }

    if (!isBotAdmin) return reply("❌ I need to be an admin!");
    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'warn': '⚠️ Warn', 'delete': '🗑️ Delete', 'remove': '🚫 Remove' };

        return reply(
            `*📢 Anti-Status-Mention Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'warn']}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antistatusmention on/off*\n` +
            `▸ *${conText.prefix}antistatusmention warn/delete/remove*\n` +
            `▸ *${conText.prefix}antistatusmention limit <1-10>*\n` +
            `▸ *${conText.prefix}antistatusmention resetwarns*\n` +
            `▸ *${conText.prefix}antistatusmention list*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await toggleAntiStatusMention(from, groupName, 'on', settings?.action || 'warn', settings?.warn_limit || 3);
            return reply(`✅ Anti-status-mention *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiStatusMentionSettings(from, { status: 'off' });
            return reply(`❌ Anti-status-mention *DISABLED*!`);

        case 'warn':
        case 'delete':
        case 'remove':
            await updateAntiStatusMentionSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Action set to: *${subcommand.toUpperCase()}*`);

        case 'limit':
            const limit = parseInt(value);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiStatusMentionSettings(from, { warn_limit: limit });
            return reply(`✅ Warn limit set to: *${limit}*`);

        case 'resetwarns':
        case 'reset':
            clearAllStatusWarns(from);
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antistatusmention on/off*\n` +
                `▸ *${conText.prefix}antistatusmention warn/delete/remove*\n` +
                `▸ *${conText.prefix}antistatusmention limit <1-10>*\n` +
                `▸ *${conText.prefix}antistatusmention resetwarns*\n` +
                `▸ *${conText.prefix}antistatusmention list*`
            );
    }
});

// ==================== ANTI-LINK COMMAND ====================
keith({
    pattern: "antilink",
    aliases: ["linkguard"],
    category: "Settings",
    description: "Manage anti-link settings per group"
},
async (from, client, conText) => {
    const { reply, q, isSuperUser, isBotAdmin, isGroup, groupName } = conText;

    if (!isSuperUser) return reply("❌ You need superuser privileges to use this command!");
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const args = q?.trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const value = args[1];

    const settings = await getAntiLinkSettings(from);

    if (subcommand === 'list') {
        const allGroups = await getAllAntiLinkGroups();
        if (allGroups.length === 0) return reply("📋 No groups have anti-link enabled.");
        
        let listMessage = "*📋 Active Anti-Link Groups*\n\n";
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            listMessage += `*${i + 1}.* ${group.groupName || 'Unknown'}\n`;
            listMessage += `   └ 📍 JID: \`${group.groupJid}\`\n`;
        }
        return reply(listMessage);
    }

    if (!isBotAdmin) return reply("❌ I need to be an admin!");
    if (!isSuperUser && !conText.isAdmin) return reply("❌ Only group admins can use this command!");

    if (!subcommand) {
        const statusText = settings?.status === 'on' ? '✅ ENABLED' : '❌ DISABLED';
        const actionMap = { 'warn': '⚠️ Warn', 'delete': '🗑️ Delete', 'remove': '🚫 Remove' };

        return reply(
            `*🔗 Anti-Link Settings*\n\n` +
            `📌 *Group:* ${groupName || 'Unknown'}\n` +
            `📍 *JID:* \`${from}\`\n\n` +
            `🔹 *Status:* ${statusText}\n` +
            `🔹 *Action:* ${actionMap[settings?.action || 'warn']}\n` +
            `🔹 *Warn Limit:* ${settings?.warn_limit || 3}\n\n` +
            `*Commands:*\n` +
            `▸ *${conText.prefix}antilink on/off*\n` +
            `▸ *${conText.prefix}antilink warn/delete/remove*\n` +
            `▸ *${conText.prefix}antilink limit <1-10>*\n` +
            `▸ *${conText.prefix}antilink resetwarns*\n` +
            `▸ *${conText.prefix}antilink list*`
        );
    }

    switch (subcommand) {
        case 'on':
        case 'enable':
            await toggleAntiLink(from, groupName, 'on', settings?.action || 'warn', settings?.warn_limit || 3);
            return reply(`✅ Anti-link *ENABLED*!`);

        case 'off':
        case 'disable':
            await updateAntiLinkSettings(from, { status: 'off' });
            return reply(`❌ Anti-link *DISABLED*!`);

        case 'warn':
        case 'delete':
        case 'remove':
            await updateAntiLinkSettings(from, { status: 'on', action: subcommand });
            return reply(`✅ Action set to: *${subcommand.toUpperCase()}*`);

        case 'limit':
            const limit = parseInt(value);
            if (isNaN(limit) || limit < 1 || limit > 10) return reply("❌ Limit must be between 1 and 10");
            await updateAntiLinkSettings(from, { warn_limit: limit });
            return reply(`✅ Warn limit set to: *${limit}*`);

        case 'resetwarns':
        case 'reset':
            clearAllWarns(from);
            return reply(`✅ All warning counts reset!`);

        default:
            return reply(
                "❌ Invalid command!\n\n" +
                `▸ *${conText.prefix}antilink on/off*\n` +
                `▸ *${conText.prefix}antilink warn/delete/remove*\n` +
                `▸ *${conText.prefix}antilink limit <1-10>*\n` +
                `▸ *${conText.prefix}antilink resetwarns*\n` +
                `▸ *${conText.prefix}antilink list*`
            );
    }
});
//========================================================================================================================
// From Owner.js


const {
  initNotesDB,
  addNote,
  removeNote,
  getNotes,
  getNote,
  clearNotes,
  updateNote
} = require("../database/notes");

// ✅ Initialize notes table on startup
initNotesDB().catch(err => {
  console.error("Failed to initialize notes database:", err);
});

// Unicode box separators
const BOX_TOP    = "╭━━━━━━━━━━━━━━━╮";
const BOX_MIDDLE = "├━━━━━━━━━━━━━━━┤";
const BOX_BOTTOM = "╰━━━━━━━━━━━━━━━╯";

function formatDate(dateObj, timeZone) {
  return new Date(dateObj).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone
  });
}

// ➕ Add note
keith({
  pattern: "note",
  aliases: ["addnote", "newnote"],
  category: "Owner",
  description: "Add a new note (usage: .note <title>|<content> or reply to text with .note <title>)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quotedMsg, reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");

  try {
    let title, content;

    if (quotedMsg) {
      const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
      if (!quotedText) return reply("❌ Quoted message has no text.");
      if (!q) return reply("📌 Usage when quoting: .note <title>");
      title = q.trim();
      content = quotedText;
    } else {
      if (!q || !q.includes("|")) {
        return reply("📌 Usage: .note <title>|<content> or reply to text with .note <title>");
      }
      [title, content] = q.split("|").map(s => s.trim());
    }

    const note = await addNote(title, content);
    reply(`✅ Note added:\n${BOX_TOP}\n│ ${note.title}\n│ Id ${note.id}\n${BOX_MIDDLE}\n│ ${formatDate(note.createdAt, conText.timeZone)}\n${BOX_BOTTOM}`);
  } catch (err) {
    reply(`❌ Failed to add note: ${err.message}`);
  }
});

// 📋 List notes
keith({
  pattern: "listnote",
  aliases: ["notes", "shownotes"],
  category: "Owner",
  description: "List all notes",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser, timeZone } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");

  try {
    const notes = await getNotes(); // ascending order
    if (!notes.length) return reply("📭 No notes found.");

    // ✅ Sequential number + title, then ID on its own line
    const formatted = notes.map((n, idx) =>
      `${BOX_TOP}\n│ ${idx + 1}. ${n.title}\n│ Id ${n.id}\n${BOX_MIDDLE}\n│ ${formatDate(n.createdAt, timeZone)}\n${BOX_BOTTOM}`
    ).join("\n\n");

    const caption = `📒 *Your Notes* (${notes.length} total)\n\n${formatted}\n\n📌 *Reply with a number to view a note*`;

    const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
    const messageId = sent.key.id;

    client.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;

      const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
      const chatId = msg.key.remoteJid;

      if (!isReply || !responseText) return;

      const index = parseInt(responseText.trim());
      if (isNaN(index) || index < 1 || index > notes.length) {
        return client.sendMessage(chatId, {
          text: `❌ Invalid number. Please reply with a number between 1 and ${notes.length}.`,
          quoted: msg
        });
      }

      await client.sendMessage(chatId, { react: { text: "📝", key: msg.key } });

      try {
        const note = notes[index - 1];
        if (!note) {
          return client.sendMessage(chatId, {
            text: `❌ Note #${index} not found.`,
            quoted: msg
          });
        }

        // ✅ Only return the plain note content
        await client.sendMessage(chatId, { text: note.content }, { quoted: msg });
      } catch (err) {
        console.error("Error fetching note:", err);
        await client.sendMessage(chatId, {
          text: `❌ Error fetching note #${index}: ${err.message}`,
          quoted: msg
        });
      }
    });
  } catch (err) {
    reply(`❌ Failed to list notes: ${err.message}`);
  }
});

// 👁️ View note
keith({
  pattern: "viewnote",
  aliases: ["shownote", "getnote"],
  category: "Owner",
  description: "View a note by ID (usage: .viewnote <id>)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");
  if (!q) return reply("📌 Usage: .viewnote <id>");
  try {
    const note = await getNote(Number(q));
    if (!note) return reply("❌ Note not found.");
    reply(note.content); // plain content only
  } catch (err) {
    reply(`❌ Failed to get note: ${err.message}`);
  }
});

// ✏️ Update note
keith({
  pattern: "updatenote",
  aliases: ["editnote"],
  category: "Owner",
  description: "Update a note (usage: .updatenote <id>|<new content> or reply to text with .updatenote <id>)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quotedMsg, reply, isSuperUser, timeZone } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");

  try {
    let id, content;

    if (quotedMsg) {
      const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
      if (!quotedText) return reply("❌ Quoted message has no text.");
      if (!q) return reply("📌 Usage when quoting: .updatenote <id>");
      id = Number(q.trim());
      content = quotedText;
    } else {
      if (!q || !q.includes("|")) return reply("📌 Usage: .updatenote <id>|<new content>");
      [id, content] = q.split("|").map(s => s.trim());
      id = Number(id);
    }

    const updated = await updateNote(id, { content });
    reply(`✅ Note updated:\n${BOX_TOP}\n│ ${updated.title}\n│ Id ${updated.id}\n${BOX_MIDDLE}\n│ ${formatDate(updated.createdAt, timeZone)}\n${BOX_BOTTOM}`);
  } catch (err) {
    reply(`❌ Failed to update note: ${err.message}`);
  }
});

// 🗑️ Remove note
keith({
  pattern: "removenote",
  aliases: ["deletenote"],
  category: "Owner",
  description: "Remove a note by ID (usage: .removenote <id>)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");
  if (!q) return reply("📌 Usage: .removenote <id>");
  try {
    const removed = await removeNote(Number(q));
    if (!removed) return reply("❌ Note not found.");
    reply(`🗑️ Note ${q} removed.`);
  } catch (err) {
    reply(`❌ Failed to remove note: ${err.message}`);
  }
});

// 🧹 Clear notes
// 🧹 Clear notes
keith({
  pattern: "clearnotes",
  aliases: ["resetnotes"],
  category: "Owner",
  description: "Clear all notes",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner only command!");
  try {
    await clearNotes();
    reply("🗑️ All notes cleared.");
  } catch (err) {
    reply(`❌ Failed to clear notes: ${err.message}`);
  }
});
//========================================================================================================================
      
//========================================================================================================================

//========================================================================================================================
keith({
  pattern: "botname",
  aliases: ["setbotname"],
  category: "Settings",
  description: "Change bot display name"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newName = q?.trim();

  if (!newName) {
    const settings = await getSettings();
    return reply(
      `🤖 Bot Name\n\n` +
      `🔹 Current Name: ${settings.botname}\n\n` +
      `Usage: ${settings.prefix}botname <new_name>`
    );
  }

  if (newName.length > 50) {
    return reply("❌ Bot name must be less than 50 characters!");
  }

  try {
    await updateSettings({ botname: newName });
    conText.botSettings.botname = newName;
    return reply(`✅ Bot name changed to: ${newName}`);
  } catch (error) {
    return reply("❌ Failed to update bot name!");
  }
});
//========================================================================================================================

keith({
  pattern: "author",
  aliases: ["setauthor"],
  category: "Settings",
  description: "Change bot author name"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newAuthor = q?.trim();

  if (!newAuthor) {
    const settings = await getSettings();
    return reply(
      `👤 Bot Author\n\n` +
      `🔹 Current Author: ${settings.author}\n\n` +
      `Usage: ${settings.prefix}author <new_author>`
    );
  }

  if (newAuthor.length > 30) {
    return reply("❌ Author name must be less than 30 characters!");
  }

  try {
    await updateSettings({ author: newAuthor });
    conText.botSettings.author = newAuthor;
    return reply(`✅ Author changed to: ${newAuthor}`);
  } catch (error) {
    return reply("❌ Failed to update author!");
  }
});
//========================================================================================================================

keith({
  pattern: "packname",
  aliases: ["setpackname"],
  category: "Settings",
  description: "Change sticker pack name"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newPackname = q?.trim();

  if (!newPackname) {
    const settings = await getSettings();
    return reply(
      `🖼️ Sticker Pack Name\n\n` +
      `🔹 Current Packname: ${settings.packname}\n\n` +
      `Usage: ${settings.prefix}packname <new_packname>`
    );
  }

  if (newPackname.length > 30) {
    return reply("❌ Packname must be less than 30 characters!");
  }

  try {
    await updateSettings({ packname: newPackname });
    conText.botSettings.packname = newPackname;
    return reply(`✅ Packname changed to: ${newPackname}`);
  } catch (error) {
    return reply("❌ Failed to update packname!");
  }
});
//========================================================================================================================

keith({
  pattern: "timezone",
  aliases: ["settimezone"],
  category: "Settings",
  description: "Change bot timezone"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newTimezone = q?.trim();

  if (!newTimezone) {
    const settings = await getSettings();
    return reply(
      `🌍 Bot Timezone\n\n` +
      `🔹 Current Timezone: ${settings.timezone}\n\n` +
      `Usage: ${settings.prefix}timezone <new_timezone>\n\n` +
      `Example: ${settings.prefix}timezone Africa/Nairobi`
    );
  }

  // Basic timezone validation
  try {
    new Date().toLocaleString("en-US", { timeZone: newTimezone });
  } catch (error) {
    return reply("❌ Invalid timezone! Please use a valid IANA timezone.");
  }

  try {
    await updateSettings({ timezone: newTimezone });
    conText.botSettings.timezone = newTimezone;
    return reply(`✅ Timezone changed to: ${newTimezone}`);
  } catch (error) {
    return reply("❌ Failed to update timezone!");
  }
});
//========================================================================================================================

keith({
  pattern: "botpic",
  aliases: ["boturl", "botprofile"],
  category: "Settings",
  description: "Change bot profile picture URL"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newUrl = q?.trim();

  if (!newUrl) {
    const settings = await getSettings();
    return reply(
      `🖼️ Bot Picture URL\n\n` +
      `🔹 Current URL: ${settings.url || 'Not Set'}\n\n` +
      `Usage: ${settings.prefix}url <image_url>`
    );
  }

  // Basic URL validation
  if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
    return reply("❌ Invalid URL! Must start with http:// or https://");
  }

  try {
    await updateSettings({ url: newUrl });
    conText.botSettings.url = newUrl;
    return reply(`✅ Profile picture URL updated!`);
  } catch (error) {
    return reply("❌ Failed to update URL!");
  }
});
//========================================================================================================================

keith({
  pattern: "boturl",
  aliases: ["setboturl", "seturl"],
  category: "Settings",
  description: "Change bot GitHub/repo URL"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newGurl = q?.trim();

  if (!newGurl) {
    const settings = await getSettings();
    return reply(
      `🔗 Bot URL\n\n` +
      `🔹 Current URL: ${settings.gurl || 'Not Set'}\n\n` +
      `Usage: ${settings.prefix}gurl <github_repo_url>`
    );
  }

  // Basic URL validation
  if (!newGurl.startsWith('http://') && !newGurl.startsWith('https://')) {
    return reply("❌ Invalid URL! Must start with http:// or https://");
  }

  try {
    await updateSettings({ gurl: newGurl });
    conText.botSettings.gurl = newGurl;
    return reply(`✅ GitHub/Repo URL updated!`);
  } catch (error) {
    return reply("❌ Failed to update GitHub URL!");
  }
});
//========================================================================================================================
      
//========================================================================================================================
keith({
  pattern: "mode",
  aliases: ["setmode"],
  category: "Settings",
  description: "Change bot mode (public/private)"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newMode = q?.trim().toLowerCase();

  if (!newMode) {
    const settings = await getSettings();
    return reply(
      `*🤖 Bot Mode*\n\n` +
      `🔹 *Current Mode:* ${settings.mode.toUpperCase()}\n\n` +
      `*Available Modes:*\n` +
      `▸ public - Everyone can use commands\n` +
      `▸ private - Only owner/sudo can use commands\n\n` +
      `*Usage:* \`${settings.prefix}mode <public/private>\``
    );
  }

  if (!['public', 'private'].includes(newMode)) {
    return reply("❌ Invalid mode! Use: public or private");
  }

  try {
    await updateSettings({ mode: newMode });
    // Update the botSettings in context
    conText.botSettings.mode = newMode;
    return reply(`✅ Bot mode changed to: *${newMode.toUpperCase()}*`);
  } catch (error) {
    return reply("❌ Failed to update mode!");
  }
});
//========================================================================================================================

keith({
  pattern: "prefix",
  aliases: ["setprefix"],
  category: "Settings",
  description: "Change bot prefix"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const newPrefix = q?.trim();

  if (!newPrefix) {
    const settings = await getSettings();
    return reply(`*🔧 Current Prefix:* \`${settings.prefix}\`\n\n*Usage:* \`${settings.prefix}prefix <new_prefix>\``);
  }

  if (newPrefix.length > 3) {
    return reply("❌ Prefix must be 1-3 characters long!");
  }

  try {
    await updateSettings({ prefix: newPrefix });
    // Update the botSettings in context
    conText.botSettings.prefix = newPrefix;
    return reply(`✅ Prefix changed to: \`${newPrefix}\``);
  } catch (error) {
    return reply("❌ Failed to update prefix!");
  }
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "presence",
  aliases: ["setpresence", "mypresence"],
  category: "Settings",
  description: "Manage your presence settings"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const type = args[0]?.toLowerCase();
  const status = args[1]?.toLowerCase();

  const settings = await getPresenceSettings();

  if (!type) {
    const format = (s) => s === 'off' ? '❌ OFF' : `✅ ${s.toUpperCase()}`;
    return reply(
      `*🔄 Presence Settings*\n\n` +
      `🔹 *Private Chats:* ${format(settings.privateChat)}\n` +
      `🔹 *Group Chats:* ${format(settings.groupChat)}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ presence private [off/online/typing/recording]\n` +
      `▸ presence group [off/online/typing/recording]`
    );
  }

  if (!['private', 'group'].includes(type)) {
    return reply(
      "❌ Invalid type. Use:\n\n" +
      `▸ presence private [status]\n` +
      `▸ presence group [status]`
    );
  }

  if (!['off', 'online', 'typing', 'recording'].includes(status)) {
    return reply(
      "❌ Invalid status. Options:\n\n" +
      `▸ off - No presence\n` +
      `▸ online - Show as online\n` +
      `▸ typing - Show typing indicator\n` +
      `▸ recording - Show recording indicator`
    );
  }

  await updatePresenceSettings({ [type === 'private' ? 'privateChat' : 'groupChat']: status });
  reply(`✅ ${type === 'private' ? 'Private chat' : 'Group chat'} presence set to *${status}*`);
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "greet",
  aliases: ["autoreply"],
  category: "Settings",
  description: "Manage private chat greeting settings"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const action = args[0]?.toLowerCase();
  const message = args.slice(1).join(" ");

  const settings = await getGreetSettings();

  if (!action) {
    return reply(
      `*👋 Greeting Settings*\n\n` +
      `🔹 *Status:* ${settings.enabled ? '✅ ON' : '❌ OFF'}\n` +
      `🔹 *Message:* ${settings.message}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ greet on/off\n` +
      `▸ greet set <message>\n` +
      `▸ greet clear`
    );
  }

  switch (action) {
    case 'on':
      await updateGreetSettings({ enabled: true });
      return reply("✅ Private chat greetings enabled.");

    case 'off':
      await updateGreetSettings({ enabled: false });
      return reply("✅ Private chat greetings disabled.");

    case 'set':
      if (!message) return reply("❌ Provide a greeting message.");
      await updateGreetSettings({ message });
      return reply(`✅ Greet message updated:\n"${message}"`);

    case 'clear':
      clearRepliedContacts();
      return reply("✅ Replied contacts memory cleared.");

    default:
      return reply(
        "❌ Invalid subcommand. Options:\n\n" +
        `▸ greet on/off\n` +
        `▸ greet set <message>\n` +
        `▸ greet clear`
      );
  }
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "autoviewstatus",
  aliases: ["viewstatus"],
  category: "Settings",
  description: "Configure auto-view for incoming statuses"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const arg = q?.trim().toLowerCase();
  const settings = await getAutoStatusSettings();

  if (!arg || arg === 'status') {
    return reply(
      `*👁️ Auto View Status*\n\n` +
      `🔹 *Enabled:* ${settings.autoviewStatus}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ autoviewstatus true/false\n` +
      `▸ autoviewstatus status`
    );
  }

  if (['true', 'false'].includes(arg)) {
    await updateAutoStatusSettings({ autoviewStatus: arg });
    return reply(`✅ Auto-view status set to *${arg}*`);
  }

  reply("❌ Invalid input. Use `.autoviewstatus status` to view usage.");
});
//========================================================================================================================


//const { keith } = require('../commandHandler');

keith({
  pattern: "autoreplystatus",
  aliases: ["replystatus"],
  category: "Settings",
  description: "Configure auto-reply for viewed statuses"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const sub = args[0]?.toLowerCase();
  const settings = await getAutoStatusSettings();

  if (!sub || sub === 'status') {
    return reply(
      `*💬 Auto Reply Status*\n\n` +
      `🔹 *Enabled:* ${settings.autoReplyStatus}\n` +
      `🔹 *Reply Text:* ${settings.statusReplyText}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ autoreplystatus true/false\n` +
      `▸ autoreplystatus text [your message]\n` +
      `▸ autoreplystatus status`
    );
  }

  if (sub === 'text') {
    const newText = args.slice(1).join(' ');
    if (!newText) return reply("❌ Provide reply text after 'text'");
    await updateAutoStatusSettings({ statusReplyText: newText });
    return reply("✅ Auto-reply text updated.");
  }

  if (['true', 'false'].includes(sub)) {
    await updateAutoStatusSettings({ autoReplyStatus: sub });
    return reply(`✅ Auto-reply status set to *${sub}*`);
  }

  reply("❌ Invalid input. Use `.autoreplystatus status` to view usage.");
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "autoread",
  aliases: ["readmessages", "setread"],
  category: "Settings",
  description: "Manage auto-read settings"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const value = args.slice(1).join(" ");

  const settings = await getAutoReadSettings();

  if (!subcommand) {
    const status = settings.status ? '✅ ON' : '❌ OFF';
    const types = settings.chatTypes.length > 0 ? settings.chatTypes.join(', ') : '*No types set*';

    return reply(
      `*👓 Auto-Read Settings*\n\n` +
      `🔹 *Status:* ${status}\n` +
      `🔹 *Chat Types:* ${types}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ autoread on/off\n` +
      `▸ autoread types <private/group/both>\n` +
      `▸ autoread addtype <type>\n` +
      `▸ autoread removetype <type>`
    );
  }

  switch (subcommand) {
    case 'on':
    case 'off': {
      const newStatus = subcommand === 'on';
      await updateAutoReadSettings({ status: newStatus });
      return reply(`✅ Auto-read has been ${newStatus ? 'enabled' : 'disabled'}.`);
    }

    case 'types': {
      if (!['private', 'group', 'both'].includes(value)) {
        return reply('❌ Use "private", "group", or "both".');
      }
      const types = value === 'both' ? ['private', 'group'] : [value];
      await updateAutoReadSettings({ chatTypes: types });
      return reply(`✅ Auto-read set for: ${types.join(', ')}`);
    }

    case 'addtype': {
      if (!['private', 'group'].includes(value)) {
        return reply('❌ Use "private" or "group".');
      }
      if (settings.chatTypes.includes(value)) {
        return reply(`⚠️ Type ${value} is already included.`);
      }
      const updated = [...settings.chatTypes, value];
      await updateAutoReadSettings({ chatTypes: updated });
      return reply(`✅ Added ${value} to auto-read types.`);
    }

    case 'removetype': {
      if (!['private', 'group'].includes(value)) {
        return reply('❌ Use "private" or "group".');
      }
      if (!settings.chatTypes.includes(value)) {
        return reply(`⚠️ Type ${value} is not currently included.`);
      }
      const updated = settings.chatTypes.filter(t => t !== value);
      await updateAutoReadSettings({ chatTypes: updated });
      return reply(`✅ Removed ${value} from auto-read types.`);
    }

    default:
      return reply(
        "❌ Invalid subcommand. Options:\n\n" +
        `▸ autoread on/off\n` +
        `▸ autoread types <private/group/both>\n` +
        `▸ autoread addtype <type>\n` +
        `▸ autoread removetype <type>`
      );
  }
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "autolikestatus",
  aliases: ["likestatus"],
  category: "Settings",
  description: "Configure auto-like for viewed statuses"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const sub = args[0]?.toLowerCase();

  const settings = await getAutoStatusSettings();

  if (!sub || sub === 'status') {
    const currentEmojis = settings.statusLikeEmojis || '💛,❤️,💜,🤍,💙';
    return reply(
      `*💖 Auto Like Status*\n\n` +
      `🔹 *Enabled:* ${settings.autoLikeStatus}\n` +
      `🔹 *Emojis:* ${currentEmojis}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ autolikestatus true/false\n` +
      `▸ autolikestatus emojis 💚 💔 💥\n` +
      `▸ autolikestatus status`
    );
  }

  if (sub === 'emojis') {
    const emojiList = args.slice(1).join(' ').trim();
    if (!emojiList) return reply("❌ Provide emojis after 'emojis'");
    
    // Clean and validate emojis - remove any commas and extra spaces
    const cleanedEmojis = emojiList
      .replace(/,/g, ' ') // Replace commas with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .split(' ') // Split by space to get individual emojis
      .filter(emoji => emoji.trim().length > 0) // Remove empty strings
      .join(','); // Join with commas for storage
    
    if (!cleanedEmojis) return reply("❌ No valid emojis provided");
    
    await updateAutoStatusSettings({ statusLikeEmojis: cleanedEmojis });
    return reply(`✅ Auto-like emojis updated to: ${cleanedEmojis.split(',').join(' ')}`);
  }

  if (['true', 'false'].includes(sub)) {
    await updateAutoStatusSettings({ autoLikeStatus: sub });
    return reply(`✅ Auto-like status set to *${sub}*`);
  }

  reply("❌ Invalid input. Use `.autolikestatus status` to view usage.");
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "autobio",
  aliases: ["bio", "setbio"],
  category: "Settings",
  description: "Manage auto-bio settings"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser, botSettings } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const message = args.slice(1).join(" ");

  const settings = await getAutoBioSettings();

  if (!subcommand) {
    const status = settings.status === 'on' ? '✅ ON' : '❌ OFF';
    const currentBotName = botSettings.botname || 'Keith-MD';
    const currentTimezone = botSettings.timezone || 'Africa/Nairobi';

    return reply(
      `*📝 Auto-Bio Settings*\n\n` +
      `🔹 *Status:* ${status}\n` +
      `🔹 *Bot Name:* ${currentBotName}\n` +
      `🔹 *Timezone:* ${currentTimezone}\n` +
      `🔹 *Message:* ${settings.message}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ autobio on/off\n` +
      `▸ autobio set <message>\n` +
      `▸ autobio reset\n\n` +
      `*💡 Note:* Uses bot name and timezone from settings`
    );
  }

  switch (subcommand) {
    case 'on':
    case 'off': {
      const newStatus = subcommand;
      if (settings.status === newStatus) {
        return reply(`⚠️ Auto-bio is already ${newStatus === 'on' ? 'enabled' : 'disabled'}.`);
      }
      await updateAutoBioSettings({ status: newStatus });
      
      // Restart auto-bio if enabled
      if (newStatus === 'on') {
        const { startAutoBio } = require('../index');
        startAutoBio();
      }
      
      return reply(`✅ Auto-bio has been ${newStatus === 'on' ? 'enabled' : 'disabled'}.`);
    }

    case 'set': {
      if (!message) return reply("❌ Provide a bio message.");
      if (message.length > 100) return reply("❌ Bio message too long (max 100 characters).");
      
      await updateAutoBioSettings({ message });
      return reply(`✅ Bio message updated to:\n"${message}"`);
    }

    case 'reset': {
      const defaultMessage = '🌟 Always active!';
      await updateAutoBioSettings({ message: defaultMessage });
      return reply(`✅ Bio message reset to default:\n"${defaultMessage}"`);
    }

    default:
      return reply(
        "❌ Invalid subcommand. Options:\n\n" +
        `▸ autobio on/off\n` +
        `▸ autobio set <message>\n` +
        `▸ autobio reset`
      );
  }
});
//========================================================================================================================

keith({
  pattern: "antidelete",
  aliases: ["deleteset", "antideletesetting"],
  category: "Settings",
  description: "Manage anti-delete settings"
},
async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const args = q?.trim().split(/\s+/) || [];
  const subcommand = args[0]?.toLowerCase();
  const value = args.slice(1).join(" ");

  const settings = await getAntiDeleteSettings();

  if (!subcommand) {
    const status = settings.status ? '✅ ON' : '❌ OFF';
    const groupInfo = settings.includeGroupInfo ? '✅ ON' : '❌ OFF';
    const media = settings.includeMedia ? '✅ ON' : '❌ OFF';
    const toOwner = settings.sendToOwner ? '✅ ON' : '❌ OFF';

    return reply(
      `*👿 Anti-Delete Settings*\n\n` +
      `🔹 *Status:* ${status}\n` +
      `🔹 *Notification Text:* ${settings.notification}\n` +
      `🔹 *Include Group Info:* ${groupInfo}\n` +
      `🔹 *Include Media Content:* ${media}\n` +
      `🔹 *Send to Owner Inbox:* ${toOwner}\n\n` +
      `*🛠 Usage:*\n` +
      `▸ antidelete on/off\n` +
      `▸ antidelete notification <text>\n` +
      `▸ antidelete groupinfo on/off\n` +
      `▸ antidelete media on/off\n` +
      `▸ antidelete inbox on/off`
    );
  }

  switch (subcommand) {
    case 'on':
    case 'off': {
      const newStatus = subcommand === 'on';
      if (settings.status === newStatus) {
        return reply(`⚠️ Anti-delete is already ${newStatus ? 'enabled' : 'disabled'}.`);
      }
      await updateAntiDeleteSettings({ status: newStatus });
      return reply(`✅ Anti-delete has been ${newStatus ? 'enabled' : 'disabled'}.`);
    }

    case 'notification': {
      if (!value) return reply('❌ Provide a notification text.');
      await updateAntiDeleteSettings({ notification: value });
      return reply(`✅ Notification updated:\n\n"${value}"`);
    }

    case 'groupinfo': {
      if (!['on', 'off'].includes(value)) return reply('❌ Use "on" or "off".');
      const newValue = value === 'on';
      if (settings.includeGroupInfo === newValue) {
        return reply(`⚠️ Group info inclusion is already ${newValue ? 'enabled' : 'disabled'}.`);
      }
      await updateAntiDeleteSettings({ includeGroupInfo: newValue });
      return reply(`✅ Group info inclusion ${newValue ? 'enabled' : 'disabled'}.`);
    }

    case 'media': {
      if (!['on', 'off'].includes(value)) return reply('❌ Use "on" or "off".');
      const newValue = value === 'on';
      if (settings.includeMedia === newValue) {
        return reply(`⚠️ Media content inclusion is already ${newValue ? 'enabled' : 'disabled'}.`);
      }
      await updateAntiDeleteSettings({ includeMedia: newValue });
      return reply(`✅ Media content inclusion ${newValue ? 'enabled' : 'disabled'}.`);
    }

    case 'inbox': {
      if (!['on', 'off'].includes(value)) return reply('❌ Use "on" or "off".');
      const newValue = value === 'on';
      if (settings.sendToOwner === newValue) {
        return reply(`⚠️ Send to owner inbox is already ${newValue ? 'enabled' : 'disabled'}.`);
      }
      await updateAntiDeleteSettings({ sendToOwner: newValue });
      return reply(`✅ Send to owner inbox ${newValue ? 'enabled' : 'disabled'}.`);
    }

    default:
      return reply(
        '❌ Invalid subcommand. Options:\n\n' +
        `▸ antidelete on/off\n` +
        `▸ antidelete notification <text>\n` +
        `▸ antidelete groupinfo on/off\n` +
        `▸ antidelete media on/off\n` +
        `▸ antidelete inbox on/off`
      );
  }
});
//========================================================================================================================
//========================================================================================================================
