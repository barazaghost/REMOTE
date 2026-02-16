const axios = require('axios');
const { keith } = require('../commandHandler');
//========================================================================================================================



keith({
  pattern: "hentaivid",
  aliases: ["nsfwvideo", "nsfwvid"],
  category: "Downloader",
  description: "Download a random video from the list"
},
async (from, client, conText) => {
  const { mek, api } = conText;

  try {
    const response = await axios.get(`${api}/dl/hentaivid`, { timeout: 100000 });
    const videos = response.data?.result;
    if (!Array.isArray(videos) || videos.length === 0) return;

    const pick = videos[Math.floor(Math.random() * videos.length)];
    const videoUrl = pick.media?.video_url || pick.media?.fallback_url;
    if (!videoUrl) return;

    const fileName = `${pick.title}.mp4`.replace(/[^\w\s.-]/gi, '');
    const caption = `🎬 *${pick.title}*\n📁 Category: ${pick.category}\n👁️ Views: ${pick.views_count}\n🔁 Shares: ${pick.share_count}`;

    const contextInfo = {
      externalAdReply: {
        title: pick.title,
        body: `${pick.category} • ${pick.views_count} views`,
        mediaType: 1,
        sourceUrl: pick.link,
        thumbnailUrl: "https://sfmcompile.club/favicon.ico",
        renderLargerThumbnail: false
      }
    };

    await client.sendMessage(from, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      fileName,
      caption,
      contextInfo
    }, { quoted: mek });

  } catch (error) {
    console.error("Random video download error:", error);
  }
});
//========================================================================================================================


keith({
  pattern: "facebook",
  aliases: ["fbdl", "fb"],
  category: "Downloader",
  description: "Download video from Facebook"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q || !q.startsWith("http")) return;

  try {
    const apiUrl = `${api}/download/fbdown?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });
    const result = response.data?.result;

    if (!result?.media?.sd) return;

    await client.sendMessage(from, {
      video: { url: result.media.sd },
      mimetype: "video/mp4"
    }, { quoted: mek });

  } catch (error) {
    console.error("Facebook download error:", error);
  }
});
//======================================================================================================================== 


keith({
  pattern: "apk",
  aliases: ["aptoide", "apkdl"],
  category: "Downloader",
  description: "Download APK from Aptoide"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    const searchUrl = `${api}/search/aptoide?q=${encodeURIComponent(q)}`;
    const response = await axios.get(searchUrl, { timeout: 100000 });
    const apps = response.data?.result?.datalist?.list;
    if (!Array.isArray(apps) || apps.length === 0) return;

    const app = apps[0];
    const file = app.file;
    if (!file?.path) return;

    const fileName = `${app.name}.apk`.replace(/[^\w\s.-]/gi, '');
    const caption = `📦 *${app.name}*\n🧑‍💻 Developer: ${app.developer?.name || "Unknown"}\n📦 Package: ${app.package}\n📏 Size: ${(file.filesize / 1024 / 1024).toFixed(2)} MB\n⭐ Rating: ${app.stats?.rating?.avg || "N/A"} (${app.stats?.rating?.total || 0} votes)\n🔒 Signature: ${file.signature?.sha1 || "N/A"}`;

    const contextInfo = {
      externalAdReply: {
        title: app.name,
        body: `${file.vername} • ${app.package}`,
        mediaType: 1,
        sourceUrl: `https://aptoide.com/search?q=${encodeURIComponent(app.package)}`,
        thumbnailUrl: app.icon,
        renderLargerThumbnail: false
      }
    };

    await client.sendMessage(from, {
      document: { url: file.path },
      mimetype: "application/vnd.android.package-archive",
      fileName,
      caption,
      contextInfo
    }, { quoted: mek });

  } catch (error) {
    console.error("APK download error:", error);
  }
});
//========================================================================================================================
//========================================================================================================================
keith({
  pattern: "pinterest",
  aliases: ["pindl", "pin"],
  category: "downloader",
  description: "Download media from Pinterest"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q || !q.startsWith("http")) return;

  try {
    const apiUrl = `${api}/download/pindl2?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });
    const result = response.data?.result;

    if (!result?.success || !Array.isArray(result.medias)) return;

    const title = result.title || "Pinterest Media";

    for (const media of result.medias) {
      const { url, extension, videoAvailable } = media;
      if (!url) continue;

      const fileName = `${title}.${extension}`.replace(/[^\w\s.-]/gi, '');
      const mimetype = extension === "mp4" ? "video/mp4" : "image/jpeg";

      await client.sendMessage(from, {
        [videoAvailable ? "video" : "image"]: { url },
        mimetype,
        fileName
      }, { quoted: mek });
    }

  } catch (error) {
    console.error("Pinterest download error:", error);
  }
});


//========================================================================================================================


keith({
  pattern: "spotify",
  aliases: ["spot", "spdl"],
  category: "Downloader",
  description: "Download track from Spotify"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    const apiUrl = `${api}/download/spotify?q=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });
    const track = response.data?.result?.track;

    if (!track?.downloadLink) return;

    const fileName = `${track.title}.mp3`.replace(/[^\w\s.-]/gi, '');
    const contextInfo = {
      externalAdReply: {
        title: track.title,
        body: `${track.artist} • ${track.duration}`,
        mediaType: 1,
        sourceUrl: track.url,
        thumbnailUrl: track.thumbnail,
        renderLargerThumbnail: false
      }
    };

    await client.sendMessage(from, {
      audio: { url: track.downloadLink },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: track.downloadLink },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo: {
        ...contextInfo,
        externalAdReply: {
          ...contextInfo.externalAdReply,
          body: "Document version - Powered by Keith API"
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("Spotify download error:", error);
  }
});


