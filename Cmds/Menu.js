const { keith } = require('../commandHandler');
const { randomUUID } = require('crypto');
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');

const activeMenus = new Map();
const commandList = {};
let totalCommands = 0;

//========================================================================================================================
// SHARED HELPERS
//========================================================================================================================

function initializeCommands() {
  if (Object.keys(commandList).length > 0) return;
  
  const commands = require('../commandHandler').commands;
  totalCommands = commands.filter((cmd) => !cmd.dontAddCommandList).length;
  
  commands.forEach((cmd) => {
    const category = cmd.category?.toUpperCase() || 'UNCATEGORIZED';
    if (!commandList[category]) commandList[category] = [];
    commandList[category].push(cmd.pattern);
  });
  
  Object.keys(commandList).forEach((cat) => {
    commandList[cat].sort((a, b) => a.localeCompare(b));
  });
}

function getCategoryText(category) {
  const cmds = commandList[category] || [];
  return (
    `╭────「 ${category} 」───┈⊷\n` +
    `│◦➛╭───────────────\n` +
    cmds.map((cmd, i) => `│◦➛ ${i + 1}. ${cmd}`).join('\n') +
    `\n│◦➛╰─────────────\n` +
    `╰──────────────┈⊷\n\n` +
    `🔢 Total: ${cmds.length} commands`
  );
}

function locationQuoted(pushName) {
  return {
    key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
      locationMessage: {
        name: `Hi ${pushName || 'User'}`,
        jpegThumbnail: ''
      }
    }
  };
}

const additionalNodes = [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }]
      }
    ]
  }
];

//========================================================================================================================
// MENU 1 (Clickable Image Native Flow)
//========================================================================================================================
keith({
  pattern: 'menu',
  aliases: ['help', 'commands', 'cmds'],
  category: 'general',
  description: 'Native flow menu with clickable image',
  filename: __filename
}, async (from, client, conText) => {
  const { sender, botname, botPic, expiryDisplay, pushName, reply } = conText;
  const userId = sender;

  if (activeMenus.has(userId)) {
    const { handler } = activeMenus.get(userId);
    client.ev.off('messages.upsert', handler);
    activeMenus.delete(userId);
  }

  initializeCommands();
  const categories = Object.keys(commandList).sort((a, b) => a.localeCompare(b));

  const nextPageSections = categories.map((cat) => ({
    rows: [
      {
        title: cat,
        description: `There are ${commandList[cat].length} commands`,
        id: `menu_cat_${cat}`
      }
    ]
  }));

  const caption =
    `👋 Hey, @${sender.split('@')[0]}\n\n` +
    `╭───〔 *${botname}* 〕──────┈\n` +
    `│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}\n` +
    `│✵│▸ 𝐁𝐎𝐓 𝐄𝐗𝐏𝐈𝐑𝐀𝐓𝐈𝐎𝐍: ${expiryDisplay || 'N/A'}\n` +
    `╰──────────────────────⊷\n\n` +
    ` Tap *Browse Categories* to see commands.`;

  try {
    const imgUrl = botPic || 'https://files.catbox.moe/placeholder.jpg';
    const rawBuf = (await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 60000 })).data;

    const resized = await sharp(Buffer.from(rawBuf))
      .resize(800, 436, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const media = await prepareWAMessageMedia(
      { image: resized },
      { upload: client.waUploadToServer }
    );

    const quoted = locationQuoted(pushName);

    const payload = {
      interactiveMessage: {
        header: {
          title: botname || 'Menu',
          subtitle: "",
          hasMediaAttachment: true,
          productMessage: {
            product: {
              productImage: media.imageMessage,
              title: botname || 'Menu',
              description: "Click to open hosting site",
              currencyCode: "",
              retailerId: "",
              url: "https://hosting.keithsite.lol",
              productImageCount: 1
            },
            businessOwnerJid: "0@s.whatsapp.net"
          }
        },
        body: {
          text: caption
        },
        footer: {
          text: `> ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ ʙʏ ${botname || 'Keith'}`
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: "{\"has_multiple_buttons\":true}"
            },
            {
              name: "call_permission_request",
              buttonParamsJson: "{\"has_multiple_buttons\":true}"
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Hosting Site",
                url: "https://hosting.keithsite.lol",
                merchant_url: "https://hosting.keithsite.lol",
                has_multiple_buttons: true
              })
            },
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "Next Page",
                sections: nextPageSections,
                has_multiple_buttons: true
              })
            }
          ],
          messageParamsJson: JSON.stringify({
            limited_time_offer: {
              text: 'Advert: keith bot hosting site at affordable price',
              url: 'https://hosting.keithsite.lol',
              copy_code: 'hosting.keithsite.lol',
              expiration_time: Date.now() + (24 * 60 * 60 * 1000) // Ends tomorrow
            },
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [1, 2, 3, 4, 5, 999],
              list_title: "Select Menu",
              button_title: "Tap Here!"
            },
            tap_target_configuration: {
              title: botname || 'Menu',
              description: "WhatsApp Bot",
              canonical_url: "https://hosting.keithsite.lol",
              domain: "https://hosting.keithsite.lol",
              button_index: 0
            }
          })
        },
        contextInfo: {
          mentionedJid: [sender],
          groupMentions: [],
          statusAttributions: [],
          forwardingScore: 1,
          isForwarded: true,
          quotedMessage: quoted.message,
          participant: quoted.key.participant,
          stanzaId: 'status@broadcast'
        }
      }
    };

    await client.relayMessage(from, payload, {
      messageId: randomUUID(),
      additionalNodes
    });

  } catch (err) {
    console.error('menu error:', err);
    return reply(`❌ ${err.message}`);
  }

  const handler = async (update) => {
    const msg = update.messages?.[0];
    if (!msg?.message) return;
    if (msg.key.remoteJid !== from) return;

    const resp = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage;
    if (!resp) return;

    let params = {};
    try {
      params = JSON.parse(resp.paramsJson || '{}');
    } catch { return; }

    const selectedId = params.id || params.selectedId;
    if (!selectedId) return;

    if (selectedId.startsWith('menu_cat_')) {
      const category = selectedId.replace('menu_cat_', '');
      await client.sendMessage(from, {
        image: { url: botPic },
        caption: getCategoryText(category),
        mentions: [sender],
        contextInfo: {
          quotedMessage: locationQuoted().message,
          participant: locationQuoted().key.participant,
          stanzaId: 'status@broadcast'
        }
      }, { quoted: msg });
    }
  };

  client.ev.on('messages.upsert', handler);
  activeMenus.set(userId, { handler });

  setTimeout(() => {
    if (activeMenus.has(userId)) {
      client.ev.off('messages.upsert', activeMenus.get(userId).handler);
      activeMenus.delete(userId);
    }
  }, 600000);
});

