const { keith } = require('../commandHandler');
const { generateWAMessageFromContent, jidNormalizedUser } = require('@whiskeysockets/baileys');

keith({
  pattern: 'vvtext',
  aliases: ['tv1', 'viewonce', 'votxt'],
  category: 'tools',
  description: 'Send a view-once text message (optional: to another JID)',
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, quotedMsg } = conText;

  // Parse arguments: .vvtext <text> [| jid]
  let textToSend = q?.trim() || '';
  let targetJid = from;

  if (textToSend.includes('|')) {
    const parts = textToSend.split('|');
    textToSend = parts[0].trim();
    const rawJid = parts[1]?.trim();

    if (rawJid) {
      // If it's a phone number, convert to JID
      if (/^\d+$/.test(rawJid)) {
        targetJid = `${rawJid}@s.whatsapp.net`;
      } else {
        targetJid = rawJid;
      }
    }
  }

  // Fallback to quoted message if no text is provided
  if (!textToSend && quotedMsg) {
    textToSend = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
  }

  if (!textToSend) {
    return reply(
      '📌 Usage:\n' +
      '`.vvtext <text>` (send here)\n' +
      '`.vvtext <text> | <phone/jid>` (send to someone)\n' +
      'Or reply to a message with `.vvtext`'
    );
  }

  if (!targetJid || targetJid === 'status@broadcast') {
    return reply('❌ Invalid chat target.');
  }

  if (typeof client?.relayMessage !== 'function') {
    return reply('❌ Socket does not support relayMessage().');
  }

  try {
    const userJid = client.user?.id || client.user?.jid;
    if (!userJid) throw new Error('Bot JID not available.');

    const normalizedTarget = jidNormalizedUser(targetJid);

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

    const msg = generateWAMessageFromContent(normalizedTarget, content, { userJid });

    await client.relayMessage(normalizedTarget, msg.message, {
      messageId: msg.key.id
    });

    // Confirm back in the original chat if the target was different
    if (normalizedTarget !== from) {
      await reply(`✅ View-once text sent to ${normalizedTarget.split('@')[0]}`);
    }

  } catch (err) {
    console.error('vvtext error:', err);
    await reply(`❌ Failed to send view-once text: ${err.message}`);
  }
});


keith({
  pattern: 'rvt',
  aliases: ['reveal', 'vv', 'readviewonce', 'rvo'],
  category: 'tools',
  description: 'Reveal the text inside a quoted view-once message',
  filename: __filename
}, async (from, client, conText) => {
  const { reply, quotedMsg } = conText;

  if (!quotedMsg) {
    return reply('📌 Reply to a view-once text message to reveal it.');
  }

  let extractedText = null;

  if (quotedMsg.viewOnceMessageV2?.message?.extendedTextMessage?.text) {
    extractedText = quotedMsg.viewOnceMessageV2.message.extendedTextMessage.text;
  } 
  else if (quotedMsg.viewOnceMessage?.message?.extendedTextMessage?.text) {
    extractedText = quotedMsg.viewOnceMessage.message.extendedTextMessage.text;
  }
  else if (quotedMsg.extendedTextMessage?.text) {
    extractedText = quotedMsg.extendedTextMessage.text;
  }

  if (!extractedText) {
    return reply('❌ Could not find any view-once text in the quoted message.');
  }

  return reply(extractedText);
});
