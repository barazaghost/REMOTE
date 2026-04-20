
const { keith } = require('../commandHandler');
const axios = require('axios');
const cheerio = require('cheerio');

const generatorEmail = {
    api: {
        base: 'https://generator.email/',
        validate: 'check_adres_validation3.php'
    },

    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Upgrade-Insecure-Requests': '1'
    },

    _cookie: '',

    _fetch: async function(url, options, retries = 5) {
        for (let i = 0, error; i < retries; i++) {
            try {
                const fetchOptions = {
                    ...options,
                    redirect: 'manual'
                };
                if (this._cookie) {
                    fetchOptions.headers = fetchOptions.headers || {};
                    fetchOptions.headers.Cookie = this._cookie;
                }
                const res = await axios({
                    url: url,
                    method: options.method || 'GET',
                    headers: fetchOptions.headers,
                    data: options.body,
                    maxRedirects: 0,
                    validateStatus: status => status >= 200 && status < 400
                });
                
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    const match = setCookie.join('').match(/surl=([^;]+)/);
                    if (match) this._cookie = `surl=${match[1]}`;
                }
                
                if (res.status === 301 || res.status === 302) {
                    const location = res.headers.location;
                    if (location) {
                        return this._fetch(location, options, retries);
                    }
                }
                
                return options._text ? res.data : res.data;
            } catch (err) {
                error = err.message;
                if (i === retries - 1) throw new Error(error);
            }
        }
    },

    _validate: async function(username, domain) {
        try {
            const formData = new URLSearchParams();
            formData.append('usr', username);
            formData.append('dmn', domain);
            
            const response = await this._fetch(this.api.base + this.api.validate, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });
            return response;
        } catch (e) {
            return { err: e.message };
        }
    },

    _parseEmail: (email) => email?.includes('@') ? email.split('@') : null,

    generate: async function(domain = '') {
        try {
            const initUrl = domain ? this.api.base + domain : this.api.base;
            await this._fetch(initUrl, {
                headers: this.headers,
                cache: 'no-store',
                _text: 1
            });
            
            const html = await this._fetch(this.api.base, {
                headers: this.headers,
                cache: 'no-store',
                _text: 1
            });
            
            const $ = cheerio.load(html);
            const email = $('#email_ch_text').text();
            
            if (!email) return { success: false, result: 'Failed to generate email' };
            
            const [username, domainName] = this._parseEmail(email);
            const validation = await this._validate(username, domainName);
            
            return {
                success: true,
                result: {
                    email: email,
                    emailStatus: validation.status || null,
                    uptime: validation.uptime || null,
                    ...(validation.err && { error: validation.err })
                }
            };
        } catch (e) {
            return { success: false, result: e.message };
        }
    },

    validation: async function(email) {
        const parsed = this._parseEmail(email);
        if (!parsed) return { success: false, result: 'Email cannot be empty' };
        
        const [username, domain] = parsed;
        const validation = await this._validate(username, domain);
        
        return {
            success: true,
            result: {
                email: email,
                emailStatus: validation.status || null,
                uptime: validation.uptime || null,
                ...(validation.err && { error: validation.err })
            }
        };
    },

    inbox: async function(email) {
        const parsed = this._parseEmail(email);
        if (!parsed) return { success: false, result: 'Email cannot be empty' };
        
        const [username, domain] = parsed;
        const validation = await this._validate(username, domain);
        const cookie = `surl=${domain}/${username}`;
        
        let html;
        try {
            html = await this._fetch(this.api.base, {
                headers: {
                    ...this.headers,
                    Cookie: cookie
                },
                cache: 'no-store',
                _text: 1
            });
        } catch (e) {
            return {
                success: true,
                result: {
                    email: email,
                    emailStatus: validation.status,
                    uptime: validation.uptime,
                    inbox: [],
                    error: e.message
                }
            };
        }
        
        if (html.includes('Email generator is ready')) {
            return {
                success: true,
                result: {
                    email: email,
                    emailStatus: validation.status,
                    uptime: validation.uptime,
                    inbox: []
                }
            };
        }
        
        const $ = cheerio.load(html);
        const messageCount = parseInt($('#mess_number').text()) || 0;
        const inbox = [];
        
        const extractLinks = ($ctx, selector) => {
            const links = [];
            $ctx(selector + ' a').each((i, el) => {
                let href = $ctx(el).attr('href');
                if (href) {
                    if (!href.startsWith('http')) {
                        href = new URL(href, this.api.base).href;
                    }
                    links.push(href);
                }
            });
            return links;
        };
        
        if (messageCount === 1) {
            const element = $('#email-table .e7m.row');
            const spans = element.find('.e7m.col-md-9 span');
            const messageElement = element.find('.e7m.mess_bodiyy');
            const links = extractLinks($, '.e7m.mess_bodiyy');
            
            inbox.push({
                from: spans.eq(3).text().replace(/\(.*?\)/, '').trim(),
                to: spans.eq(1).text(),
                created: element.find('.e7m.tooltip').text().replace('Created: ', ''),
                subject: element.find('h1').text(),
                message: messageElement.text().trim(),
                links: links
            });
        } else if (messageCount > 1) {
            const messageLinks = $('#email-table a').map((_, a) => $(a).attr('href')).get();
            
            for (const link of messageLinks) {
                const messageHtml = await this._fetch(this.api.base + link, {
                    headers: {
                        ...this.headers,
                        Cookie: `surl=${link.replace('/', '')}`
                    },
                    cache: 'no-store',
                    _text: 1
                });
                
                const $msg = cheerio.load(messageHtml);
                const spans = $msg('.e7m.col-md-9 span');
                const messageElement = $msg('.e7m.mess_bodiyy');
                const links = extractLinks($msg, '.e7m.mess_bodiyy');
                
                inbox.push({
                    from: spans.eq(3).text().replace(/\(.*?\)/, '').trim(),
                    to: spans.eq(1).text(),
                    created: $msg('.e7m.tooltip').text().replace('Created: ', ''),
                    subject: $msg('h1').text(),
                    message: messageElement.text().trim(),
                    links: links
                });
            }
        }
        
        return {
            success: true,
            result: {
                email: email,
                emailStatus: validation.status,
                uptime: validation.uptime,
                inbox: inbox
            }
        };
    }
};

