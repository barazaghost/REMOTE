
const { keith } = require('../commandHandler');
const axios = require('axios');
//onst axios = require('axios');
const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
//const { keith } = require('../commandHandler');

//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
keith({
  pattern: "fifa",
  aliases: ["worldcup", "wc"],
  category: "Sports",
  description: "FIFA World Cup knockout bracket"
}, async (from, client, conText) => {
  const { mek, api } = conText;

  try {
    const res = await axios.get(`${api}/fifastandings`);
    const data = res.data;

    if (!data?.status) {
      return client.sendMessage(from, { text: "❌ FIFA data unavailable." }, { quoted: mek });
    }

    const playoff = data.result?.playoff;

    if (!playoff?.rounds?.length) {
      return client.sendMessage(from, { text: "❌ Knockout bracket not available yet." }, { quoted: mek });
    }

    const season = data.result.details?.selectedSeason || "2026";

    const stageLabels = {
      "1/16": "🔵 ROUND OF 32",
      "1/8":  "🟢 ROUND OF 16",
      "1/4":  "🟡 QUARTER-FINALS",
      "1/2":  "🟠 SEMI-FINALS",
      "final": "🏆 FINAL"
    };

    let txt = `🏆 *FIFA WORLD CUP ${season}*\n`;
    txt += `🎯 *KNOCKOUT BRACKET*\n`;

    for (const round of playoff.rounds) {
      const label = stageLabels[round.stage] || `🔘 ${round.stage.toUpperCase()}`;
      txt += `\n━━━━━━━━━━━━━━━━━\n`;
      txt += `*${label}*\n`;
      txt += `━━━━━━━━━━━━━━━━━\n`;

      for (const matchup of round.matchups) {
        const match = matchup.matches?.[0];
        const home = matchup.homeTeam || "TBD";
        const away = matchup.awayTeam || "TBD";

        if (!match || !match.status?.started) {
          const date = match?.status?.utcTime
            ? new Date(match.status.utcTime).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short"
              })
            : "TBD";
          txt += `⚽ ${home} 🆚 ${away}  _(${date})_\n`;
        } else if (match.status?.finished) {
          const hScore = match.home?.score ?? 0;
          const aScore = match.away?.score ?? 0;
          const winner = matchup.aggregatedWinner;
          txt += `✅ *${home} ${hScore} - ${aScore} ${away}*`;
          if (winner) txt += `  → *${winner}* advances`;
          txt += `\n`;
        } else {
          const hScore = match.home?.score ?? 0;
          const aScore = match.away?.score ?? 0;
          txt += `🔴 *LIVE* ${home} ${hScore} - ${aScore} ${away}\n`;
        }
      }
    }

    // Bronze Final
    const bronze = playoff.bronzeFinal;
    if (bronze?.matchups?.length) {
      txt += `\n━━━━━━━━━━━━━━━━━\n`;
      txt += `*🥉 THIRD PLACE*\n`;
      txt += `━━━━━━━━━━━━━━━━━\n`;
      const bMatch = bronze.matchups[0];
      const bHome = bMatch.homeTeam || "TBD";
      const bAway = bMatch.awayTeam || "TBD";
      const bm = bMatch.matches?.[0];
      if (bm?.status?.finished) {
        txt += `✅ *${bHome} ${bm.home?.score} - ${bm.away?.score} ${bAway}*\n`;
      } else if (bm?.status?.started) {
        txt += `🔴 *LIVE* ${bHome} ${bm.home?.score} - ${bm.away?.score} ${bAway}\n`;
      } else {
        const date = bm?.status?.utcTime
          ? new Date(bm.status.utcTime).toLocaleDateString("en-GB", {
              day: "2-digit", month: "short"
            })
          : "TBD";
        txt += `⚽ ${bHome} 🆚 ${bAway}  _(${date})_\n`;
      }
    }

    await client.sendMessage(from, { text: txt }, { quoted: mek });

  } catch (error) {
    console.error("FIFA Playoff Error:", error);
    await client.sendMessage(from, { text: "❌ Error fetching FIFA bracket." }, { quoted: mek });
  }
});
//========================================================================================================================
keith({
  pattern: "fifa2",
  aliases: ["worldcup", "wc"],
  category: "Sports",
  description: "FIFA World Cup standings & playoff bracket"
}, async (from, client, conText) => {
  const { mek, api } = conText;

  try {
    const res = await axios.get(`${api}/fifastandings`);
    const data = res.data;

    if (!data?.status) {
      return client.sendMessage(from, { text: "❌ FIFA standings unavailable." }, { quoted: mek });
    }

    const result = data.result;
    const season = result.details?.selectedSeason || "2026";
    const groups = result.table?.[0]?.data?.tables || [];
    const playoff = result.playoff;

    // ── GROUP STANDINGS ──────────────────────────────────────────
    if (!groups.length) {
      return client.sendMessage(from, { text: "❌ No standings found." }, { quoted: mek });
    }

    let txt = `🏆 *FIFA WORLD CUP ${season}*\n`;
    txt += `📊 *GROUP STANDINGS*\n`;

    groups.forEach(group => {
      const teams = group.table?.all || [];
      const groupName = group.leagueName.replace("Grp.", "Group").trim();

      txt += `\n━━━━━━━━━━━━━━━━━\n`;
      txt += `🚩 *${groupName}*\n`;
      txt += `━━━━━━━━━━━━━━━━━\n`;

      teams.forEach((team, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹";
        const gd = Number(team.goalConDiff) > 0 ? `+${team.goalConDiff}` : team.goalConDiff;
        const qual = team.qualColor === "#2AD572" ? " ✅" : team.qualColor === "#FFD908" ? " 🟡" : "";

        txt += `${medal} *${team.name}*${qual}\n`;
        txt += `   Pl:${team.played} W:${team.wins} D:${team.draws} L:${team.losses} GD:${gd} | *${team.pts} pts*\n`;
      });
    });

    txt += `\n_✅ Qualified  🟡 Possible qualification_\n`;

    // ── PLAYOFF BRACKET ──────────────────────────────────────────
    if (playoff?.rounds?.length) {
      const stageLabels = {
        "1/16": "🔵 ROUND OF 32",
        "1/8":  "🟢 ROUND OF 16",
        "1/4":  "🟡 QUARTER-FINALS",
        "1/2":  "🟠 SEMI-FINALS",
        "final":"🏆 FINAL"
      };

      txt += `\n\n━━━━━━━━━━━━━━━━━\n`;
      txt += `🎯 *KNOCKOUT BRACKET*\n`;
      txt += `━━━━━━━━━━━━━━━━━`;

      for (const round of playoff.rounds) {
        const label = stageLabels[round.stage] || `🔘 ${round.stage.toUpperCase()}`;
        txt += `\n\n*${label}*\n`;

        for (const matchup of round.matchups) {
          const match = matchup.matches?.[0];
          const home = matchup.homeTeam || "TBD";
          const away = matchup.awayTeam || "TBD";

          if (!match || !match.status?.started) {
            // Not played yet
            const date = match?.status?.utcTime
              ? new Date(match.status.utcTime).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short"
                })
              : "TBD";
            txt += `⚽ ${home} 🆚 ${away}  _(${date})_\n`;
          } else if (match.status?.finished) {
            // Finished
            const hScore = match.home?.score ?? 0;
            const aScore = match.away?.score ?? 0;
            const winner = matchup.aggregatedWinner;
            txt += `✅ *${home} ${hScore} - ${aScore} ${away}*`;
            if (winner) txt += `  → *${winner}* advances`;
            txt += `\n`;
          } else {
            // Live
            const hScore = match.home?.score ?? 0;
            const aScore = match.away?.score ?? 0;
            txt += `🔴 *LIVE* ${home} ${hScore} - ${aScore} ${away}\n`;
          }
        }
      }

      // Bronze Final
      const bronze = playoff.bronzeFinal;
      if (bronze?.matchups?.length) {
        txt += `\n*🥉 THIRD PLACE*\n`;
        const bMatch = bronze.matchups[0];
        const bHome = bMatch.homeTeam || "TBD";
        const bAway = bMatch.awayTeam || "TBD";
        const bm = bMatch.matches?.[0];
        if (bm?.status?.finished) {
          txt += `✅ *${bHome} ${bm.home?.score} - ${bm.away?.score} ${bAway}*\n`;
        } else {
          txt += `⚽ ${bHome} 🆚 ${bAway}\n`;
        }
      }
    }

    await client.sendMessage(from, { text: txt }, { quoted: mek });

  } catch (error) {
    console.error("FIFA Error:", error);
    await client.sendMessage(from, { text: "❌ Error fetching FIFA standings." }, { quoted: mek });
  }
});
//========================================================================================================================
/*
keith({
  pattern: "fifa",
  aliases: ["worldcup", "wc"],
  category: "Sports",
  description: "FIFA World Cup standings"
}, async (from, client, conText) => {
  const { mek, api } = conText;

  try {
    const res = await axios.get(`${api}/fifastandings`);
    const data = res.data;

    if (!data?.status) {
      return client.sendMessage(
        from,
        { text: "❌ FIFA standings unavailable." },
        { quoted: mek }
      );
    }

    const season = data.result.details?.selectedSeason || "2026";
    const groups = data.result.table?.[0]?.data?.tables || [];

    if (!groups.length) {
      return client.sendMessage(
        from,
        { text: "❌ No standings found." },
        { quoted: mek }
      );
    }

    let txt = `🏆 *FIFA WORLD CUP ${season}*\n`;
    txt += `📊 *GROUP STANDINGS*\n`;

    groups.forEach(group => {
      const teams = group.table?.all || [];

      txt += `\n━━━━━━━━━━━━━━━━━\n`;
      txt += `🚩 *${group.leagueName.replace("Grp.", "Group").trim()}*\n`;
      txt += `━━━━━━━━━━━━━━━━━\n`;

      teams.forEach((team, index) => {
        let medal = "🔹";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";

        const gd =
          Number(team.goalConDiff) > 0
            ? `+${team.goalConDiff}`
            : team.goalConDiff;

        txt += `${medal} *${team.name || team.shortName}*\n`;
        txt += `   Pl:${team.played} W:${team.wins} D:${team.draws} L:${team.losses} GD:${gd} | *${team.pts} pts*\n`;
      });
    });

    await client.sendMessage(
      from,
      { text: txt },
      { quoted: mek }
    );

  } catch (error) {
    console.error("FIFA Error:", error);

    await client.sendMessage(
      from,
      { text: "❌ Error fetching FIFA standings." },
      { quoted: mek }
    );
  }
});*/




