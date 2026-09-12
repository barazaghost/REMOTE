const { keith } = require('../commandHandler');
const axios = require('axios');

async function sendGame(from, client, mek, url, label, idPrefix, trusted = ["github.com","raw.githubusercontent.com"]) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 30000
  });
  const html = response.data;
  const responseId = `${idPrefix}-${Date.now()}`;

  const content = {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: { messageDisclaimerText: "", botResponseId: responseId }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: label }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify({
              response_id: responseId,
              sections: [{
                view_model: {
                  primitive: {
                    __typename: "GenAIaeacdsnwHtmlPrimitive",
                    payload: html,
                    trusted_sources: trusted
                  },
                  __typename: "GenAISingleLayoutViewModel"
                }
              }]
            })).toString('base64')
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
            forwardOrigin: 4
          }
        }
      }
    }
  };

  await client.relayMessage(from, content, {});
}

// Bubble Shooter
keith({
  pattern: "bubble",
  aliases: ["bubbleshooter","bubblegame","shootbubble"],
  category: "Game",
  description: "Play Bubble Shooter",
  filename: __filename
}, async (from, client, { mek, reply }) => {
  try { await sendGame(from, client, mek, 
    "https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/bubbleshooter.html", 
    "🎮 Bubble Shooter", "bubblegame"); 
  } catch (err) { reply(`❌ Error: ${err.message}`); }
});

// Tic Tac Toe
keith({
  pattern: "tictactoe",
  aliases: ["ttt","ttc","xoxo"],
  category: "Game",
  description: "Play Tic Tac Toe",
  filename: __filename
}, async (from, client, { mek, reply }) => {
  try { await sendGame(from, client, mek, 
    "https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/tictactoe.html", 
    "🎮 Tic Tac Toe", "tictactoe"); 
  } catch (err) { reply(`❌ Error: ${err.message}`); }
});

// Hill Climber
keith({
  pattern: "hillclimber",
  aliases: ["hillclimb","hcr","climber"],
  category: "Game",
  description: "Play Hill Climber Racing",
  filename: __filename
}, async (from, client, { mek, reply }) => {
  try { await sendGame(from, client, mek, 
    "https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/games/hillclimber.html", 
    "🏔️ Hill Climber", "hillclimber", ["github.com","raw.githubusercontent.com","keithkeizzah.site"]); 
  } catch (err) { reply(`❌ Error: ${err.message}`); }
});

// Turbo Race
keith({
  pattern: "turborace",
  aliases: ["turbo","carrace","racingcar"],
  category: "Game",
  description: "Play Turbo Race",
  filename: __filename
}, async (from, client, { mek, reply }) => {
  try { await sendGame(from, client, mek, 
    "https://github.com/kkeizzahB/RAW/raw/refs/heads/main/Cmds/games/turborace.html", 
    "🏎️ Turbo Race", "turbo", ["github.com","raw.githubusercontent.com","keithkeizzah.site"]); 
  } catch (err) { reply(`❌ Error: ${err.message}`); }
});
