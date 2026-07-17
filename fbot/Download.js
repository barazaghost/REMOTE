
const { keith } = require("../commandHandler");

const axios = require("axios");

const YOUTUBE_URL_REGEX = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/i;

keith({
    name: "play",
    aliases: ["ytm", "music"],
    category: "Media",
    usePrefix: false,
    usage: "ytmusic <song name | YouTube link>",
    version: "2.0",
    admin: false,
    cooldown: 10,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const { threadID, messageID } = event;
        const input = args.join(" ");

        if (!input) {
            return reply("⚠️ Please provide a song name or a YouTube link.\nUsage: ytmusic <song name | link>");
        }

        try {
            await client.setMessageReaction("⏳", messageID).catch(() => {});

            let videoUrl;
            let title = null;
            let thumbnail = null;

            if (YOUTUBE_URL_REGEX.test(input)) {
                // Already a direct YouTube link — skip the search step.
                videoUrl = input;
            } else {
                const { data: searchData } = await axios.get(`${keithApi}/search/yts`, {
                    params: { query: input },
                });

                if (!searchData || searchData.status !== true || !searchData.result || searchData.result.length === 0) {
                    await client.setMessageReaction("❌", messageID).catch(() => {});
                    return reply(`❌ No results found for "${input}".`);
                }

                const top = searchData.result[0];
                videoUrl = top.url;
                title = top.title;
                thumbnail = top.thumbnail;
            }

            const { data: downloadData } = await axios.get(`${keithApi}/download/audio`, {
                params: { url: videoUrl },
            });

            if (!downloadData || downloadData.status !== true || !downloadData.result) {
                await client.setMessageReaction("❌", messageID).catch(() => {});
                return reply("⚠️ Couldn't get an audio download link for that video.");
            }

            const audioUrl = downloadData.result;

            // Stream the audio straight from the CDN to Messenger — no temp file needed,
            // since sendMessage only requires a Node Readable stream, not specifically
            // one that came from disk.
            const audioResponse = await axios({
                url: audioUrl,
                method: "GET",
                responseType: "stream",
            });

            await client.setMessageReaction("✅", messageID).catch(() => {});

            const caption = title ? `🎵 ${title}\n🔗 ${videoUrl}` : `🎵 Here's your track!\n🔗 ${videoUrl}`;

            try {
                await client.sendMessage(
                    { body: caption, attachment: audioResponse.data },
                    threadID
                );
            } catch (sendErr) {
                console.error("❌ Error sending audio:", sendErr);
                return reply("⚠️ Downloaded the audio but couldn't send it.");
            }
        } catch (error) {
            console.error("❌ ytmusic error:", error);
            await client.setMessageReaction("❌", messageID).catch(() => {});
            return reply(`⚠️ Something went wrong: ${error.message}`);
        }
    },
});