//========================================================================================================================

keith({
  pattern: "surebet",
  aliases: ["bettips", "odds", "predict", "bet", "sureodds"],
  description: "Get betting tips and odds",
  category: "Sports",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, botname, api } = conText;

  try {
    const { data } = await axios.get(`${api}/bet`);
    if (!data?.status || !data?.result?.length) {
      return reply("❌ No betting tips available right now.");
    }

    let txt = `🎲 *${botname} Betting Tips & Odds*\n\n`;

    data.result.forEach((match, i) => {
      txt += `*${i + 1}. ${match.match}*\n`;
      txt += `League: ${match.league}\n`;
      txt += `Time: ${match.time}\n\n`;

      if (match.predictions?.fulltime) {
        txt += `Fulltime Odds:\n`;
        txt += `  🏠 Home: ${match.predictions.fulltime.home}%\n`;
        txt += `  🤝 Draw: ${match.predictions.fulltime.draw}%\n`;
        txt += `  🚀 Away: ${match.predictions.fulltime.away}%\n`;
      }

      if (match.predictions?.over_2_5) {
        txt += `Over 2.5 Goals:\n`;
        txt += `  ✅ Yes: ${match.predictions.over_2_5.yes}%\n`;
        txt += `  ❌ No: ${match.predictions.over_2_5.no}%\n`;
      }

      if (match.predictions?.bothTeamToScore) {
        txt += `Both Teams To Score:\n`;
        txt += `  ✅ Yes: ${match.predictions.bothTeamToScore.yes}%\n`;
      }

      if (typeof match.predictions?.value_bets !== "undefined") {
        txt += `Value Bets: ${match.predictions.value_bets}\n`;
      }

      txt += `\n──────────────────────\n\n`;
    });

    await client.sendMessage(from, { text: txt }, { quoted: mek });
  } catch (err) {
    console.error("Bet command error:", err);
    reply("❌ Failed to fetch betting tips. Try again later.");
  }
});
//========================================================================================================================

