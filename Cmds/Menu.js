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
  }
}

function getCategoryCommands(categories, selectedNumber) {
  const selectedCategory = categories?.[selectedNumber - 1];
  if (!selectedCategory) {
    return {
      text: null,
      category: null
    };
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
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "menu",
  category: "general",
  description: "Show all commands grouped by category"
}, async (from, client, conText) => {
  const { mek, pushName, botname, botPic, sourceUrl } = conText;

  initializeCommands();

  const categories = Object.keys(commandList);

  let menuText = `╰►Hey, ${pushName}
╭───〔 *${botname}* 〕──────┈
├──────────────
│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}
╰──────────────────────⊷\n\n`;

  categories.forEach(cat => {
    menuText += `╭─────「 ${cat} 」───┈⊷\n`;
    menuText += commandList[cat].map(cmd => `││◦➛ ${cmd}`).join("\n");
    menuText += `\n╰──────────────┈⊷\n\n`;
  });

  await client.sendMessage(from, {
    text: menuText.trim(),
    contextInfo: {
      mentionedJid: [mek.sender],
      externalAdReply: {
        title: `${botname} Menu`,
        body: `Category-based command list`,
        thumbnailUrl: botPic,
        sourceUrl: sourceUrl,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });
});
//========================================================================================================================
//
keith({
  pattern: "menu2",
  category: "general",
  description: "Interactive category-based menu"
}, async (from, client, conText) => {
  const { mek, pushName, botname, botPic, sourceUrl } = conText;
  const userId = mek.sender;

  if (activeMenus.has(userId)) {
    const { handler } = activeMenus.get(userId);
    client.ev.off("messages.upsert", handler);
    activeMenus.delete(userId);
  }

  initializeCommands();

  const categories = Object.keys(commandList);

  const menuText = `╰►Hey, ${pushName}
╭───〔  *${botname}* 〕──────┈⊷𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭𑲭
├──────────────
│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}
╰──────────────────────⊷

╭───◇ *𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗜𝗘𝗦* ◇──────┈⊷
│「 Reply with a number below 」
${categories.map((cat, i) => `> │◦➛ ${i + 1}. ${cat}`).join("\n")}
╰─────────────────────┈⊷
`.trim();

  const sentMessage = await client.sendMessage(from, {
    text: menuText,
    contextInfo: {
      mentionedJid: [mek.sender],
      externalAdReply: {
        title: `${botname} Menu2`,
        body: `Category-based command explorer`,
        thumbnailUrl: botPic,
        sourceUrl: sourceUrl,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });

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
      await client.sendMessage(from, { text: menuText });
      activeMenus.set(userId, {
        sentMessage,
        handler: replyHandler,
        lastCategoryMessage: null
      });
      return;
    }

    if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > categories.length) {
      console.log(`Invalid menu2 input from ${userId}: "${userInput}"`);
      return;
    }

    const { text: commandsText } = getCategoryCommands(categories, selectedNumber);
    if (!commandsText) {
      console.log(`menu2: No category found for input ${selectedNumber}`);
      return;
    }

    const categoryMessage = await client.sendMessage(from, {
      text: commandsText,
      contextInfo: {
        mentionedJid: [mek.sender],
        externalAdReply: {
          title: `${categories[selectedNumber - 1]} Commands`,
          body: `Total: ${commandList[categories[selectedNumber - 1]]?.length || 0} commands`,
          thumbnailUrl: botPic,
          sourceUrl: sourceUrl,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    });

    activeMenus.set(userId, {
      sentMessage,
      handler: replyHandler,
      lastCategoryMessage: categoryMessage.key.id
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
