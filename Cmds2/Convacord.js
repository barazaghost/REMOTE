
const { keith, commands } = require('../commandHandler');
const {
  DEFAULT_SESSION,
  getStickerHash,
  setStickerCommand,
  removeStickerCommand,
  removeStickerCommandsByName,
  getStickerCommand,
  getAllStickerCommands
} = require('../database/stickercmd');

// Find a registered command by its pattern or any alias
const findCommand = (name) =>
  commands.find(c => c?.pattern === name || (Array.isArray(c?.aliases) && c.aliases.includes(name)));

// ============================================================
// SETSTICKERCMD - bind a sticker to a command.
// ============================================================
keith({
  pattern: "setstickercmd",
  aliases: ["setstcmd", "stickercmdset", "addstickercmd"],
  description: "Bind a sticker to a command (reply to a sticker)",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quoted, reply, isSuperUser, sender, prefix } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const stickerMsg = quoted?.stickerMessage;
  if (!stickerMsg) {
    return reply(
      `❌ Reply to a *sticker* with the command you want it to run.\n\n` +
      `Example: ${prefix}setstickercmd ping\n` +
      `With arguments: ${prefix}setstickercmd play despacito`
    );
  }

  if (!q) {
    return reply(`❌ Tell me which command to bind.\n\nExample: ${prefix}setstickercmd ping`);
  }

  // Accept both "ping" and ".ping"
  const raw = q.trim().startsWith(prefix) ? q.trim().slice(prefix.length).trim() : q.trim();
  const [name, ...extra] = raw.split(/\s+/);
  const cmdName = (name || '').toLowerCase();

  if (!cmdName || !findCommand(cmdName)) {
    return reply(`❌ Command *${cmdName || raw}* doesn't exist.\n\nCheck the command name and try again.`);
  }

  const hash = getStickerHash(stickerMsg);
  if (!hash) return reply("❌ Couldn't read that sticker. Try a different one.");

  const full = [cmdName, ...extra].join(' ');
  const saved = await setStickerCommand(DEFAULT_SESSION, hash, full, sender);
  if (!saved) return reply("❌ Failed to save the sticker command. Check the logs.");

  return reply(
    `✅ *Sticker command set!*\n\n` +
    `Sending that sticker will now run: *${prefix}${full}*\n\n` +
    `Remove it with ${prefix}delstickercmd (reply to the sticker).`
  );
});

// ============================================================
// DELSTICKERCMD - unbind a sticker (reply) or every sticker of a command (name)
// ============================================================
keith({
  pattern: "delstickercmd",
  aliases: ["unsetstickercmd", "removestickercmd", "rmstickercmd"],
  description: "Remove a sticker command (reply to the sticker, or give the command name)",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quoted, reply, isSuperUser, prefix } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  // Reply to a sticker -> remove just that one
  const stickerMsg = quoted?.stickerMessage;
  if (stickerMsg) {
    const hash = getStickerHash(stickerMsg);
    if (!hash) return reply("❌ Couldn't read that sticker.");

    const existing = await getStickerCommand(DEFAULT_SESSION, hash);
    if (!existing) return reply("❌ That sticker isn't bound to any command.");

    const removed = await removeStickerCommand(DEFAULT_SESSION, hash);
    return reply(removed
      ? `✅ Sticker command removed (was *${prefix}${existing.command}*).`
      : "❌ Failed to remove the sticker command.");
  }

  // Command name -> remove every sticker bound to it
  if (q) {
    const name = (q.trim().startsWith(prefix) ? q.trim().slice(prefix.length) : q.trim())
      .split(/\s+/)[0].toLowerCase();
    const count = await removeStickerCommandsByName(DEFAULT_SESSION, name);
    return reply(count
      ? `✅ Removed *${count}* sticker${count > 1 ? 's' : ''} bound to *${prefix}${name}*.`
      : `❌ No stickers are bound to *${prefix}${name}*.`);
  }

  return reply(
    `❌ Reply to the sticker you want to unbind, or give a command name.\n\n` +
    `${prefix}delstickercmd (reply to sticker)\n` +
    `${prefix}delstickercmd ping`
  );
});

// ============================================================
// LISTSTICKERCMDS - show everything that's bound
// ============================================================
keith({
  pattern: "liststickercmds",
  aliases: ["stickercmds", "stickercmdlist", "getstickercmds"],
  description: "List all sticker commands",
  category: "Sticker",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser, prefix } = conText;

  if (!isSuperUser) return reply("❌ Owner Only Command!");

  const all = await getAllStickerCommands(DEFAULT_SESSION);
  if (!all.length) {
    return reply(`📭 No sticker commands set yet.\n\nReply to a sticker with ${prefix}setstickercmd <command> to add one.`);
  }

  const lines = all.map((s, i) =>
    `${i + 1}. *${prefix}${s.command}*  •  ${s.usageCount || 0} use${s.usageCount === 1 ? '' : 's'}  •  id: ${s.hash.slice(0, 8)}`
  );

  return reply(`🎭 *Sticker Commands* (${all.length})\n\n${lines.join('\n')}`);
});