keith({
  pattern: "livescore",
  aliases: ["live", "score", "fixtures"],
  description: "Get live, finished, or upcoming football matches",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, timezone, api } = conText;

  const caption = `╭═════════════════⊷
║  ⚽ *Football Scores* ⚽
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗔𝗬 𝗪𝗜𝗧𝗛 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Live Matches 🔴
║ 2. Finished Matches ✅
║ 3. Upcoming Matches ⏰
╰═════════════════⊷`;

  const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  client.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply || chatId !== from) return;

    const choice = responseText.trim();
    
    const optionMap = {
      "1": { name: "Live", emoji: "🔴" },
      "2": { name: "Finished", emoji: "✅" },
      "3": { name: "Upcoming", emoji: "⏰" }
    };

    if (!optionMap[choice]) {
      return client.sendMessage(chatId, {
        text: "❌ Invalid option. Reply with 1, 2, or 3.",
        quoted: msg
      });
    }

    const selected = optionMap[choice];

    try {
      await client.sendMessage(chatId, { react: { text: selected.emoji, key: msg.key } });

      // Fetch all matches
      const res = await axios.get(`${api}/livescore`);
      const data = res.data;

      if (!data.status || !data.result || !data.result.games) {
        return client.sendMessage(chatId, {
          text: `❌ No match data available at the moment.`,
          quoted: msg
        });
      }

      const games = Object.values(data.result.games);
      
      // Get user's timezone from context or default
      const userTimeZone = timezone || "Africa/Nairobi";
      
      // Get current time in user's timezone
      const now = new Date();
      const currentUserTimeStr = now.toLocaleTimeString("en-US", {
        timeZone: userTimeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      });
      
      // Filter matches based on status
      let filteredGames = [];

      games.forEach(game => {
        const matchStatus = game.R?.st || ""; // Get status from R.st
        
        // Convert match time to user's timezone
        const userMatchTime = convertToUserTime(game.tm, game.dt, userTimeZone);
        
        // Categorize based on status (following HTML logic)
        let category = "";
        
        if (matchStatus === '1T' || matchStatus === '2T' || matchStatus === 'HT') {
          category = "live";
        } else if (matchStatus === 'FT' || matchStatus === 'Pen') {
          category = "finished";
        } else if (matchStatus === '' || matchStatus === 'Pst' || matchStatus === 'Canc') {
          category = "upcoming";
        }
        
        if (category && (
          (choice === "1" && category === "live") ||
          (choice === "2" && category === "finished") ||
          (choice === "3" && category === "upcoming")
        )) {
          filteredGames.push({
            ...game,
            category,
            userMatchTime: userMatchTime ? userMatchTime.time : game.tm,
            userMatchDate: userMatchTime ? userMatchTime.date : game.dt
          });
        }
      });

      if (filteredGames.length === 0) {
        return client.sendMessage(chatId, {
          text: `⚽ *${selected.name} Matches*\n\nNo ${selected.name.toLowerCase()} matches found at the moment.`,
          quoted: msg
        });
      }

      // Group by date
      const matchesByDate = {};
      
      filteredGames.forEach(game => {
        const date = game.userMatchDate || game.dt || "Today";
        
        if (!matchesByDate[date]) {
          matchesByDate[date] = [];
        }
        
        matchesByDate[date].push(game);
      });

      // Create formatted output
      let output = `⚽ *${selected.name} Matches* ${selected.emoji}\n`;
      output += `🌍 Timezone: ${userTimeZone}\n`;
      output += `🕐 Current Time: ${currentUserTimeStr}\n\n`;
      
      let totalMatches = 0;
      
      Object.entries(matchesByDate).forEach(([date, dateGames]) => {
        output += `📅 *${date}*\n`;
        output += "─".repeat(30) + "\n";
        
        dateGames.forEach(game => {
          const status = getMatchDisplay(game);
          const score = getScoreDisplay(game);
          
          output += `${status} *${game.p1} vs ${game.p2}*\n`;
          output += `   ${score}\n`;
          
          // Show converted user time
          if (game.userMatchTime) {
            output += `   🕒 ${game.userMatchTime}`;
            
            // Add match status info
            const statusText = getMatchStatusText(game.R?.st);
            if (statusText) {
              output += ` (${statusText})`;
            }
          } else if (game.tm) {
            output += `   🕒 ${game.tm}`;
          }
          
          output += "\n\n";
          totalMatches++;
        });
      });

      output += `📊 Total: ${totalMatches} match(es)`;

      await client.sendMessage(chatId, { text: output }, { quoted: msg });

    } catch (err) {
      console.error("livescore error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} matches: ${err.message}`,
        quoted: msg
      });
    }
  });
});

