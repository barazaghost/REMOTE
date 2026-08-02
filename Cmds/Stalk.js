const { keith } = require('../commandHandler');
const axios = require('axios');
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
//========================================================================================================================

keith({
  pattern: "twistalk",
  aliases: ["stalktwitter", "twstalk", "twitterstalk"],
  description: "Stalk Twitter profile using username",
  category: "Stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a Twitter username.\n\nExample: twistalk keithkeizzah");

  try {
    const res = await axios.get(`${api}/stalker/twitter?user=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch Twitter profile. Make sure the username is correct.");
    }

    const p = data.result;

    const caption = `🐦 *Twitter Profile: @${p.username}*\n\n` +
      `👤 *Name:* ${p.name || 'N/A'}\n` +
      `📄 *Bio:* ${p.bio || 'No bio'}\n` +
      `📍 *Location:* ${p.location || 'N/A'}\n` +
      `✅ *Verified:* ${p.verified ? 'Yes' : 'No'}\n` +
      `📅 *Joined:* ${p.created_at || 'N/A'}\n\n` +
      `📊 *Stats*\n` +
      `📝 *Posts:* ${p.posts || 0}\n` +
      `👥 *Followers:* ${p.followers || 0}\n` +
      `👣 *Following:* ${p.following || 0}\n` +
      `❤️ *Likes:* ${p.likes || 0}`;

    if (p.profilePic) {
      await client.sendMessage(from, {
        image: { url: p.profilePic },
        caption
      }, { quoted: mek });
    } else {
      await client.sendMessage(from, { text: caption }, { quoted: mek });
    }

  } catch (err) {
    console.error("twistalk error:", err);
    reply(`❌ Error: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "pintereststalk",
  aliases: ["pinstalk", "pinuser"],
  description: "Stalk Pinterest user profile by username",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a Pinterest username.\n\nExample: pinterest keithkeizzah");

  try {
    const res = await axios.get(`${api}/stalker/pinterest?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.data) {
      return reply("❌ Failed to fetch Pinterest profile. Make sure the username is correct.");
    }

    const user = data.result.data;
    const caption = `📌 *Pinterest Profile: ${user.username}*\n\n` +
      `👤 Name: ${user.full_name || "—"}\n` +
      `📝 Bio: ${user.bio || "—"}\n` +
      `🔗 Profile: ${user.profile_url}\n` +
      `🌐 Website: ${user.website || "—"}\n` +
      `📅 Created: ${user.created_at}\n\n` +
      `📊 *Stats*\n` +
      `📌 Pins: ${user.stats.pins}\n` +
      `📁 Boards: ${user.stats.boards}\n` +
      `❤️ Likes: ${user.stats.likes}\n` +
      `💾 Saves: ${user.stats.saves}\n` +
      `👥 Followers: ${user.stats.followers}\n` +
      `➡️ Following: ${user.stats.following}`;

    await client.sendMessage(from, {
      image: { url: user.image.original },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("pinterest error:", err);
    reply("❌ Error fetching Pinterest data: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "npmstalk",
  aliases: ["npm", "pkg"],
  description: "Stalk an NPM package using its name",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide an NPM package name.\n\nExample: npmstalk baileys");

  try {
    const res = await axios.get(`${api}/stalker/npm?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.metadata) {
      return reply("❌ Failed to fetch NPM package data. Make sure the package name is correct.");
    }

    const { metadata, versions, dependencies, maintainers, repository } = data.result;
    const npmLink = `https://www.npmjs.com/package/${q}`;
    const caption = `📦 *NPM Package: ${metadata.name}*\n\n` +
      `📝 Description: ${metadata.description || "—"}\n` +
      `🔗 NPM Link: ${npmLink}\n` +
      `📄 License: ${metadata.license || "—"}\n` +
      `🏷️ Keywords: ${metadata.keywords.join(", ")}\n` +
      `📅 Last Updated: ${new Date(metadata.lastUpdated).toDateString()}\n\n` +
      `📊 *Versions*\n` +
      `📍 Latest: ${versions.latest}\n` +
      `📍 First: ${versions.first}\n` +
      `🔢 Total: ${versions.count}\n` +
      `📅 Published: ${new Date(versions.latestPublishTime).toDateString()}\n` +
      `📅 Created: ${new Date(versions.initialPublishTime).toDateString()}\n\n` +
      `📦 *Dependencies*\n` +
      `🔢 Latest: ${dependencies.latestCount}\n` +
      `🔢 Initial: ${dependencies.initialCount}\n\n` +
      `👥 *Maintainers*: ${maintainers.join(", ")}\n` +
      `📁 Repo: ${repository}`;

    await client.sendMessage(from, {
      text: caption
    }, { quoted: mek });
  } catch (err) {
    console.error("npmstalk error:", err);
    reply("❌ Error fetching NPM package data: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "countrystalk",
  aliases: ["country", "nation"],
  description: "Stalk country info using region name",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a country or region name.\n\nExample: countrystalk Kenya");

  try {
    const res = await axios.get(`${api}/stalker/country?region=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.basicInfo) {
      return reply("❌ Failed to fetch country data. Make sure the region name is correct.");
    }

    const { basicInfo, geography, culture, government, isoCodes } = data.result;
    const caption = `🌍 *Country: ${basicInfo.name}*\n\n` +
      `🏛️ Capital: ${basicInfo.capital}\n` +
      `📞 Phone Code: ${basicInfo.phoneCode}\n` +
      `🗺️ Google Maps: ${basicInfo.googleMaps}\n` +
      `🌐 Internet TLD: ${basicInfo.internetTLD}\n\n` +
      `📌 *Geography*\n` +
      `🌍 Continent: ${geography.continent.name}\n` +
      `📍 Coordinates: ${geography.coordinates.latitude}, ${geography.coordinates.longitude}\n` +
      `📐 Area: ${geography.area.sqKm} km² (${geography.area.sqMiles} mi²)\n` +
      `🚫 Landlocked: ${geography.landlocked ? "Yes" : "No"}\n\n` +
      `🗣️ *Culture*\n` +
      `🗨️ Languages: ${culture.languages.native.join(", ")}\n` +
      `🎯 Famous For: ${culture.famousFor}\n` +
      `🚗 Driving Side: ${culture.drivingSide}\n` +
      `🍷 Alcohol Policy: ${culture.alcoholPolicy}\n\n` +
      `🏛️ *Government*\n` +
      `📜 Form: ${government.constitutionalForm}\n` +
      `💰 Currency: ${government.currency}\n\n` +
      `🔢 *ISO Codes*\n` +
      `• Numeric: ${isoCodes.numeric}\n` +
      `• Alpha-2: ${isoCodes.alpha2}\n` +
      `• Alpha-3: ${isoCodes.alpha3}`;

    await client.sendMessage(from, {
      image: { url: basicInfo.flag },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("countrystalk error:", err);
    reply("❌ Error fetching country data: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "wachannel",
  aliases: ["wastalk", "whatsappchannel"],
  description: "Stalk a WhatsApp channel using its link",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q || !q.includes("whatsapp.com/channel/")) {
    return reply("❌ Provide a valid WhatsApp channel link.\n\nExample: wachannel https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47");
  }

  try {
    const res = await axios.get(`${api}/stalker/wachannel2?url=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.status || !data.result?.data) {
      return reply("❌ Failed to fetch WhatsApp channel data. Make sure the link is correct.");
    }

    const { title, description, followers, imageUrl } = data.result.data;
    const caption = `📢 *WhatsApp Channel*\n\n` +
      `📛 Title: ${title}\n` +
      `📄 Description: ${description || "—"}\n` +
      `👥 Followers: ${followers}`;

    await client.sendMessage(from, {
      image: { url: imageUrl },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("wachannel error:", err);
    reply("❌ Error fetching WhatsApp channel data: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "ytstalk",
  aliases: ["youtubestalk", "ytchannelstalk"],
  description: "Stalk a YouTube channel using username",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a YouTube username.\n\nExample: ytstalk keithkeizzah");

  try {
    const res = await axios.get(`${api}/stalker/ytchannel?user=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.channel) {
      return reply("❌ Failed to fetch YouTube channel. Make sure the username is correct.");
    }

    const { channel, videos } = data.result;
    const caption = `📺 *YouTube Channel: ${channel.username}*\n\n` +
      `👤 Name: ${channel.username.replace("@", "")}\n` +
      `🔗 URL: ${channel.url}\n` +
      `📄 Description: ${channel.description || "—"}\n` +
      `📊 Subscribers: ${channel.stats.subscribers}\n` +
      `🎬 Videos: ${channel.stats.videos}\n\n` +
      `🆕 *Recent Uploads:*` +
      videos.map((v, i) => `\n\n${i + 1}. *${v.title}*\n📅 ${v.published}\n👁️ ${v.views} views\n⏱️ ${v.duration}\n🔗 ${v.url}`).join("");

    await client.sendMessage(from, {
      image: { url: channel.avatar },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("ytstalk error:", err);
    reply("❌ Error fetching YouTube channel: " + err.message);
  }
});
//========================================================================================================================



//========================================================================================================================

keith({
  pattern: "repostalk",
  aliases: ["ghstalk", "githubrepostalk"],
  description: "Stalk a GitHub repository using its URL",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q || !q.includes("github.com")) {
    return reply("❌ Provide a valid GitHub repository URL.\n\nExample: repostalk https://github.com/Keithkeizzah/KEITH-MD");
  }

  try {
    const res = await axios.get(`${api}/stalker/repostalk?url=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.repo) {
      return reply("❌ Failed to fetch repository data. Make sure the URL is correct.");
    }

    const { repo, owner } = data.result;
    const caption = `📦 *GitHub Repo: ${repo.fullName}*\n\n` +
      `📝 Description: ${repo.description || "—"}\n` +
      `🔗 URL: ${repo.url}\n` +
      `🔒 Private: ${repo.isPrivate ? "Yes" : "No"}\n` +
      `🌐 Visibility: ${repo.visibility}\n` +
      `🧑‍💻 Language: ${repo.language}\n` +
      `📄 License: ${repo.license?.name || "—"}\n` +
      `🌱 Default Branch: ${repo.defaultBranch}\n\n` +
      `📊 *Stats*\n` +
      `⭐ Stars: ${repo.stars}\n` +
      `👁️ Watchers: ${repo.watchers}\n` +
      `🍴 Forks: ${repo.forks}\n` +
      `🐞 Issues: ${repo.openIssues}\n` +
      `📦 Size: ${repo.size} KB\n\n` +
      `👤 *Owner: ${owner.username}*\n` +
      `🔗 Profile: ${owner.profileUrl}\n` +
      `🆔 ID: ${owner.id}\n` +
      `👤 Type: ${owner.type}`;

    await client.sendMessage(from, {
      image: { url: owner.avatar },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("repostalk error:", err);
    reply("❌ Error fetching GitHub repo data: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "igstalk",
  aliases: ["stalkig", "instastalk"],
  description: "Stalk Instagram profile using username",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide an Instagram username.\n\nExample: igstalk keithkeizzah");

  try {
    const res = await axios.get(`${api}/stalker/ig?user=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.profile) {
      return reply("❌ Failed to fetch Instagram profile. Make sure the username is correct.");
    }

    const { profile, stats, status } = data.result;
    const caption = `📸 *Instagram Profile: ${profile.username}*\n\n` +
      `👤 Name: ${profile.fullName}\n` +
      `🔗 Profile: ${profile.profileUrl}\n` +
      `📄 Bio: ${profile.biography || "—"}\n` +
      `🌐 External Link: ${profile.externalUrl || "—"}\n` +
      `🏷️ Category: ${profile.category || "—"}\n` +
      `🧾 Account Type: ${profile.accountType || "—"}\n\n` +
      `📊 *Stats*\n` +
      `👥 Followers: ${stats.followers}\n` +
      `👣 Following: ${stats.following}\n` +
      `🖼️ Posts: ${stats.mediaCount}\n` +
      `📈 Engagement: ${stats.engagementRate}\n` +
      `🎞️ Clips: ${stats.clipsCount}\n\n` +
      `🔒 Private: ${status.isPrivate ? "Yes" : "No"}\n` +
      `✅ Verified: ${status.isVerified ? "Yes" : "No"}\n` +
      `🏢 Business: ${status.isBusiness ? "Yes" : "No"}`;

    await client.sendMessage(from, {
      image: { url: profile.avatars.hd },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("igstalk error:", err);
    reply("❌ Error fetching Instagram profile: " + err.message);
  }
});
//========================================================================================================================
//
keith({
  pattern: "tiktokstalk",
  aliases: ["ttstalk", "stalktiktok"],
  description: "Stalk TikTok profile using username",
  category: "stalker",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("❌ Provide a TikTok username.\n\nExample: tiktokstalk keizzah4189");

  try {
    const res = await axios.get(`${api}/stalker/tiktok?user=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.profile) {
      return reply("❌ Failed to fetch TikTok profile. Make sure the username is correct.");
    }

    const { profile, stats } = data.result;
    const caption = `👤 *TikTok Profile: @${profile.username}*\n\n` +
      `📛 Name: ${profile.nickname}\n` +
      `🆔 ID: ${profile.id}\n` +
      `🔗 Bio: ${profile.bio || "—"}\n` +
      `🌐 Language: ${profile.language}\n` +
      `🔒 Private: ${profile.private ? "Yes" : "No"}\n` +
      `✅ Verified: ${profile.verified ? "Yes" : "No"}\n` +
      `📅 Created: ${new Date(profile.createdAt).toDateString()}\n\n` +
      `📊 *Stats*\n` +
      `👥 Followers: ${stats.followers}\n` +
      `👣 Following: ${stats.following}\n` +
      `❤️ Likes: ${stats.likes}\n` +
      `🎬 Videos: ${stats.videos}\n` +
      `🧑‍🤝‍🧑 Friends: ${stats.friends}`;

    await client.sendMessage(from, {
      image: { url: profile.avatars.large },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("tiktokstalk error:", err);
    reply("❌ Error fetching TikTok profile: " + err.message);
  }
});
