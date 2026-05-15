const { keith } = require('../commandHandler');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const axios = require('axios');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const mime = require('mime-types');

//========================================================================================================================
// Helper Functions
//========================================================================================================================

async function downloadMediaBuffer(client, mediaMsg, type) {
  const buffer = await downloadMediaMessage(
    { message: { [type + 'Message']: mediaMsg } },
    'buffer',
    {},
    { 
      reuploadRequest: client.updateMediaMessage,
      logger: console 
    }
  );
  return buffer;
}

async function toPtt(buffer) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = Date.now();
  const inputPath = path.join(tempDir, `ptt_in_${timestamp}.tmp`);
  const outputPath = path.join(tempDir, `ptt_out_${timestamp}.ogg`);

  fs.writeFileSync(inputPath, buffer);

  const cleanup = () => {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  };

  return new Promise((resolve, reject) => {
    execFile('ffmpeg', [
      '-y', '-i', inputPath,
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-ar', '48000',
      '-ac', '1',
      '-f', 'ogg',
      outputPath
    ], { timeout: 120000 }, (err) => {
      if (err) {
        cleanup();
        return reject(err);
      }
      try {
        const out = fs.readFileSync(outputPath);
        cleanup();
        resolve(out);
      } catch (e) { cleanup(); reject(e); }
    });
  });
}

//========================================================================================================================
// toptt Command