// Helper functions
function convertToUserTime(timeStr, dateStr, userTimeZone) {
  if (!timeStr || !dateStr) return null;
  
  try {
    // Parse the API date and time (assume it's in UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create UTC date
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    
    // Convert to user's timezone
    const userDateStr = utcDate.toLocaleDateString("en-US", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    
    const userTimeStr = utcDate.toLocaleTimeString("en-US", {
      timeZone: userTimeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    });
    
    // Format date back to YYYY-MM-DD format
    const [userMonth, userDay, userYear] = userDateStr.split('/');
    const formattedDate = `${userYear}-${userMonth.padStart(2, '0')}-${userDay.padStart(2, '0')}`;
    
    return {
      date: formattedDate,
      time: userTimeStr
    };
  } catch (e) {
    console.error("Time conversion error:", e);
    return null;
  }
}

function getMatchDisplay(game) {
  const status = game.R?.st || "";
  
  if (status === 'HT') return "⏸️";
  if (status === 'FT' || status === 'Pen') return "✅";
  if (status === '1T' || status === '2T') return "🔴";
  
  return game.category === "upcoming" ? "⏰" : "⚽";
}

function getMatchStatusText(status) {
  const statusMap = {
    '': 'Not Started',
    'FT': 'Full Time',
    '1T': 'First Half',
    '2T': 'Second Half',
    'HT': 'Half Time',
    'Pst': 'Postponed',
    'Canc': 'Cancelled',
    'Pen': 'Penalties'
  };
  
  return statusMap[status] || status;
}

function getScoreDisplay(game) {
  if (game.R && game.R.r1 !== undefined && game.R.r2 !== undefined) {
    return `📊 ${game.R.r1} - ${game.R.r2}`;
  }
  return "📊 0 - 0";
}

//========================================================================================================================
//========================================================================================================================

// Helper: convert timestamp to readable date
function formatDate(ts) {
  try {
    const d = new Date(Number(ts));
    return d.toDateString(); // e.g. "Fri Dec 05 2025"
  } catch {
    return "Unknown Date";
  }
}

keith({
  pattern: "sportnews",
  aliases: ["footballnews", "soccernews"],
  category: "sports",
  description: "Get latest football news",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, api } = conText;

  try {
    const apiUrl = `${api}/football/news`;
    const res = await axios.get(apiUrl, { timeout: 100000 });
    const items = res.data?.result?.data?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const news = items.slice(0, 8); // limit to 8 cards
    const cards = await Promise.all(news.map(async (item) => ({
      header: {
        title: `📰 ${item.title}`,
        hasMediaAttachment: true,
        imageMessage: (await generateWAMessageContent({ image: { url: item.cover?.url } }, {
          upload: client.waUploadToServer
        })).imageMessage
      },
      body: {
        text: `${item.summary}`
      },
      footer: { text: formatDate(item.createdAt) },
      nativeFlowMessage: {
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "🔗 Read More",
              url: "https://keithsite.vercel.app/sports"
            })
          },
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Link",
              copy_code: "https://keithsite.vercel.app/sports"
            })
          }
        ]
      }
    })));

    const message = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: { text: `⚽ Latest Football News` },
            footer: { text: `📂 Showing ${news.length} stories` },
            carouselMessage: { cards }
          }
        }
      }
    }, { quoted: mek });

    await client.relayMessage(from, message.message, { messageId: message.key.id });

  } catch (err) {
    console.error("sportnews command error:", err);
  }
});
//========================================================================================================================


