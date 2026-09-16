
const { keith } = require('../commandHandler');

keith({
  pattern: "inapp",
  aliases: ["signup","inappsignup"],
  category: "Tools",
  description: "Trigger in-app signup card",
  filename: __filename
}, async (from, client, { reply }) => {
  try {
    await client.sendInappSignup(from, {
      text: '📝 *Sign up in-app to continue*',
      title: '🤖 MyBot',
      subtitle: 'v1.0',
      footer: '⚡ In-app signup'
    });

  } catch (err) {
    console.error("inappsignup error:", err);
    await reply(`❌ Error: ${err.message}`);
  }
});
