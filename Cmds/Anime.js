
const { keith } = require('../commandHandler');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://tempmail-backend.hasnaintariq142.workers.dev';
const CHECK_INBOX_URL = `${BASE_URL}/api/inbox`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Referer': 'https://tempmail.chat/',
  'Origin': 'https://tempmail.chat',
  'Content-Type': 'application/json'
};

function cleanHtmlWithLinks(htmlString) {
  if (!htmlString) return { text: '', links: [] };
  
  const $ = cheerio.load(htmlString);
  
  $('script, style, meta, link, img').remove();
  
  const links = [];
  $('a').each((i, elem) => {
    const url = $(elem).attr('href');
    const text = $(elem).text().trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      links.push({ text: text || 'Link', url });
    }
  });

  $('a').replaceWith(function() {
    const url = $(this).attr('href');
    const text = $(this).text().trim() || 'Link';
    return `\n🔗 ${text}\n   ${url}\n`;
  });
  
  let text = $.text();
  return { 
    text: text.replace(/\n\s*\n/g, '\n\n').trim(),
    links 
  };
}

async function checkInbox(token, retries = 6) {
  for (let i = 1; i <= retries; i++) {
    const res = await axios.get(CHECK_INBOX_URL, {
      params: { token: token },
      headers: HEADERS
    });

    if (res.data.success && res.data.messages && res.data.messages.length > 0) {
      return res.data.messages;
    }
    
    if (i < retries) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  return [];
}

keith({
  pattern: "tempinbox",
  aliases: ["checkinbox", "readmail"],
  category: "Tools",
  description: "Check temporary email inbox"
}, async (from, client, conText) => {
  const { q, reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  if (!q || !q.includes('@')) {
    return reply(`📌 *Check Temp Inbox*\n\n*Usage:*\n.tempinbox email@domain.com\n\n*Example:*\n.tempinbox abc123@tempmail.chat`);
  }

  try {
    await reply(`📬 Checking inbox for ${q}...`);

    const messages = await checkInbox(q, 6);

    if (!messages || messages.length === 0) {
      return reply(`📭 *No messages found*\n\nEmail: ${q}\n\n_Try again in a few seconds._`);
    }

    let text = `📬 *Inbox Messages*\n📧 *Email:* ${q}\n\n`;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const { text: msgText, links } = cleanHtmlWithLinks(msg.html_body);
      
      text += `📧 *Message ${i + 1}*\n`;
      text += `👤 *From:* ${msg.sender_name || msg.sender}\n`;
      text += `📝 *Subject:* ${msg.subject}\n`;
      text += `⏰ *Time:* ${msg.received_at}\n`;
      text += `\n${msgText.substring(0, 500)}${msgText.length > 500 ? '...' : ''}\n`;
      
      if (links.length > 0) {
        text += `\n🔗 *Links:*\n`;
        links.forEach(l => {
          text += `• ${l.url}\n`;
        });
      }
      
      text += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    if (text.length > 4000) {
      const parts = text.match(/.{1,4000}/g) || [];
      for (const part of parts) {
        await client.sendMessage(from, { text: part }, { quoted: mek });
      }
    } else {
      await client.sendMessage(from, { text }, { quoted: mek });
    }

  } catch (err) {
    console.error("tempinbox error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
