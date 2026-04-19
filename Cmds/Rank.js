

const { keith } = require('../commandHandler');

//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "termuxhub",
  description: "Download termux hub",
  category: "Moded-APK",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply } = conText;

  try {
    await client.sendMessage(from, {
      document: { url: "https://f-droid.org/repo/com.maazm7d.termuxhub_2.apk" },
      mimetype: "application/vnd.android.package-archive",
      fileName: "termux-hub.apk",
      contextInfo: {
        externalAdReply: {
          title: "Termux hub APK",
          body: "Latest version download",
          thumbnailUrl: "https://i.ibb.co/fGVjsqbL/ab028250aad3.jpg",
          sourceUrl: "https://f-droid.org/repo/com.maazm7d.termuxhub_2.apk",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });
  } catch (err) {
    console.error("error:", err);
    await reply("❌ Failed . Error: " + err.message);
  }
});

//========================================================================================================================
//========================================================================================================================
keith({
  pattern: "youcine",
  description: "Streaming app for watching movies and football live",
  category: "Moded-APK",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply } = conText;

  try {
    await client.sendMessage(from, {
      document: { url: "https://one.deltaexecutor-apk.com/APK2/youcine.apk" },
      mimetype: "application/vnd.android.package-archive",
      fileName: "Youcine-Mod.apk",
      contextInfo: {
        externalAdReply: {
          title: "Youcine Mod APK",
          body: "Streaming movies & football live",
          thumbnailUrl: "https://files.catbox.moe/xt2cmp.jpg",
          sourceUrl: "https://apkgo.fun/dobrins",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });
  } catch (err) {
    console.error("Youcine error:", err);
    await reply("❌ Failed to send Youcine APK. Error: " + err.message);
  }
});
//const { keith } = require('../commandHandler');
//========================================================================================================================
keith({
  pattern: "playfy",
  description: "Download Playfy Mod APK",
  category: "Moded-APK",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, reply } = conText;

  try {
    await client.sendMessage(from, {
      document: { url: "https://dl.playfytv.xyz/PLAYFy_TV_1.5.apk" },
      mimetype: "application/vnd.android.package-archive",
      fileName: "Playfy-Mod.apk",
      contextInfo: {
        externalAdReply: {
          title: "Playfy Mod APK",
          body: "Latest version download",
          thumbnailUrl: "https://files.catbox.moe/y25pji.jpg",
          sourceUrl: "https://dl.playfytv.xyz/PLAYFy_TV_1.5.apk",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });
  } catch (err) {
    console.error("Playfy error:", err);
    await reply("❌ Failed to send Playfy APK. Error: " + err.message);
  }
});
//const { keith } = require("../commandHandler");
//========================================================================================================================
keith({
  pattern: "sportzfy",
  description: "Download Sportzfy Mod APK",
  category: "Moded-APK",
  filename: __filename
}, async (from, client, conText) => {
  const { mek } = conText;

  try {
    await client.sendMessage(from, {
      document: { url: "https://sportzfy.com/wp-content/apk/Sportzfy_v11(09-01-2026)_New_Latest_Version.apk" },
      mimetype: "application/vnd.android.package-archive",
      fileName: "Sportzfy-Mod.apk",
      contextInfo: {
        externalAdReply: {
          title: "Sportzfy Mod APK",
          body: "Latest version download",
          thumbnailUrl: "https://files.catbox.moe/es8de1.jpg", // you can swap thumbnail if you want
          sourceUrl: "https://sportzfy.com/wp-content/apk/Sportzfy_v11(09-01-2026)_New_Latest_Version.apk",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });
  } catch (err) {
    // Silent fail, no reply/console since you prefer clean
  }
});
//========================================================================================================================
