const { keith } = require('../commandHandler');
const axios = require('axios');
const fs = require('fs-extra');
const { unlink } = require('fs').promises;
const { exec } = require('child_process');

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Convert GIF buffer to MP4 buffer
async function gifToVideoBuffer(image) {
  const filename = `gif-${Date.now()}`;
  await fs.writeFileSync(`./${filename}.gif`, image);

  exec(`ffmpeg -i ./${filename}.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ./${filename}.mp4`);

  await sleep(4000); // wait for ffmpeg to finish

  const buffer = await fs.readFileSync(`./${filename}.mp4`);
  Promise.all([unlink(`./${filename}.gif`), unlink(`./${filename}.mp4`)]).catch(() => {});
  return buffer;
}

// Factory to generate reaction commands
function makeReactionCommand(name, emoji) {
  keith({
    pattern: name,
    aliases: [],
    category: "Reaction",
    description: `Send ${name} reaction`,
    filename: __filename
  }, async (from, client, conText) => {
    const { mek, reply, quotedUser, sender } = conText;

    try {
      const res = await axios.get(`https://api.waifu.pics/sfw/${name}`);
      const gifUrl = res.data.url;

      const gifResp = await axios.get(gifUrl, { responseType: 'arraybuffer' });
      const gifBuffer = gifResp.data;

      const videoBuffer = await gifToVideoBuffer(gifBuffer);

      let caption;
      let mentions;

      if (quotedUser) {
        caption = `@${sender.split('@')[0]} ${name} @${quotedUser.split('@')[0]}`;
        mentions = [sender, quotedUser];
      } else {
        caption = `@${sender.split('@')[0]} ${name} everyone`;
        mentions = [sender];
      }

      await client.sendMessage(from, {
        video: videoBuffer,
        gifPlayback: true,
        caption,
        mentions
      }, { quoted: mek });

    } catch (err) {
      console.error("Reaction error:", err);
      await reply("❌ Failed to fetch reaction: " + err.message);
    }
  });
}

// Register reactions
makeReactionCommand("bully", "👊");
makeReactionCommand("cuddle", "🤗");
makeReactionCommand("cry", "😢");
makeReactionCommand("hug", "😊");
makeReactionCommand("awoo", "🐺");
makeReactionCommand("kiss", "😘");
makeReactionCommand("lick", "👅");
makeReactionCommand("pat", "👋");
makeReactionCommand("smug", "😏");
makeReactionCommand("bonk", "🔨");
makeReactionCommand("yeet", "🚀");
makeReactionCommand("blush", "😊");
makeReactionCommand("smile", "😄");
makeReactionCommand("wave", "👋");
makeReactionCommand("highfive", "✋");
makeReactionCommand("handhold", "🤝");
makeReactionCommand("nom", "👅");
makeReactionCommand("bite", "🦷");
makeReactionCommand("glomp", "🤗");
makeReactionCommand("slap", "👋");
makeReactionCommand("kill", "💀");
//makeReactionCommand("shoot", "🦵");
makeReactionCommand("happy", "😄");
makeReactionCommand("wink", "😉");
makeReactionCommand("poke", "👉");
makeReactionCommand("dance", "💃");
makeReactionCommand("cringe", "😬");
