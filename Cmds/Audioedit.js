
const { keith } = require('../commandHandler');
const sPR = (await import("#FuncSPR")).default;

keith({
  pattern: "sprpp",
  aliases: ["editpp","ppedit"],
  category: "Tools",
  description: "Edit profile picture using SPR",
  filename: __filename
}, async (from, client, { reply, sender }) => {
  try {
    await sPR(
      { from, client }, // pass your base context
      sender,           // target JID
      [
        [
          { conversation: "ignored for spr-pp" },
          { mode: "spr-pp", user: [], devMode: "everyone" }
        ]
      ],
      {}
    );
    await reply("✅ SPR profile picture edit triggered.");
  } catch (err) {
    console.error("sprpp error:", err);
    await reply(`❌ Error: ${err.message}`);
  }
});
