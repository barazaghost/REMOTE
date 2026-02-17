
const { keith } = require('../commandHandler');

keith({
  pattern: "randomvideo",
  aliases: ["rvid", "randvid", "rv"],
  category: "random",
  description: "Send a random video from API"
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const videoUrl = "${api}/random/randomvideo";

    await client.sendMessage(from, {
      video: { url: videoUrl },
      caption: "🎬 Random Video",
      ptv: true
    });

  } catch (err) {
    console.error("randomvideo error:", err);
    return reply("❌ Failed to fetch random video.");
  }
});
