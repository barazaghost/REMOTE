const { keith } = require('../commandHandler');
const axios = require('axios');

// ============================================================
// STANDINGS COMMAND WITH TABLE
// ============================================================
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

      // Prepare table data - CONVERT ALL VALUES TO STRINGS
      const tableHeaders = ['#', 'Team', 'P', 'W', 'D', 'L', 'GD', 'Pts'];
      const tableRows = data.result.standings.map(team => [
        String(team.position || ''),
        String(team.team || ''),
        String(team.played || ''),
        String(team.won || ''),
        String(team.draw || ''),
        String(team.lost || ''),
        String(team.goalDifference || ''),
        String(team.points || '')
      ]);

      // Send as rich message with table
      await client.sendAIRich(from, [
        { type: 'text', text: `📊 *${data.result.competition} Standings*\n\nCurrent league standings.` },
        { type: 'table', table: [tableHeaders, ...tableRows] },
        { type: 'tip', text: `💡 *Update:* Standings as of ${new Date().toLocaleDateString()}` },
        { type: 'suggest', suggestion: ['Show top scorers', 'View fixtures', 'Another league'] }
      ], {
        title: '📊 League Standings',
        footer: '⚡ Data provided by Keith-MD Bot'
      });

    } catch (err) {
      console.error("standings error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} standings: ${err.message}`,
        quoted: msg
      });
    }
  });
});

// ============================================================
// TOPSCORERS COMMAND WITH TABLE
// ============================================================
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

      const scorers = data.result.topScorers;

      // CONVERT ALL VALUES TO STRINGS
      const tableHeaders = ['#', 'Player', 'Team', 'Goals', 'Assists', 'Penalties'];
      const tableRows = scorers.map(scorer => [
        String(scorer.rank || ''),
        String(scorer.player || ''),
        String(scorer.team || ''),
        String(scorer.goals || ''),
        String(scorer.assists || ''),
        String(scorer.penalties || '')
      ]);

      await client.sendAIRich(from, [
        { type: 'text', text: `⚽ *Top Scorers - ${data.result.competition}*\n\nTop goal scorers in the competition.` },
        { type: 'table', table: [tableHeaders, ...tableRows] },
        { type: 'tip', text: `💡 *Top Scorer:* ${scorers[0]?.player} (${scorers[0]?.goals} goals)` },
        { type: 'suggest', suggestion: ['Show standings', 'View fixtures', 'Another league'] }
      ], {
        title: '⚽ Top Scorers',
        footer: '⚡ Data provided by Keith-MD Bot'
      });

    } catch (err) {
      console.error("topscorers error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} scorers: ${err.message}`,
        quoted: msg
      });
    }
  });
});

// ============================================================
// UPCOMING MATCHES COMMAND WITH TABLE
// ============================================================
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

      const matches = data.result.upcomingMatches;

      // Prepare table data - CONVERT ALL VALUES TO STRINGS
      const tableHeaders = ['#', 'Matchday', 'Date', 'Home', 'Away'];
      const tableRows = matches.map((match, index) => [
        String(index + 1),
        String(match.matchday || ''),
        String(match.date || ''),
        String(match.homeTeam || ''),
        String(match.awayTeam || '')
      ]);

      await client.sendAIRich(from, [
        { type: 'text', text: `🏆 *Upcoming ${selected.name} Matches*\n\nNext matches scheduled.` },
        { type: 'table', table: [tableHeaders, ...tableRows] },
        { type: 'tip', text: `📅 *Total:* ${matches.length} matches scheduled` },
        { type: 'suggest', suggestion: ['Show standings', 'Show top scorers', 'Another league'] }
      ], {
        title: '📅 Upcoming Matches',
        footer: '⚡ Data provided by Keith-MD Bot'
      });

    } catch (err) {
      console.error("upcomingmatches error:", err);
      await client.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} schedule: ${err.message}`,
        quoted: msg
      });
    }
  });
});
