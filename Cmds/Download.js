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
keith({
  pattern: "play",
  aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta"],
  category: "Downloader",
  description: "Download Video from Youtube"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let videoUrl;
    let videoTitle;
    let videoThumbnail;

    // Check if input is a YouTube URL
    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Audio";
      videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
      videoThumbnail = firstVideo.thumbnail;
    }

    const downloadResponse = await axios.get(`${api}/download/audio?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');

    const contextInfo = {
      externalAdReply: {
        title: videoTitle,
        body: 'Powered by Keith API',
        mediaType: 1,
        sourceUrl: videoUrl,
        thumbnailUrl: videoThumbnail,
        renderLargerThumbnail: false
      }
    };

    // Send audio stream
    await client.sendMessage(from, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo
    }, { quoted: mek });

    // Send document stream
    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo: {
        ...contextInfo,
        externalAdReply: {
          ...contextInfo.externalAdReply,
          body: 'Document version - Powered by Keith API'
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
//========================================================================================================================
//========================================================================================================================


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
    let videoThumbnail;

    // Check if input is a YouTube URL
    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Audio";
      videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
      videoThumbnail = firstVideo.thumbnail;
    }

    const downloadResponse = await axios.get(`${api}/download/video?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');

    const contextInfo = {
      externalAdReply: {
        title: videoTitle,
        body: 'Powered by Keith API',
        mediaType: 1,
        sourceUrl: videoUrl,
        thumbnailUrl: videoThumbnail,
        renderLargerThumbnail: false
      }
    };

    // Send audio stream
    await client.sendMessage(from, {
      video: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName,
      contextInfo
    }, { quoted: mek });

    // Send document stream
    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName,
      contextInfo: {
        ...contextInfo,
        externalAdReply: {
          ...contextInfo.externalAdReply,
          body: 'Document version - Powered by Keith API'
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