//========================================================================================================================


keith({
  pattern: "instagram",
  aliases: ["insta", "igdl", "ig"],
  category: "Downloader",
  description: "Download Instagram video"
},
async (from, client, conText) => {
  const { q, mek, reply, api } = conText;

  if (!q || !q.startsWith("http")) {
    return reply("❌ Provide a valid Instagram video URL.");
  }

  try {
    const apiUrl = `${api}/download/instadl?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });

    const result = response.data?.result;

    if (!result) {
      return reply("❌ No video found for this Instagram link.");
    }

    await client.sendMessage(
      from,
      {
        video: { url: result },
        mimetype: "video/mp4"
      },
      { quoted: mek }
    );
  } catch (error) {
    console.error("Instagram download error:", error);
    reply("❌ Failed to download Instagram video.");
  }
});

//========================================================================================================================


keith({
  pattern: "mfire",
  aliases: ["mediafire", "mf"],
  category: "Downloader",
  description: "Download file from MediaFire"
},
async (from, client, conText) => {
  const { q, mek, url, api } = conText;

  if (!q || !q.startsWith("http")) return;

  try {
    const apiUrl = `${api}/download/mfire?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });
    const result = response.data?.result;

    if (!result?.dl_link || !result?.fileName) return;

    const fileName = result.fileName.replace(/[^\w\s.-]/gi, '');
    const contextInfo = {
      externalAdReply: {
        title: "MediaFire Download",
        body: `${fileName} • ${result.size}`,
        mediaType: 1,
        sourceUrl: q,
        thumbnailUrl: url,
        renderLargerThumbnail: false
      }
    };

    await client.sendMessage(from, {
      document: { url: result.dl_link },
      mimetype: result.fileType || "application/octet-stream",
      fileName,
      contextInfo
    }, { quoted: mek });

  } catch (error) {
    console.error("MediaFire download error:", error);
  }
});

//========================================================================================================================


keith({
  pattern: "twitter",
  aliases: ["tw", "twt"],
  category: "Downloader",
  description: "Download video from Twitter"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q || !q.startsWith("http")) return;

  try {
    const apiUrl = `${api}/download/twitter?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });
    const result = response.data?.result;

    if (!result?.video_hd) return;

    await client.sendMessage(from, {
      video: { url: result.video_hd },
      mimetype: "video/mp4"
    }, { quoted: mek });

  } catch (error) {
    console.error("Twitter download error:", error);
  }
});





//========================================================================================================================
keith({
  pattern: "Soundcloud",
  aliases: ["scdl", "sc"],
  category: "Downloader",
  description: "Download track from SoundCloud"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let trackUrl = q;

    // If not a SoundCloud URL, treat as search query
    if (!/^https?:\/\/(m\.)?soundcloud\.com\//i.test(q)) {
      const searchRes = await axios.get(`${api}/search/soundcloud?q=${encodeURIComponent(q)}`);
      const topTrack = searchRes.data?.result?.result?.find(x => x.url?.includes("soundcloud.com") && x.timestamp);
      if (!topTrack?.url) return;
      trackUrl = topTrack.url;
    }

    const dlRes = await axios.get(`${api}/download/soundcloud?url=${encodeURIComponent(trackUrl)}`);
    const media = dlRes.data?.data?.medias?.find(m => m.audioAvailable && m.url);
    const track = dlRes.data?.data;

    if (!media?.url) return;

    const fileName = `${track.title}.mp3`.replace(/[^\w\s.-]/gi, '');
    const contextInfo = {
      externalAdReply: {
        title: track.title,
        body: `${track.duration} • SoundCloud`,
        mediaType: 1,
        sourceUrl: track.url,
        thumbnailUrl: track.thumbnail,
        renderLargerThumbnail: false
      }
    };

    await client.sendMessage(from, {
      audio: { url: media.url },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: media.url },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo: {
        ...contextInfo,
        externalAdReply: {
          ...contextInfo.externalAdReply,
          body: "Document version - Powered by Keith API"
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("SoundCloud download error:", error);
  }
});
//========================================================================================================================


keith({
  pattern: "tiktok",
  aliases: ["ttdl", "tt"],
  category: "Downloader",
  description: "Download video from TikTok"
},
async (from, client, conText) => {
  const { q, mek, reply, api } = conText;

  if (!q || !q.startsWith("http")) {
    return reply("❌ Provide a valid TikTok URL.");
  }

  try {
    const apiUrl = `${api}/download/tiktokdl3?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 100000 });

    const videoUrl = response.data?.result;
    if (!videoUrl) {
      return reply("❌ No video found for this TikTok link.");
    }

    await client.sendMessage(
      from,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4"
      },
      { quoted: mek }
    );
  } catch (error) {
    console.error("TikTok download error:", error);
    reply("❌ Failed to download TikTok video.");
  }
});



//========================================================================================================================






