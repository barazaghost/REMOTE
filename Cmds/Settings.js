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
keith({
  pattern: "botsettings",
  aliases: ["allsettings", "configlist", "settingslist", "settings", "setting"],
  category: "Settings",
  description: "List all bot configuration settings",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, prefix } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    // Fetch all settings in parallel
    const [
      botSettings,
      antiDelete,
      autoBio,
      autoRead,
      autoStatus,
      greet,
      presence
    ] = await Promise.all([
      getSettings(),
      getAntiDeleteSettings(),
      getAutoBioSettings(),
      getAutoReadSettings(),
      getAutoStatusSettings(),
      getGreetSettings(),
      getPresenceSettings()
    ]);

    // Format all settings
    let settingsList = `*🤖 BOT SETTINGS DASHBOARD*\n`;
    settingsList += `📊 *All Configuration Values*\n\n`;

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

    // 2. AUTO FEATURES
    settingsList += `*⚡ AUTO FEATURES*\n`;
    settingsList += `├─ Auto-Read: ${autoRead.status ? '✅ ON' : '❌ OFF'}\n`;
    settingsList += `├─ Auto-Bio: ${autoBio.status === 'on' ? '✅ ON' : '❌ OFF'}\n`;
    settingsList += `├─ Auto-Reply Greet: ${greet.enabled ? '✅ ON' : '❌ OFF'}\n`;
    settingsList += `├─ Auto-View Status: ${autoStatus.autoviewStatus === 'true' ? '✅ ON' : '❌ OFF'}\n`;
    settingsList += `├─ Auto-Reply Status: ${autoStatus.autoReplyStatus === 'true' ? '✅ ON' : '❌ OFF'}\n`;
    settingsList += `└─ Auto-Like Status: ${autoStatus.autoLikeStatus === 'true' ? '✅ ON' : '❌ OFF'}\n\n`;

    // 3. PROTECTION SETTINGS
    settingsList += `*🛡️ PROTECTION SETTINGS*\n`;
    settingsList += `└─ Anti-Delete: ${antiDelete.status ? '✅ ON' : '❌ OFF'}\n\n`;

    // 4. PRESENCE SETTINGS
    const presenceMap = {
      'off': '❌ OFF',
      'online': '🟢 ONLINE',
      'typing': '✍️ TYPING',
      'recording': '🎙️ RECORDING'
    };
    settingsList += `*🔄 PRESENCE*\n`;
    settingsList += `├─ Private: ${presenceMap[presence.privateChat] || '❌ OFF'}\n`;
    settingsList += `└─ Group: ${presenceMap[presence.groupChat] || '❌ OFF'}\n\n`;

    // 5. ADDITIONAL INFO
    settingsList += `*📊 QUICK STATS*\n`;
    settingsList += `├─ Chat Types (Auto-Read): ${autoRead.chatTypes.join(', ') || 'None'}\n`;
    settingsList += `└─ Status Like Emojis: ${autoStatus.statusLikeEmojis || 'Default'}\n\n`;

    // 6. COMMANDS SECTION
    settingsList += `*🔧 INDIVIDUAL COMMANDS*\n`;
    settingsList += `▸ ${prefix}settings - Bot basic settings\n`;
    settingsList += `▸ ${prefix}autoread - Auto-read settings\n`;
    settingsList += `▸ ${prefix}antidelete - Anti-delete settings\n`;
    settingsList += `▸ ${prefix}presence - Presence settings\n`;
    settingsList += `▸ ${prefix}greet - Greeting settings\n`;
    settingsList += `▸ ${prefix}autobio - Auto-bio settings\n`;

    // Send the settings list
    await reply(settingsList);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return reply("❌ Error fetching settings. Please try again.");
  }
});
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
