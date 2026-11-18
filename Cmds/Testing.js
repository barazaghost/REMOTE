const { keith } = require('../commandHandler');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

keith({
  pattern: 'vvtext',
  aliases: ['tv1', 'viewonce', 'votxt'],
  category: 'tools',
  description: 'Send a view-once text message',
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, quotedMsg } = conText;

  let textToSend = q?.trim();

  if (!textToSend && quotedMsg) {
    textToSend = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
  }

  if (!textToSend) {
    return reply('📌 Usage: `.vvtext <text>` or reply to a text message.\nExample: `.vvtext Hello World`');
  }

  const target = from;

  if (!target || target === 'status@broadcast') {
    return reply('❌ Invalid chat target.');
  }

  if (typeof client?.relayMessage !== 'function') {
    return reply('❌ Socket does not support relayMessage().');
  }

  try {
    const userJid = client.user?.id || client.user?.jid;
    if (!userJid) throw new Error('Bot JID not available.');

    const content = {
      viewOnceMessageV2: {
        message: {
          extendedTextMessage: {
            text: textToSend,
            viewOnce: true
          }
        }
      }
    };

    const msg = generateWAMessageFromContent(target, content, { userJid });

    await client.relayMessage(target, msg.message, {
      messageId: msg.key.id
    });

  } catch (err) {
    console.error('vvtext error:', err);
    await reply(`❌ Failed to send view-once text: ${err.message}`);
  }
});
