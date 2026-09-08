
const { keith } = require('../commandHandler');
const axios = require('axios');

const HTML_URL = 'https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/bubbleshooter.html';

keith({
  pattern: "bubble",
  aliases: ["bubbleshooter", "ttc", "xoxo"],
  category: "Game",
  description: "Play Tic Tac Toe against AI",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser } = conText;

  if (!isSuperUser) return reply("Owner only!");

  try {
   // await reply("🎮 Loading bubble game...");

    const response = await axios.get(HTML_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    const html = response.data;

    const content = {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {
          messageDisclaimerText: "",
          botResponseId: "bubblegame-" + Date.now()
        }
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "bubble game"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                "response_id": "tictactoe-" + Date.now(),
                "sections": [
                  {
                    "view_model": {
                      "primitive": {
                        "__typename": "GenAIaeacdsnwHtmlPrimitive",
                        "payload": html,
                        "trusted_sources": [
                          "github.com",
                          "raw.githubusercontent.com"
                        ]
                      },
                      "__typename": "GenAISingleLayoutViewModel"
                    }
                  }
                ]
              })).toString('base64')
            },
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedAiBotMessageInfo: {
                botJid: "867051314767696@bot"
              },
              forwardOrigin: 4
            }
          }
        }
      }
    };

    await client.relayMessage(from, content, {});

  } catch (err) {
    console.error("tictactoe error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});


//========================================================================================================================

//========================================================================================================================