// Command: Generate email
keith({
    pattern: "genemail",
    aliases: ["tempmail", "tempemail"],
    category: "tools",
    description: "Generate temporary email"
}, async (from, client, conText) => {
    const { reply, q, isSuperUser, mek } = conText;
    
    let domain = q || '';
    
    try {
        const result = await generatorEmail.generate(domain);
        
        if (!result.success) {
            return reply(`❌ Failed to generate email: ${result.result}`);
        }
        
        const emailData = result.result;
        
        await client.sendMessage(from, {
            text: `📧 *Temporary Email Generated!*
            
*Email:* ${emailData.email}
*Status:* ${emailData.emailStatus || 'unknown'}
*Uptime:* ${emailData.uptime || 'N/A'} seconds

Use .inbox ${emailData.email} to check messages`,
            quoted: mek
        });
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// Command: Check inbox
keith({
    pattern: "inbox",
    aliases: ["checkmail", "mailbox"],
    category: "tools",
    description: "Check inbox of temporary email"
}, async (from, client, conText) => {
    const { reply, q, isSuperUser, mek } = conText;
    
    if (!q || !q.includes('@')) {
        return reply(`❌ Please provide an email address!
        
Example: .inbox example@domain.com`);
    }
    
    try {
        await reply(`📬 Checking inbox for ${q}...`);
        
        const result = await generatorEmail.inbox(q);
        
        if (!result.success) {
            return reply(`❌ Failed to check inbox: ${result.result}`);
        }
        
        const inboxData = result.result;
        
        if (!inboxData.inbox || inboxData.inbox.length === 0) {
            return await client.sendMessage(from, {
                text: `📭 *No messages found!*
                
*Email:* ${inboxData.email}
*Status:* ${inboxData.emailStatus}
*Uptime:* ${inboxData.uptime} seconds

No messages in inbox yet.`,
                quoted: mek
            });
        }
        
        let messageText = `📬 *Inbox for ${inboxData.email}*
*Status:* ${inboxData.emailStatus}
*Uptime:* ${inboxData.uptime} seconds
*Messages:* ${inboxData.inbox.length}

━━━━━━━━━━━━━━━━\n\n`;
        
        for (let i = 0; i < Math.min(inboxData.inbox.length, 5); i++) {
            const msg = inboxData.inbox[i];
            messageText += `*📨 Message ${i+1}*
*From:* ${msg.from || 'Unknown'}
*Subject:* ${msg.subject || 'No subject'}
*Date:* ${msg.created || 'Unknown'}

*Message:*
${msg.message?.substring(0, 300) || 'No content'}${msg.message?.length > 300 ? '...' : ''}

${msg.links?.length > 0 ? `*Links:*\n${msg.links.join('\n')}\n` : ''}
━━━━━━━━━━━━━━━━\n\n`;
        }
        
        if (inboxData.inbox.length > 5) {
            messageText += `\n_And ${inboxData.inbox.length - 5} more messages..._`;
        }
        
        await client.sendMessage(from, {
            text: messageText,
            quoted: mek
        });
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// Command: Validate email
keith({
    pattern: "checkmail",
    aliases: ["validatemail", "emailcheck"],
    category: "tools",
    description: "Validate temporary email status"
}, async (from, client, conText) => {
    const { reply, q, isSuperUser, mek } = conText;
    
    if (!q || !q.includes('@')) {
        return reply(`❌ Please provide an email address!
        
Example: .checkmail example@domain.com`);
    }
    
    try {
        const result = await generatorEmail.validation(q);
        
        if (!result.success) {
            return reply(`❌ Failed to validate: ${result.result}`);
        }
        
        const emailData = result.result;
        
        await client.sendMessage(from, {
            text: `✅ *Email Validation Result*
            
*Email:* ${emailData.email}
*Status:* ${emailData.emailStatus || 'unknown'}
*Uptime:* ${emailData.uptime || 'N/A'} seconds

Use .inbox ${emailData.email} to check messages`,
            quoted: mek
        });
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});



keith({
  pattern: "walink",
  aliases: ["waurl", "whatsappurl"],
  description: "Generate WhatsApp short link with message | number",
  category: "Tools",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, api } = conText;


  if (!q || !q.includes("|")) {
    return reply("📌 Usage: .walink <message> | <number>\nExample: .walink Hey | 254748387615");
  }

  try {
    const [message, number] = q.split("|").map(s => s.trim());

    if (!message || !number) return reply("❌ Provide both message and number.");
    if (!/^\d+$/.test(number)) {
      return reply("❌ Number must be digits and start with a valid country code.");
    }

    const { data } = await axios.get(
      `${api}/tools/walink?q=${encodeURIComponent(message)}&number=${number}`
    );

    if (!data?.status || !data?.result?.shortUrl) {
      return reply("❌ Failed to generate WhatsApp link.");
    }

    
    await reply(data.result.shortUrl);
  } catch (err) {
    console.error("walink command error:", err);
    reply("❌ Error generating WhatsApp link. Try again.");
  }
});
/*const { keith } = require('../commandHandler');
const axios = require('axios');*/

keith({
  pattern: "qrgenerator",
  aliases: ["qrgen", "makeqr", "qr"],
  description: "Generate QR code from text",
  category: "Tools",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, q, api } = conText;

  // Expect input like: .qrgenerator hello world
  if (!q) return reply("📌 Usage: .qrgenerator <text>");

  try {
    const { data } = await axios.get(
      `${api}/tools/qrgenerator?q=${encodeURIComponent(q)}`
    );

    if (!data?.status || !data?.result) {
      return reply("❌ Failed to generate QR code.");
    }

    // Reply with QR code image only
    await client.sendMessage(from, {
      image: { url: data.result }
    }, { quoted: mek });
  } catch (err) {
    console.error("qrgenerator command error:", err);
    reply("❌ Error generating QR code. Try again.");
  }
});
