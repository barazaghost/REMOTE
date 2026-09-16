const { keith } = require('../commandHandler');
const activeMenus = new Map();

const commandList = {};
let totalCommands = 0;

function initializeCommands() {
  if (Object.keys(commandList).length === 0) {
    const commands = require('../commandHandler').commands;
    totalCommands = commands.filter(cmd => !cmd.dontAddCommandList).length;
    commands.forEach((cmd) => {
      const category = cmd.category?.toUpperCase() || 'UNCATEGORIZED';
      if (!commandList[category]) commandList[category] = [];
      commandList[category].push(cmd.pattern);
    });
    // Sort commands inside each category
    Object.keys(commandList).forEach(cat => {
      commandList[cat].sort((a, b) => a.localeCompare(b));
    });
  }
}

function getCategoryCommands(categories, selectedNumber) {
  const selectedCategory = categories?.[selectedNumber - 1];
  if (!selectedCategory) {
    return { text: null, category: null };
  }

  const commandsInCategory = commandList[selectedCategory] || [];

  return {
    text:
      `╭────「 ${selectedCategory} 」──┈⊷𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭\n` +
      `│◦➛╭───────────────\n` +
      commandsInCategory.map((cmd, idx) => `│◦➛ ${idx + 1}. ${cmd}`).join("\n") +
      `\n│◦➛╰─────────────\n` +
      `╰──────────────┈⊷\n\n` +
      `🔢 Total: ${commandsInCategory.length} commands`,
    category: selectedCategory
  };
}

function locationQuoted(pushName) {
  return {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast',
    },
    message: {
      locationMessage: {
        name: `Hi ${pushName || 'User'}`,
        jpegThumbnail: '',
      },
    },
  };
}

//========================================================================================================================
// MENU (full list)
keith({
  pattern: "menu2",
  category: "general",
  description: "Show all commands grouped by category"
}, async (from, client, conText) => {
  const { sender, botname, expiryDisplay, botPic, pushName } = conText;

  initializeCommands();

  const categories = Object.keys(commandList).sort((a, b) => a.localeCompare(b));

  let menuText = `╰►Hey, ${pushName || 'User'}
╭───〔 *${botname}* 〕──────┈
├──────────────
│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}
│✵│▸ 𝐁𝐎𝐓 𝐄𝐗𝐏𝐈𝐑𝐀𝐓𝐈𝐎𝐍 𝐃𝐀𝐓𝐄: ${expiryDisplay}
╰──────────────────────⊷\n\n`;

  categories.forEach(cat => {
    menuText += `╭─────「 ${cat} 」───┈⊷\n`;
    menuText += commandList[cat].map(cmd => `││◦➛ ${cmd}`).join("\n");
    menuText += `\n╰──────────────┈⊷\n\n`;
  });

  await client.sendInappSignup(from, {
    text: menuText.trim(),
    title: botname || '🤖 MyBot',
    subtitle: `v1.0 • ${totalCommands} plugins`,
    footer: `⚡ Expires: ${expiryDisplay}`
  });
});

//========================================================================================================================
// MENU (interactive)
keith({
  pattern: "menu",
  category: "general",
  description: "Interactive category-based menu"
}, async (from, client, conText) => {
  const { sender, botname, botPic, expiryDisplay, pushName } = conText;
  const userId = sender;

  if (activeMenus.has(userId)) {
    const { handler } = activeMenus.get(userId);
    client.ev.off("messages.upsert", handler);
    activeMenus.delete(userId);
  }

  initializeCommands();

  const categories = Object.keys(commandList).sort((a, b) => a.localeCompare(b));

  const menuText = `╰►Hey, ${pushName || 'User'}
╭───〔  *${botname}* 〕──────┈⊷𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭
├──────────────
│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}
│✵│▸ 𝐁𝐎𝐓 𝐄𝐗𝐏𝐈𝐑𝐀𝐓𝐈𝐎𝐍 𝐃𝐀𝐓𝐄: ${expiryDisplay}
╰──────────────────────⊷

╭───◇ *𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗜𝗘𝗦* ◇──────┈⊷
│「 Reply with a number below 」
${categories.map((cat, i) => `> │◦➛ ${i + 1}. ${cat}`).join("\n")}
╰─────────────────────┈⊷
`.trim();

  await client.sendInappSignup(from, {
    text: menuText,
    title: botname || '🤖 MyBot',
    subtitle: `v1.0 • ${totalCommands} plugins`,
    footer: `⚡ Expires: ${expiryDisplay}`
  });

  // Note: sendInappSignup likely returns void or a message object.
  // If it returns nothing, the reply-tracking below will need adjusting.
  const sentMessage = { key: { id: Date.now().toString() } };

  const replyHandler = async (update) => {
    const message = update.messages?.[0];
    if (!message?.message?.extendedTextMessage || message.key.remoteJid !== from) return;

    const response = message.message.extendedTextMessage;
    const isReplyToMenu = response.contextInfo?.stanzaId === sentMessage.key.id;
    const isReplyToCategory = activeMenus.get(userId)?.lastCategoryMessage === message.key.id;
    if (!isReplyToMenu && !isReplyToCategory) return;

    const userInput = response.text.trim();
    const selectedNumber = parseInt(userInput);

    if (userInput === "0") {
      await client.sendInappSignup(from, {
        text: menuText,
        title: botname || '🤖 MyBot',
        subtitle: `v1.0 • ${totalCommands} plugins`,
        footer: `⚡ Expires: ${expiryDisplay}`
      });
      activeMenus.set(userId, {
        sentMessage,
        handler: replyHandler,
        lastCategoryMessage: null
      });
      return;
    }

    if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > categories.length) {
      return;
    }

    const { text: commandsText } = getCategoryCommands(categories, selectedNumber);
    if (!commandsText) return;

    const categoryMessage = await client.sendInappSignup(from, {
      text: commandsText,
      title: categories[selectedNumber - 1],
      subtitle: `📦 ${(commandList[categories[selectedNumber - 1]] || []).length} commands`,
      footer: '⚡ Reply 0 to go back'
    });

    activeMenus.set(userId, {
      sentMessage,
      handler: replyHandler,
      lastCategoryMessage: categoryMessage?.key?.id || null
    });
  };

  client.ev.on("messages.upsert", replyHandler);
  activeMenus.set(userId, {
    sentMessage,
    handler: replyHandler,
    lastCategoryMessage: null
  });

  setTimeout(() => {
    if (activeMenus.has(userId)) {
      client.ev.off("messages.upsert", activeMenus.get(userId).handler);
      activeMenus.delete(userId);
    }
  }, 600000);
});