//========================================================================================================================
// 5. Loop Command (Repeat Media)
//========================================================================================================================
keith({
  pattern: "loop",
  aliases: ["repeat"],
  description: "Loop audio or video N times",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quotedMsg, mek, reply, keithRandom } = conText;
  
  let loops = 2;
  if (q && !isNaN(parseInt(q))) {
    loops = Math.min(parseInt(q), 10);
  }
  
  const media = quotedMsg?.videoMessage || quotedMsg?.audioMessage;
  if (!media) {
    return reply("📌 Reply to an audio or video to loop it.\nUsage: .loop 3 (loops 3 times)");
  }
  
  const isVideo = !!quotedMsg.videoMessage;
  const type = isVideo ? 'video' : 'audio';
  const inputExt = isVideo ? '.mp4' : '.mp3';
  const outputExt = isVideo ? '.mp4' : '.mp3';
  
  try {
    const buffer = await downloadMediaBuffer(client, media, type);
    const inputPath = keithRandom(inputExt);
    const outputPath = keithRandom(outputExt);
    
    fs.writeFileSync(inputPath, buffer);
    
    exec(`ffmpeg -stream_loop ${loops} -i ${inputPath} -c copy ${outputPath}`, async (err) => {
      fs.unlinkSync(inputPath);
      if (err) return reply("❌ Failed to loop media.");
      
      const outputBuffer = fs.readFileSync(outputPath);
      const message = isVideo
        ? { video: outputBuffer, mimetype: "video/mp4" }
        : { audio: outputBuffer, mimetype: "audio/mpeg" };
      
      await client.sendMessage(from, message, { quoted: mek });
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    reply(`❌ Error: ${error.message}`);
  }
});

//========================================================================================================================
// Image to Video with Audio (More Stable - Resizes Image First)
//========================================================================================================================
keith({
  pattern: "slideshow",
  aliases: ["imgewaudio", "imagewithaudio", "imgaudio"],
  description: "Convert quoted image to video with audio (audio URL required)",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { q, quotedMsg, mek, reply, keithRandom } = conText;

  if (!quotedMsg?.imageMessage) {
    return reply("📌 Reply to an *image* and provide an audio URL.\n\nExample: .img2video https://example.com/song.mp3");
  }

  if (!q || !q.startsWith('http')) {
    return reply("🎵 Please provide a valid audio URL.\n\nExample: .img2video https://example.com/song.mp3");
  }

  const audioUrl = q.trim();
  const outputPath = keithRandom('.mp4');

  try {
    await reply("🎬 Processing...");

    // Download image
    const imageBuffer = await downloadMediaBuffer(client, quotedMsg.imageMessage, 'image');
    const imagePath = keithRandom('.jpg');
    fs.writeFileSync(imagePath, imageBuffer);

    // Resize image first to 480p (smaller = faster, less memory)
    const resizedImagePath = keithRandom('.jpg');
    
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${imagePath} -vf "scale=640:-2" -frames:v 1 ${resizedImagePath}`, (err) => {
        fs.unlinkSync(imagePath);
        if (err) reject(err);
        else resolve();
      });
    });

    // Download audio
    const audioResponse = await axios.get(audioUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000
    });
    const audioBuffer = Buffer.from(audioResponse.data);
    const audioPath = keithRandom('.mp3');
    fs.writeFileSync(audioPath, audioBuffer);

    // Get audio duration
    let audioDuration = 30;
    await new Promise((resolve) => {
      exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioPath}`, (err, stdout) => {
        if (!err && stdout) audioDuration = parseFloat(stdout.trim());
        resolve();
      });
    });

    // Create video
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -loop 1 -i ${resizedImagePath} -i ${audioPath} -c:v libx264 -c:a aac -vf "format=yuv420p" -shortest -preset ultrafast -crf 30 -movflags +faststart ${outputPath}`, 
        { timeout: 90000 }, (err) => {
          fs.unlinkSync(resizedImagePath);
          fs.unlinkSync(audioPath);
          if (err) reject(err);
          else resolve();
        });
    });

    const videoBuffer = fs.readFileSync(outputPath);
    const minutes = Math.floor(audioDuration / 60);
    const seconds = Math.floor(audioDuration % 60);
    
    await client.sendMessage(from, {
      video: videoBuffer,
      mimetype: "video/mp4",
      caption: `🎬 Image to Video\n🎵 Duration: ${minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}`
    }, { quoted: mek });

    fs.unlinkSync(outputPath);

  } catch (error) {
    console.error("img2video error:", error);
    await reply(`❌ Error: ${error.message}`);
  }
});
//========================================================================================================================
keith({
    pattern: "toptt",
    aliases: ['tovoice', 'tovn', 'tovoicenote'],
    category: "Converter",
    description: "Convert audio to WhatsApp voice note"
  },
  async (from, client, conText) => {
    const { mek, reply, quoted, quotedMsg } = conText;

    if (!quotedMsg) {
      return reply("Please reply to an audio message");
    }

    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    
    if (!quotedAudio) {
      return reply("The quoted message doesn't contain any audio");
    }

    try {
      const buffer = await downloadMediaBuffer(client, quotedAudio, 'audio');
      const convertedBuffer = await toPtt(buffer);
      
      await client.sendMessage(from, {
        audio: convertedBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      });
      
    } catch (e) {
      console.error("Error in toptt command:", e);
      await reply("Failed to convert to voice note");
    }
  }
);

//========================================================================================================================
// tts Command
//========================================================================================================================
keith({
  pattern: "tts",
  aliases: ["say"],
  category: "tools",
  description: "Convert text or quoted message to PTT audio"
},
async (from, client, conText) => {
  const { q, mek, quotedMsg, reply } = conText;

  let text;
  if (q) {
    text = q;
  } else if (quotedMsg) {
    text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    if (!text) {
      return reply("❌ Could not extract quoted text.");
    }
  } else {
    return reply("📌 Reply to a message with text or provide text directly.");
  }

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
    
    await client.sendMessage(from, {
      audio: { url: ttsUrl },
      mimetype: "audio/mpeg",
      ptt: false
    });

  } catch (error) {
    console.error("TTS error:", error);
    reply("⚠️ An error occurred while generating speech.");
  }
});

//========================================================================================================================
// tom4a Command
//========================================================================================================================
keith({
  pattern: "tom4a",
  aliases: ["audioextract"],
  description: "Convert quoted audio or video to MP3",
  category: "Converter",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, mek, reply } = conText;

  let mediaType = null;
  let mediaTypeName = null;
  
  if (quotedMsg?.videoMessage) {
    mediaType = quotedMsg.videoMessage;
    mediaTypeName = 'video';
  } else if (quotedMsg?.audioMessage) {
    mediaType = quotedMsg.audioMessage;
    mediaTypeName = 'audio';
  }
  
  if (!mediaType) {
    return reply("❌ Quote an audio or video to convert to MP3.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, mediaType, mediaTypeName);

    await client.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mp4"
    }, { quoted: mek });

  } catch (error) {
    console.error("tom4a error:", error);
    await reply("❌ An error occurred while converting the media.");
  }
});

//========================================================================================================================
// tomp3 Command
//========================================================================================================================
keith({
  pattern: "tomp3",
  aliases: ["audioextract"],
  description: "Convert quoted audio or video to MP3",
  category: "Converter",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, mek, reply } = conText;

  let mediaType = null;
  let mediaTypeName = null;
  
  if (quotedMsg?.videoMessage) {
    mediaType = quotedMsg.videoMessage;
    mediaTypeName = 'video';
  } else if (quotedMsg?.audioMessage) {
    mediaType = quotedMsg.audioMessage;
    mediaTypeName = 'audio';
  }
  
  if (!mediaType) {
    return reply("❌ Quote an audio or video to convert to MP3.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, mediaType, mediaTypeName);

    await client.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mpeg"
    }, { quoted: mek });

  } catch (error) {
    console.error("tomp3 error:", error);
    await reply("❌ An error occurred while converting the media.");
  }
});

//========================================================================================================================
// imgsize Command
//========================================================================================================================
keith({
  pattern: "imgsize",
  aliases: ["imagesize", "dimension"],
  description: "Get dimensions (width×height) of quoted image",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, quoted, quotedMsg, keithRandom } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply(`📌 Reply to an *image* to get its dimensions.\nExample: .imgsize`);
  }

  const tempPath = keithRandom('.jpg');
  try {
    const buffer = await downloadMediaBuffer(client, quoted.imageMessage, 'image');
    fs.writeFileSync(tempPath, buffer);

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${tempPath} -f null - 2>&1 | grep -oP 'Stream.*Video:.*\\s\\K\\d+x\\d+'`, async (err, stdout) => {
        try {
          fs.unlinkSync(tempPath);

          if (err || !stdout) return reject(new Error("Couldn't detect image dimensions"));

          const dimensions = stdout.trim();
          await reply(`🖼️ Image dimensions: ${dimensions}`);

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (err) {
    reply(`❌ Error: ${err.message}`);
  }
});

//========================================================================================================================
// resize Command
//========================================================================================================================
keith({
  pattern: "resize",
  aliases: ["imgresize"],
  description: "Resize quoted image to specified dimensions (e.g., 300×250)",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, quoted, quotedMsg, keithRandom } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply(`📌 Reply to an *image* with dimensions like *300×250* to resize it.\nExample: .resize 300×250`);
  }

  if (!q || !q.match(/^\d+×\d+$/)) {
    return reply(`📌 Provide dimensions in format *width×height* (e.g., 300×250)`);
  }

  const [width, height] = q.split("×").map(Number);

  if (width <= 0 || height <= 0 || width > 5000 || height > 5000) {
    return reply(`❌ Invalid dimensions. Please use values between 1 and 5000`);
  }

  const inputPath = keithRandom('.jpg');
  const outputPath = keithRandom('.jpg');

  try {
    const buffer = await downloadMediaBuffer(client, quoted.imageMessage, 'image');
    fs.writeFileSync(inputPath, buffer);

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${inputPath} -vf "scale=${width}:${height}" ${outputPath}`, async (error) => {
        try {
          fs.unlinkSync(inputPath);

          if (error) return reject(new Error(`Error resizing image: ${error.message}`));

          const imageBuffer = fs.readFileSync(outputPath);
          await client.sendMessage(from, {
            image: imageBuffer,
            caption: `Resized to ${width}×${height}`
          }, { quoted: mek });

          fs.unlinkSync(outputPath);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (err) {
    reply(`❌ Error: ${err.message}`);
  }
});

//========================================================================================================================
// watermark Command
//========================================================================================================================
const namedColors = {
  black: "000000", white: "ffffff", red: "ff0000", blue: "0000ff", green: "00ff00",
  yellow: "ffff00", pink: "ffc0cb", purple: "800080", orange: "ffa500", gray: "808080",
  cyan: "00ffff", magenta: "ff00ff", gold: "ffd700", silver: "c0c0c0"
};

keith({
  pattern: "watermark",
  aliases: ["wm", "addwatermark"],
  description: "Add bold slanted watermark to quoted image (text or image watermark)",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, quoted, quotedMsg, keithRandom } = conText;

  if (!quotedMsg || !quoted?.imageMessage) {
    return reply(`📌 Reply to an *image* to add watermark.\nExample: .watermark MyBrand |red,60 (text)\nOr reply with an image and caption .watermark to use another quoted image as watermark`);
  }

  const baseImageBuffer = await downloadMediaBuffer(client, quoted.imageMessage, 'image');
  const baseImagePath = keithRandom('.jpg');
  fs.writeFileSync(baseImagePath, baseImageBuffer);
  const outputPath = keithRandom('.jpg');

  try {
    if (q) {
      // Text watermark with optional color + size
      let [textPart, options] = q.split("|");
      const watermarkText = textPart.trim().length > 20 ? textPart.trim().substring(0, 20) + "..." : textPart.trim();

      let fontColor = "white";
      let fontSize = 48;

      if (options) {
        const parts = options.split(",").map(p => p.trim().toLowerCase());
        if (parts[0]) fontColor = namedColors[parts[0]] ? `#${namedColors[parts[0]]}` : parts[0];
        if (parts[1]) fontSize = parseInt(parts[1]) || 48;
      }

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${baseImagePath} -vf "drawtext=text='${watermarkText}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf:fontcolor=${fontColor}:fontsize=${fontSize}:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" ${outputPath}`,
          async (error) => {
            try {
              fs.unlinkSync(baseImagePath);
              if (error) return reject(new Error(`Error adding text watermark: ${error.message}`));

              const imageBuffer = fs.readFileSync(outputPath);
              await client.sendMessage(from, {
                image: imageBuffer,
                caption: `Added watermark: "${watermarkText}" (${fontColor}, size ${fontSize})`
              }, { quoted: mek });

              fs.unlinkSync(outputPath);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
      });
    } else {
      // Image watermark
      if (!quotedMsg.quoted || !quotedMsg.quoted.imageMessage) {
        return reply(`📌 For image watermark, reply to the main image and quote another image as watermark.`);
      }

      const watermarkBuffer = await downloadMediaBuffer(client, quotedMsg.quoted.imageMessage, 'image');
      const watermarkPath = keithRandom('.png');
      fs.writeFileSync(watermarkPath, watermarkBuffer);
      const tempWatermarkPath = keithRandom('.png');

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${baseImagePath} -f null - 2>&1 | grep -oP 'Stream.*Video:.*\\s\\K\\d+x\\d+'`, (err, stdout) => {
          if (err) return reject(new Error("Couldn't get base image dimensions"));

          const [width, height] = stdout.trim().split('x').map(Number);
          const wmWidth = Math.floor(width / 4);
          const wmHeight = Math.floor(height / 4);

          exec(`ffmpeg -i ${watermarkPath} -vf "scale=${wmWidth}:${wmHeight}" ${tempWatermarkPath}`, (err) => {
            if (err) return reject(new Error("Couldn't resize watermark image"));
            resolve();
          });
        });
      });

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${baseImagePath} -i ${tempWatermarkPath} -filter_complex "overlay=W-w-10:H-h-10" ${outputPath}`,
          async (error) => {
            try {
              fs.unlinkSync(baseImagePath);
              fs.unlinkSync(watermarkPath);
              fs.unlinkSync(tempWatermarkPath);

              if (error) return reject(new Error(`Error adding image watermark: ${error.message}`));

              const imageBuffer = fs.readFileSync(outputPath);
              await client.sendMessage(from, {
                image: imageBuffer,
                caption: `Added image watermark (bottom-right corner)`
              }, { quoted: mek });

              fs.unlinkSync(outputPath);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
      });
    }
  } catch (err) {
    reply(`❌ Error: ${err.message}`);
  }
});

//========================================================================================================================
// trim Command
//========================================================================================================================
keith({
  pattern: "trim",
  description: "Trim quoted audio or video using start and end time",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, q, mek, reply, keithRandom } = conText;

  if (!quotedMsg) {
    return reply("❌ Reply to an audio or video file with start and end time.\n\nExample: `trim 0:10 0:30`");
  }

  const [startTime, endTime] = q.split(" ").map(t => t.trim());
  if (!startTime || !endTime) {
    return reply("⚠️ Invalid format.\n\nExample: `trim 0:10 0:30`");
  }

  let mediaType = null;
  let mediaTypeName = null;
  
  if (quotedMsg.audioMessage) {
    mediaType = quotedMsg.audioMessage;
    mediaTypeName = 'audio';
  } else if (quotedMsg.videoMessage) {
    mediaType = quotedMsg.videoMessage;
    mediaTypeName = 'video';
  }
  
  if (!mediaType) {
    return reply("❌ Unsupported media type. Quote an audio or video file.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, mediaType, mediaTypeName);
    const mediaPath = keithRandom(mediaTypeName === 'audio' ? '.mp3' : '.mp4');
    fs.writeFileSync(mediaPath, buffer);
    
    const isAudio = !!quotedMsg.audioMessage;
    const outputExt = isAudio ? ".mp3" : ".mp4";
    const outputPath = keithRandom(outputExt);

    exec(`ffmpeg -i ${mediaPath} -ss ${startTime} -to ${endTime} -c copy ${outputPath}`, async (err) => {
      fs.unlinkSync(mediaPath);
      if (err) {
        console.error("ffmpeg error:", err);
        return reply("❌ Trimming failed.");
      }

      const outputBuffer = fs.readFileSync(outputPath);
      const message = isAudio
        ? { audio: outputBuffer, mimetype: "audio/mpeg" }
        : { video: outputBuffer, mimetype: "video/mp4" };

      await client.sendMessage(from, message, { quoted: mek });
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("trim error:", error);
    await reply("❌ An error occurred while processing the media.");
  }
});

//========================================================================================================================
// volume Command
//========================================================================================================================
keith({
  pattern: "volume",
  description: "Adjust volume of quoted audio or video",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, q, mek, reply, keithRandom } = conText;

  if (!q) {
    return reply("⚠️ Example: volume 1.5");
  }

  let mediaType = null;
  let mediaTypeName = null;
  
  if (quotedMsg?.audioMessage) {
    mediaType = quotedMsg.audioMessage;
    mediaTypeName = 'audio';
  } else if (quotedMsg?.videoMessage) {
    mediaType = quotedMsg.videoMessage;
    mediaTypeName = 'video';
  }
  
  if (!mediaType) {
    return reply("❌ Quote an audio or video file to adjust its volume.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, mediaType, mediaTypeName);
    const mediaPath = keithRandom(mediaTypeName === 'audio' ? '.mp3' : '.mp4');
    fs.writeFileSync(mediaPath, buffer);
    
    const isAudio = !!quotedMsg.audioMessage;
    const outputExt = isAudio ? ".mp3" : ".mp4";
    const outputPath = keithRandom(outputExt);

    exec(`ffmpeg -i ${mediaPath} -filter:a volume=${q} ${outputPath}`, async (err) => {
      fs.unlinkSync(mediaPath);
      if (err) {
        console.error("ffmpeg error:", err);
        return reply("❌ Volume adjustment failed.");
      }

      const outputBuffer = fs.readFileSync(outputPath);
      const message = isAudio
        ? { audio: outputBuffer, mimetype: "audio/mpeg" }
        : { video: outputBuffer, mimetype: "video/mp4" };

      await client.sendMessage(from, message, { quoted: mek });
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("volume error:", error);
    await reply("❌ An error occurred while processing the media.");
  }
});

//========================================================================================================================
// toaudio Command
//========================================================================================================================
keith({
  pattern: "toaudio",
  aliases: ["audioextract"],
  description: "Convert quoted audio or video to MP3",
  category: "Converter",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, mek, reply } = conText;

  let mediaType = null;
  let mediaTypeName = null;
  
  if (quotedMsg?.videoMessage) {
    mediaType = quotedMsg.videoMessage;
    mediaTypeName = 'video';
  } else if (quotedMsg?.audioMessage) {
    mediaType = quotedMsg.audioMessage;
    mediaTypeName = 'audio';
  }
  
  if (!mediaType) {
    return reply("❌ Quote an audio or video to convert to MP3.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, mediaType, mediaTypeName);

    await client.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mpeg"
    }, { quoted: mek });

  } catch (error) {
    console.error("toaudio error:", error);
    await reply("❌ An error occurred while converting the media.");
  }
});

//========================================================================================================================
// toimg Command
//========================================================================================================================
keith({
  pattern: "toimg",
  aliases: ["sticker2img", "webp2png"],
  description: "Convert quoted sticker to image or video if animated",
  category: "Converter",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, mek, reply } = conText;

  if (!quotedMsg?.stickerMessage) {
    return reply("❌ Quote a sticker to convert.");
  }

  try {
    const buffer = await downloadMediaBuffer(client, quotedMsg.stickerMessage, 'sticker');
    const isAnimated = quotedMsg.stickerMessage.isAnimated || quotedMsg.stickerMessage.isAnimatedSticker;

    if (isAnimated) {
      await client.sendMessage(from, {
        video: buffer,
        mimetype: "video/mp4",
        caption: "🎞️ Converted from animated sticker"
      }, { quoted: mek });
    } else {
      await client.sendMessage(from, {
        image: buffer,
        caption: "🖼️ Converted from sticker"
      }, { quoted: mek });
    }

  } catch (e) {
    console.error("toimg error:", e);
    await reply("❌ Unable to convert the sticker. " + e.message);
  }
});

//========================================================================================================================
// amplify Command
//========================================================================================================================
keith({
  pattern: "amplify",
  aliases: ["replaceaudio", "mergeaudio"],
  description: "Replace quoted video's audio with a new audio URL",
  category: "Utility",
  filename: __filename
}, async (from, client, conText) => {
  const { quotedMsg, q, mek, reply, keithRandom } = conText;

  if (!quotedMsg?.videoMessage) {
    return reply("❌ Reply to a video file with the audio URL to replace its audio.");
  }

  if (!q) {
    return reply("❌ Provide an audio URL.");
  }

  try {
    const audioUrl = q.trim();
    const videoBuffer = await downloadMediaBuffer(client, quotedMsg.videoMessage, 'video');
    const videoPath = keithRandom('.mp4');
    fs.writeFileSync(videoPath, videoBuffer);

    const ext = audioUrl.split('.').pop().split('?')[0].toLowerCase();
    const audioPath = keithRandom(`.${ext}`);
    const outputPath = keithRandom(".mp4");

    const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(audioPath, response.data);

    exec(`ffmpeg -i ${videoPath} -i ${audioPath} -c:v copy -map 0:v:0 -map 1:a:0 -shortest ${outputPath}`, async (err) => {
      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);
      if (err) {
        console.error("ffmpeg error:", err);
        return reply("❌ Error during audio replacement.");
      }

      const videoBufferOut = fs.readFileSync(outputPath);
      await client.sendMessage(from, {
        video: videoBufferOut,
        mimetype: "video/mp4"
      }, { quoted: mek });

      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("amplify error:", error);
    await reply("❌ An error occurred while processing the media.");
  }
});