keith({
  pattern: "topscorers",
  aliases: ["scorers", "goals"],
  description: "View top goal scorers across major football leagues",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, api } = conText;

  const caption = `╭═════════════════⊷
║  ⚽ *Top Scorers* ⚽
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  client.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: `${api}/epl/scorers` },
      "2": { name: "Bundesliga", url: `${api}/bundesliga/scorers` },
      "3": { name: "La Liga", url: `${api}/laliga/scorers` },
      "4": { name: "Ligue 1", url: `${api}/ligue1/scorers` },
      "5": { name: "Serie A", url: `${api}/seriea/scorers` },
      "6": { name: "UEFA Champions League", url: `${api}/ucl/scorers` },
      "7": { name: "FIFA International", url: `${api}/fifa/scorers` },
      "8": { name: "UEFA Euro", url: `${api}/euros/scorers` }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return client.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await client.sendMessage(chatId, { react: { text: "⚽", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.topScorers)) {
        return client.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} scorers.`,
          quoted: msg
        });
      }

      const scorers = data.result.topScorers.map(scorer => {
        let medal = "";
        if (scorer.rank === 1) medal = "🥇";
        else if (scorer.rank === 2) medal = "🥈";
        else if (scorer.rank === 3) medal = "🥉";

        return `${medal} *${scorer.rank}. ${scorer.player}* (${scorer.team})\n` +
               `⚽ Goals: ${scorer.goals} | 🎯 Assists: ${scorer.assists}\n` +
               `🎯 Penalties: ${scorer.penalties}`;
      }).join("\n\n");

      const caption = `📊 *Top Scorers – ${data.result.competition}*\n\n${scorers}`;

      await client.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("topscorers error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} scorers: ${err.message}`,
        quoted: msg
      });
    }
  });
});
//========================================================================================================================

