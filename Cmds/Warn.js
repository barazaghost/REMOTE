
const { keith } = require('../commandHandler');
const axios = require('axios');

keith({
  pattern: "gtcdd",
  aliases: ["get", "plugin"],
  description: "Fetch a command snippet from the remote repository",
  category: "owner",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("❌ You are not authorized to use this command.");
  }

  if (!q) {
    return reply("⚠️ Provide the name of the command.\n\nExample: getcmd block");
  }

  try {
    const apiUrl = 'https://api.github.com/repos/barazaghost/REMOTE/contents/Cmds';
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const files = response.data.filter(item =>
      item.type === 'file' && item.name.endsWith('.js')
    );

    for (const file of files) {
      const fileResponse = await axios.get(file.download_url);
      const content = fileResponse.data;

      const regex = new RegExp(`keith\\s*\\(\\s*{[^}]*pattern\\s*:\\s*["'\`]${q}["'\`]`, 'i');
      if (regex.test(content)) {
        const startIndex = content.search(regex);
        const snippet = content.slice(startIndex);
        const nextBlock = snippet.indexOf('keith(', 1);
        const endIndex = nextBlock !== -1 ? startIndex + nextBlock : content.length;
        const commandCode = content.slice(startIndex, endIndex).trim();

        return reply(`// From ${file.name}\n\n${commandCode}`);
      }
    }

    reply(`❌ Command *${q}* not found in the repository.`);
  } catch (err) {
    console.error("getcmd error:", err);
    reply("❌ Failed to fetch commands from the repository.");
  }
});
