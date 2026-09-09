
const { keith } = require('../commandHandler');
const axios = require('axios');

const B_URL = 'https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/bubbleshooter.html';

keith({
  pattern: "bubble",
  aliases: ["bubbleshooter", "bubblegame", "shootbubble"],
  category: "Game",
  description: "Play Tic Tac Toe against AI",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser } = conText;

  

  try {
 

    const response = await axios.get(B_URL, {
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


const TTT_URL = 'https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/tictactoe.html';

keith({
  pattern: "tictactoe",
  aliases: ["ttt", "ttc", "xoxo"],
  category: "Game",
  description: "Play Tic Tac Toe against AI",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser } = conText;

  

  try {
    

    const response = await axios.get(TTT_URL, {
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
          botResponseId: "tictactoe-" + Date.now()
        }
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "🎮 Tic Tac Toe"
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


const HILL_URL = 'https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/hillclimber.html';

keith({
  pattern: "hillclimber",
  aliases: ["hillclimb", "hcr", "climber"],
  category: "Game",
  description: "Play Hill Climber Racing game",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser } = conText;

  

  try {
    

    const response = await axios.get(HILL_URL, {
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
          botResponseId: "hillclimber-" + Date.now()
        }
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "🏔️ Hill Climber"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                "response_id": "hillclimber-" + Date.now(),
                "sections": [
                  {
                    "view_model": {
                      "primitive": {
                        "__typename": "GenAIaeacdsnwHtmlPrimitive",
                        "payload": html,
                        "trusted_sources": [
                          "github.com",
                          "raw.githubusercontent.com",
                          "keithkeizzah.site"
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
    console.error("hillclimber error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});

const TURBO_URL = 'https://github.com/kkeizzahB/RAW/raw/refs/heads/main/Cmds/games/turborace.html';

keith({
  pattern: "turborace",
  aliases: ["turbo", "carrace", "racingcar"],
  category: "Game",
  description: "Play Hill Climber Racing game",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, isSuperUser } = conText;

  

  try {
    

    const response = await axios.get(TURBO_URL, {
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
          botResponseId: "turbo-" + Date.now()
        }
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "turbo race"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                "response_id": "turbo-" + Date.now(),
                "sections": [
                  {
                    "view_model": {
                      "primitive": {
                        "__typename": "GenAIaeacdsnwHtmlPrimitive",
                        "payload": html,
                        "trusted_sources": [
                          "github.com",
                          "raw.githubusercontent.com",
                          "keithkeizzah.site"
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
    console.error("turbo error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});