keith({
  pattern: "standings",
  aliases: ["leaguetable", "league"],
  description: "View current league standings across major competitions",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, api } = conText;

  const caption = `╭═════════════════⊷
║  📊 *League Standings* 📊
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  client.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: `${api}/epl/standings` },
      "2": { name: "Bundesliga", url: `${api}/bundesliga/standings` },
      "3": { name: "La Liga", url: `${api}/laliga/standings` },
      "4": { name: "Ligue 1", url: `${api}/ligue1/standings` },
      "5": { name: "Serie A", url: `${api}/seriea/standings` },
      "6": { name: "UEFA Champions League", url: `${api}/ucl/standings` },
      "7": { name: "FIFA International", url: `${api}/fifa/standings` },
      "8": { name: "UEFA Euro", url: `${api}/euros/standings` }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return client.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await client.sendMessage(chatId, { react: { text: "📊", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.standings)) {
        return client.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} standings.`,
          quoted: msg
        });
      }

      const standings = data.result.standings.map(team => {
        let tag = "🧱"; // mid-table default
        if (team.position <= 4) tag = "🏆"; // Champions League
        else if (team.position === 5 || team.position === 6) tag = "🥈"; // Europa League
        else if (team.position >= 18) tag = "⚠️"; // Relegation

        return `${tag} *${team.position}. ${team.team}*\n` +
               `Played: ${team.played} | W:${team.won} D:${team.draw} L:${team.lost}\n` +
               `Points: ${team.points} | GD: ${team.goalDifference}`;
      }).join("\n\n");

      const caption = `📊 *${data.result.competition} Standings*\n\n${standings}`;

      await client.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("standings error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} standings: ${err.message}`,
        quoted: msg
      });
    }
  });
});
//========================================================================================================================

