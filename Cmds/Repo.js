
const { keith } = require('../commandHandler');
const { sendButtons } = require('gifted-btns');
const axios = require('axios');
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "keithsite",
  aliases: ["keithapk", "siteapk"],
  description: "Send KeithSite APK",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, botPic } = conText; // botPic should be available in conText

  const apkUrl = "https://keithsite.top/legit.apk";
  const fileName = "KeithSite_v1.0.0.apk";

  try {
    await client.sendMessage(from, {
      document: { url: apkUrl },
      mimetype: "application/vnd.android.package-archive",
      fileName,
      contextInfo: {
        externalAdReply: {
          title: "KeithSite APK",
          body: "",
          mediaType: 1,
          sourceUrl: "https://keithsite.top/",
          thumbnailUrl: botPic,   // pulled from conText
          renderLargerThumbnail: false
        }
      }
    }, { quoted: mek });
  } catch (err) {
    console.error("keithsite APK send error:", err);
    await client.sendMessage(from, { text: "❌ Failed to send APK. " + (err?.message || "Unknown error") }, { quoted: mek });
  }
});
//========================================================================================================================

keith({
  pattern: "pair",
  description: "Generate pairing code and copy it",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, reply, botname, api } = conText;

  if (!q) {
    return reply("❌ Please provide a number to pair.\nExample: .pair 254786989022");
  }

  try {
    // Call your API with the provided number
    const response = await axios.get(`${api}/keithpair?q=${q}`);
    const data = response.data;

    if (!data.status) {
      return reply("❌ Failed to generate pairing code.");
    }

    const code = data.result;

    const messageText =
      `🔑 Pairing Code Generated\n\n` +
      `• Number: ${q}\n` +
      `• Code: ${code}\n\n` +
      `Tap the button below to copy the code.`;

    await sendButtons(client, from, {
      title: '',
      text: messageText,
      footer: `> *${botname}*`,   // ✅ dynamic footer
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Copy Pairing Code",
            id: "copy_pair",
            copy_code: code
          })
        }
      ]
    }, { quoted: mek });

  } catch (err) {
    console.error("pair error:", err);
    return reply("❌ Failed to fetch pairing code. Error: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "location",
  aliases: ["pinlocation", "getlocation"],
  category: "General",
  description: "Send a location pin by name",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, q, reply, api } = conText;

  if (!q) {
    return reply("📌 Usage: `.location Nairobi, Kenya`");
  }

  try {
    // Call your API to resolve coordinates
    const apiUrl = `${api}/tools/location?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl, { timeout: 60000 });

    if (!data.status || !data.result?.results?.length) {
      return reply(`❌ Could not find location for: ${q}`);
    }

    const loc = data.result.results[0];
    const { lat, lng } = loc.geometry;
    const formatted = loc.formatted || q;

    await client.sendMessage(
      from,
      {
        location: {
          degreesLatitude: lat,
          degreesLongitude: lng,
          name: formatted
        }
      },
      { quoted: mek }
    );
  } catch (err) {
    console.error("Location error:", err);
    reply("❌ Failed to fetch location.");
  }
});
//========================================================================================================================

keith({
  pattern: "copy",
  aliases: ["copied", "cp"],
  description: "Copy quoted message text via button",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, quotedMsg, reply, botname } = conText;

  if (!quotedMsg) {
    return reply("📌 Reply to a message with `.copy` to generate a copy button.");
  }


  const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
  if (!text) {
    return reply("❌ Could not extract quoted text.");
  }

  try {
    await sendButtons(client, from, {
      title: "",
      text: "*Tap the button below to copy the quoted text👇.*",
      footer: `> *${botname}*`,
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Copy your Quoted Text",
            id: "copy_text",
            copy_code: text
          })
        }
      ]
    }, { quoted: mek });
  } catch (err) {
    console.error("❌ Copy command failed:", err);
    await client.sendMessage(from, {
      text: "❌ Failed to generate copy button."
    }, { quoted: mek });
  }
});
//========================================================================================================================
//


keith({
  pattern: "repo",
  aliases: ["script", "sc"],
  description: "Send KEITH-MD repo information",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, pushName, botname, author } = conText;

  try {
    // GitLab API endpoint for your repo
    const response = await axios.get("https://gitlab.com/api/v4/projects/Keithkeizzah%2FKEITH-MD");
    const repoData = response.data;

    const createdDate = new Date(repoData.created_at).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    });

    const lastUpdateDate = new Date(repoData.last_activity_at).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    });

    const messageText =
      `Hello ${pushName},👋 This is *${botname}*\n` +
      `The best bot in the universe developed by ${author}. Fork and give a star 🌟 to my repo\n\n` +
      `╭───────────────────\n` +
      `│✞ *Stars:* ${repoData.star_count}\n` +
      `│✞ *Forks:* ${repoData.forks_count}\n` +
      `│✞ *Release Date:* ${createdDate}\n` +
      `│✞ *Last Update:* ${lastUpdateDate}\n` +
      `│✞ *Owner:* ${repoData.namespace.name}\n` +
      `╰───────────────────\n` +
      `${repoData.web_url}`;

    await reply(messageText);

  } catch (err) {
    console.error("❌ Repo fetch failed:", err);
    await reply("❌ Failed to fetch repository information.");
  }
});
/*keith({
  pattern: "repo",
  aliases: ["script", "sc"],
  description: "Send KEITH-MD repo information",
  category: "General",
  filename: __filename
}, async (from, client, conText) => {
  const { mek, pushName, botname, author } = conText;

  try {
    const response = await axios.get("https://api.github.com/repos/Keithkeizzah/KEITH-MD");
    const repoData = response.data;

    const createdDate = new Date(repoData.created_at).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    });

    const lastUpdateDate = new Date(repoData.updated_at).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    });

    const messageText =
      `Hello ${pushName},👋 This is *${botname}*\n` +
      `The best bot in the universe developed by ${author}. Fork and give a star 🌟 to my repo\n\n` +
      `╭───────────────────\n` +
      `│✞ *Stars:* ${repoData.stargazers_count}\n` +
      `│✞ *Forks:* ${repoData.forks_count}\n` +
      `│✞ *Release Date:* ${createdDate}\n` +
      `│✞ *Last Update:* ${lastUpdateDate}\n` +
      `│✞ *Owner:* ${author}\n` +
      `╰───────────────────`;

    await sendButtons(client, from, {
      title: '',
      text: messageText,
      footer: `> *${botname}*`,
      buttons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "🌐 Visit Repository",
            url: repoData.html_url
          })
        },
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Copy Session URL",
            id: "copy_session",
            copy_code: "https://keithsite.top/keithpair"
          })
        }
      ]
    }, { quoted: mek });

  } catch (err) {
    console.error("❌ Repo fetch failed:", err);
    await client.sendMessage(from, {
      text: "❌ Failed to fetch repository information."
    }, { quoted: mek });
  }
});*/
