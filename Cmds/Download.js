const axios = require('axios');
const { keith } = require('../commandHandler');
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================

      
//========================================================================================================================
// From Download.js

keith({
  pattern: "play",
  aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta", "song"],
  category: "Downloader",
  description: "Download Video from Youtube"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let videoUrl;
    let videoTitle;

    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Audio";
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
    }

    const downloadResponse = await axios.get(`${api}/download/audio?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');

    await client.sendMessage(from, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
//========================================================================================================================
// From Download.js

keith({
  pattern: "video",
  aliases: ["ytmp4", "ytmp4doc", "videodoc", "ytv"],
  category: "Downloader",
  description: "Download Video from Youtube"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let videoUrl;
    let videoTitle;

    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Video";
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
    }

    const downloadResponse = await axios.get(`${api}/download/dlmp4?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp4`.replace(/[^\w\s.-]/gi, '');

    await client.sendMessage(from, {
      video: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