keith({
  pattern: "upcomingmatches",
  aliases: ["fixtures", "upcoming", "nextgames"],
  description: "View upcoming matches across major football leagues",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply, api } = conText;

  const caption = `╭═════════════════⊷
║  📅 *Upcoming Matches* 📅
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  client.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: `${api}/epl/upcomingmatches` },
      "2": { name: "Bundesliga", url: `${api}/bundesliga/upcomingmatches` },
      "3": { name: "La Liga", url: `${api}/laliga/upcomingmatches` },
      "4": { name: "Ligue 1", url: `${api}/ligue1/upcomingmatches` },
      "5": { name: "Serie A", url: `${api}/seriea/upcomingmatches` },
      "6": { name: "UEFA Champions League", url: `${api}/ucl/upcomingmatches` },
      "7": { name: "FIFA International", url: `${api}/fifa/upcomingmatches` },
      "8": { name: "UEFA Euro", url: `${api}/euros/upcomingmatches` }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return client.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await client.sendMessage(chatId, { react: { text: "📅", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.upcomingMatches)) {
        return client.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} fixtures.`,
          quoted: msg
        });
      }

      const fixtures = data.result.upcomingMatches.map(match =>
        `📅 *Matchday ${match.matchday}*\n🕒 ${match.date}\n🏟️ ${match.homeTeam} vs ${match.awayTeam}`
      ).join("\n\n");

      const caption = `🏆 *Upcoming ${selected.name} Matches*\n\n${fixtures}`;

      await client.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("upcomingmatches error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} schedule: ${err.message}`,
        quoted: msg
      });
    }
  });
});


      
//========================================================================================================================

