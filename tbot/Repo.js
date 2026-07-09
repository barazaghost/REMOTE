
const { keith } = require('../commandHandler');
const axios = require('axios');

keith({
  pattern: "repo",
  aliases: ["script", "sc"],   // includes both aliases
  category: "utility",
  description: "Fetch repository info from GitHub",
  cooldown: 5
},

async (msg, bot, context) => {
  // destructure pushName and sourceUrl directly from context
  const { chatId, pushName, sourceUrl } = context;

  // add sourceUrl into context just like pushName
  context.sourceUrl = "https://api.github.com/repos/kkeizza/T-BOT";

  await bot.sendChatAction(chatId, 'typing');

  // use the fixed GitHub API link
  const response = await axios.get(context.sourceUrl, { timeout: 30000 });
  const repo = response.data;

  // Helper to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const info = `
*Hello ,,,👋 ${pushName}*
This is Keith Md — the best Telegram bot developed by Keith. Fork and give a star 🌟 to my repo!
╭───────────────────
│✞ *Stars:* ${repo.stargazers_count}
│✞ *Forks:* ${repo.forks_count}
│✞ *Release Date:* ${formatDate(repo.created_at)}
│✞ *Last Update:* ${formatDate(repo.updated_at)}
│✞ *Owner:* ${repo.owner.login}
│✞ *Language:* ${repo.language || "N/A"}
╰───────────────────
  `;

  await bot.sendMessage(chatId, info, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⭐ Star Repository", url: repo.html_url },
          { text: "📖 Source URL", url: sourceUrl }
        ],
        [
          { text: "🌐 Visit Website", url: repo.homepage || repo.html_url }
        ]
      ]
    },
    parse_mode: "Markdown"
  });
});