//========================================================================================================================
// MENU 2 (Full Text List with Link Preview)
//========================================================================================================================
keith({
  pattern: "menu2",
  aliases: ["menufull"],
  category: "general",
  description: "Show all commands grouped by category (link preview style)"
}, async (from, client, conText) => {
  const { sender, botname, expiryDisplay, botPic, pushName, reply } = conText;

  initializeCommands();
  const categories = Object.keys(commandList).sort((a, b) => a.localeCompare(b));

  // Start with the URL so WhatsApp triggers the preview
  let menuText = `https://hosting.keithsite.lol\n\n` +
    `╰►Hey, ${pushName || 'User'}\n` +
    `╭───〔 *${botname}* 〕──────┈\n` +
    `├──────────────\n` +
    `│✵│▸ 𝐓𝐎𝐓𝐀𝐋 𝐏𝐋𝐔𝐆𝐈𝐍𝐒: ${totalCommands}\n` +
    `│✵│▸ 𝐁𝐎𝐓 𝐄𝐗𝐏𝐈𝐑𝐀𝐓𝐈𝐎𝐍 𝐃𝐀𝐓𝐄: ${expiryDisplay}\n` +
    `╰──────────────────────⊷\n\n`;

  categories.forEach(cat => {
    menuText += `╭─────「 ${cat} 」───┈⊷\n`;
    menuText += commandList[cat].map(cmd => `││◦➛ ${cmd}`).join("\n");
    menuText += `\n╰──────────────┈⊷\n\n`;
  });

  try {
    const imgUrl = botPic || 'https://files.catbox.moe/placeholder.jpg';
    const rawBuf = (await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 60000 })).data;

    const resized = await sharp(Buffer.from(rawBuf))
      .resize(736, 1308, { fit: 'cover', position: 'center' }) // Match the original aspect ratio
      .jpeg({ quality: 90 })
      .toBuffer();

    const media = await prepareWAMessageMedia(
      { image: resized },
      { upload: client.waUploadToServer }
    );

    const payload = {
      extendedTextMessage: {
        endCardTiles: [],
        text: menuText.trim(),
        matchedText: "https://hosting.keithsite.lol",
        description: `Powered by ${botname || 'Keith'}`,
        title: botname || 'Menu',
        previewType: 0,
        jpegThumbnail: media.imageMessage.jpegThumbnail,
        thumbnailDirectPath: media.imageMessage.directPath,
        thumbnailSha256: media.imageMessage.fileSha256,
        thumbnailEncSha256: media.imageMessage.fileEncSha256,
        mediaKey: media.imageMessage.mediaKey,
        mediaKeyTimestamp: media.imageMessage.mediaKeyTimestamp,
        thumbnailHeight: 1308,
        thumbnailWidth: 736,
        inviteLinkGroupTypeV2: 0,
        contextInfo: {
          mentionedJid: [sender],
          groupMentions: [],
          statusAttributions: [],
          forwardingScore: 1,
          isForwarded: true
        }
      }
    };

    await client.relayMessage(from, payload, {});
  } catch (err) {
    console.error('menu2 error:', err);
    await reply(`❌ ${err.message}`);
  }
});

//========================================================================================================================
// MENU 3 (Interactive Number Reply)
//========================================================================================================================
keith({
  pattern: "menu3",
  category: "general",
  description: "Interactive category-based menu (reply with number)"
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

  const quoted = locationQuoted(pushName);

  const sentMessage = await client.sendMessage(from, {
    image: { url: botPic },
    caption: menuText,
    mentions: [sender],
    contextInfo: {
      quotedMessage: quoted.message,
      participant: quoted.key.participant,
      stanzaId: 'status@broadcast'
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
      const quotedMsg = locationQuoted(pushName);
      await client.sendMessage(from, {
        image: { url: botPic },
        caption: menuText,
        mentions: [sender],
        contextInfo: {
          quotedMessage: quotedMsg.message,
          participant: quotedMsg.key.participant,
          stanzaId: 'status@broadcast'
        }
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

    const categoryName = categories[selectedNumber - 1];
    const commandsText = getCategoryText(categoryName);
    if (!commandsText) return;

    const quotedMsg = locationQuoted(pushName);
    const categoryMessage = await client.sendMessage(from, {
      image: { url: botPic },
      caption: commandsText,
      mentions: [sender],
      contextInfo: {
        quotedMessage: quotedMsg.message,
        participant: quotedMsg.key.participant,
        stanzaId: 'status@broadcast'
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