keith({
  pattern: "gamehistory",
  aliases: ["matchevents", "gameevents"],
  description: "View historical or upcoming game events between teams",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q || !q.includes("vs")) {
    return reply("❌ Provide a valid match query.\n\nExample: gamehistory Arsenal vs Chelsea");
  }

  try {
    const res = await axios.get(`${api}/sport/gameevents?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No game events found for that matchup.");
    }

    for (const match of data.result.slice(0, 3)) {
      const { teams, league, venue, dateTime, status, season, media } = match;
      const caption = `⚽ *${match.match}*\n\n` +
        `🏆 League: ${league.name} (${season})\n` +
        `📅 Date: ${dateTime.date} at ${dateTime.time}\n` +
        `📍 Venue: ${venue.name || "—"} (${venue.country || "—"})\n` +
        `🔢 Round: ${match.round}\n` +
        `📶 Status: ${status}\n\n` +
        `🔴 ${teams.home.name}: ${teams.home.score ?? "—"}\n` +
        `🔵 ${teams.away.name}: ${teams.away.score ?? "—"}\n\n` +
        (match.media.video ? `▶️ Video: ${match.media.video}` : "");

      const mediaMsg = match.media?.poster || match.media?.thumb
        ? { image: { url: match.media.poster || match.media.thumb }, caption }
        : { text: caption };

      await client.sendMessage(from, mediaMsg, { quoted: mek });
    }
  } catch (err) {
    console.error("gamehistory error:", err);
    reply("❌ Error fetching game history: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "venuesearch",
  aliases: ["venue", "stadium"],
  description: "Search for sports venues by name",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a venue name.\n\nExample: venuesearch Emirates");

  try {
    const res = await axios.get(`${api}/sport/venuesearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching venues found. Try a different name.");
    }

    for (const venue of data.result.slice(0, 3)) {
      const caption = `🏟️ *${venue.name}*\n\n` +
        `📛 Alternate Name: ${venue.alternateName || "—"}\n` +
        `⚽ Sport: ${venue.sport || "—"}\n` +
        `📍 Location: ${venue.location || "—"}\n` +
        `🌍 Country: ${venue.country || "—"}\n` +
        `📅 Built: ${venue.yearBuilt || "—"}\n` +
        `👥 Capacity: ${venue.capacity || "—"}\n` +
        `🕒 Timezone: ${venue.timezone || "—"}\n\n` +
        `📝 *Description*\n${venue.description?.split("\r\n").slice(0, 2).join("\n") || "—"}`;

      const media = venue.media?.thumb
        ? { image: { url: venue.media.thumb }, caption }
        : { text: caption };

      await client.sendMessage(from, media, { quoted: mek });
    }
  } catch (err) {
    console.error("venuesearch error:", err);
    reply("❌ Error fetching venue data: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "teamsearch",
  aliases: ["team", "club"],
  description: "Search for sports teams by name",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a team name.\n\nExample: teamsearch Arsenal");

  try {
    const res = await axios.get(`${api}/sport/teamsearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching teams found. Try a different name.");
    }

    const team = data.result[0];
    const caption = `🏟️ *${team.name}*\n\n` +
      `📛 Alternate Names: ${team.alternateName}\n` +
      `📅 Formed: ${team.formedYear}\n` +
      `⚽ Sport: ${team.sport}\n` +
      `🏆 League: ${team.league}\n` +
      `📍 Location: ${team.location}, ${team.country}\n` +
      `🚻 Gender: ${team.gender}\n` +
      `🏟️ Stadium: ${team.stadium} (${team.stadiumCapacity} capacity)\n\n` +
      `🌐 *Social Links*\n` +
      `🔗 Website: ${team.social.website}\n` +
      `📘 Facebook: ${team.social.facebook}\n` +
      `🐦 Twitter: ${team.social.twitter}\n` +
      `📸 Instagram: ${team.social.instagram}\n` +
      `📺 YouTube: ${team.social.youtube}\n\n` +
      `📝 *Description*\n${team.description.split("\r\n").slice(0, 3).join("\n")}`;

    await client.sendMessage(from, {
      image: { url: team.badges.large },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("teamsearch error:", err);
    reply("❌ Error fetching team data: " + err.message);
  }
});
//========================================================================================================================
//
keith({
  pattern: "playersearch",
  aliases: ["player", "athlete"],
  description: "Search for sports players by name",
  category: "sports",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a player name.\n\nExample: playersearch Bukayo Saka");

  try {
    const res = await axios.get(`${api}/sport/playersearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching players found. Try a different name.");
    }

    for (const player of data.result.slice(0, 3)) {
      const caption = `🏅 *${player.name}*\n\n` +
        `🏟️ Team: ${player.team}\n` +
        `⚽ Sport: ${player.sport}\n` +
        `🌍 Nationality: ${player.nationality}\n` +
        `🎂 Birthdate: ${player.birthDate}\n` +
        `📌 Position: ${player.position}\n` +
        `📶 Status: ${player.status}\n` +
        `🚻 Gender: ${player.gender}`;

      const media = player.thumbnail
        ? { image: { url: player.thumbnail }, caption }
        : { text: caption };

      await client.sendMessage(from, media, { quoted: mek });
    }
  } catch (err) {
    console.error("playersearch error:", err);
    reply("❌ Error fetching player data: " + err.message);
  }
});
