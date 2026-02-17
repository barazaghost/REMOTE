
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


const BOX_TOP    = "╭━━━━━━━━━━━━━━━╮";
const BOX_MIDDLE = "├━━━━━━━━━━━━━━━┤";
const BOX_BOTTOM = "╰━━━━━━━━━━━━━━━╯";

// 🎬 Search dramas
keith({
  pattern: "drama",
  aliases: ["dramasearch", "dramas"],
  category: "Movie",
  description: "Search drama movies (usage: .drama <keyword>)",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;
  if (!q) return reply("📌 Usage: .drama <keyword>");

  try {
    const res = await axios.get(`${api}/dramabox/search?q=${encodeURIComponent(q)}`);
    const results = res.data.result;
    if (!results || !results.length) return reply("📭 No dramas found.");

    const formatted = results.map((d, idx) =>
      `${BOX_TOP}\n│ ${idx + 1}. ${d.title}\n│ Id ${d.book_id}\n${BOX_MIDDLE}\n│ Views: ${d.views}\n${BOX_BOTTOM}`
    ).join("\n\n");

    const caption = `🎬 *Drama Search Results* (${results.length} total)\n\n${formatted}\n\n📌 *Reply with a number to view episodes*`;

    const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
    const messageId = sent.key.id;

    // Listen for replies to search results
    client.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;

      const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
      const chatId = msg.key.remoteJid;

      if (!isReply || !responseText) return;

      const index = parseInt(responseText.trim());
      if (isNaN(index) || index < 1 || index > results.length) {
        return client.sendMessage(chatId, {
          text: `❌ Invalid number. Please reply with a number between 1 and ${results.length}.`,
          quoted: msg
        });
      }

      await client.sendMessage(chatId, { react: { text: "🎬", key: msg.key } });

      try {
        const drama = results[index - 1];
        const detailRes = await axios.get(`${api}/dramabox/detail?bookId=${drama.book_id}`);
        const detail = detailRes.data.result;

        // ✅ Show drama details with image
        await client.sendMessage(chatId, {
          image: { url: detail.thumbnail },
          caption: `🎬 *${detail.title}*\n\n📝 ${detail.description}\n📅 Uploaded: ${detail.upload_date}`
        }, { quoted: msg });

        const episodes = detail.episode_list;
        const epFormatted = episodes.map((ep, idx) =>
          `${BOX_TOP}\n│ ${idx + 1}. Episode ${ep.episode}\n│ Id ${ep.id}\n${BOX_BOTTOM}`
        ).join("\n\n");

        const epCaption = `📺 *${detail.title}* — Episodes (${episodes.length} total)\n\n${epFormatted}\n\n📌 *Reply with an episode number to get stream*`;

        const epSent = await client.sendMessage(chatId, { text: epCaption }, { quoted: msg });
        const epMessageId = epSent.key.id;

        // Listen for replies to episode list
        client.ev.on("messages.upsert", async (epUpdate) => {
          const epMsg = epUpdate.messages[0];
          if (!epMsg.message) return;

          const epResponse = epMsg.message.conversation || epMsg.message.extendedTextMessage?.text;
          const isEpReply = epMsg.message.extendedTextMessage?.contextInfo?.stanzaId === epMessageId;
          const epChatId = epMsg.key.remoteJid;

          if (!isEpReply || !epResponse) return;

          const epIndex = parseInt(epResponse.trim());
          if (isNaN(epIndex) || epIndex < 1 || epIndex > episodes.length) {
            return client.sendMessage(epChatId, {
              text: `❌ Invalid episode number. Please reply with a number between 1 and ${episodes.length}.`,
              quoted: epMsg
            });
          }

          await client.sendMessage(epChatId, { react: { text: "📺", key: epMsg.key } });

          try {
            const episode = episodes[epIndex - 1];
            const streamRes = await axios.get(`${api}/dramabox/stream?bookId=${drama.book_id}&episode=${episode.episode}`);
            const stream = streamRes.data.result;

            // ✅ Send video directly with video/mp4 mimetype
            await client.sendMessage(epChatId, {
              video: { url: stream.video_url },
              mimetype: "video/mp4",
              caption: `▶️ *${detail.title}* — Episode ${episode.episode}`
            }, { quoted: epMsg });
          } catch (err) {
            await client.sendMessage(epChatId, {
              text: `❌ Error fetching stream: ${err.message}`,
              quoted: epMsg
            });
          }
        });
      } catch (err) {
        await client.sendMessage(chatId, {
          text: `❌ Error fetching drama detail: ${err.message}`,
          quoted: msg
        });
      }
    });
  } catch (err) {
    reply(`❌ Failed to search dramas: ${err.message}`);
  }
});
//========================================================================================================================

keith({
  pattern: "trailer",
  aliases: ["movietrailer", "filmtrailer", "preview"],
  category: "Movie",
  description: "Search for a movie and send its trailer video"
},
async (from, client, conText) => {
  const { q, mek, reply, api } = conText;

  if (!q) {
    return reply("📌 Usage: trailer <movie name>\nExample: trailer As Good As Dead");
  }

  try {
    // Step 1: Search for movie
    const { data: search } = await axios.get(
      `${api}/moviebox/search?q=${encodeURIComponent(q)}`
    );

    if (!search.status || !search.result?.results?.length) {
      return reply("❌ No movies found for that query.");
    }

    // Pick the first result
    const movie = search.result.results[0];

    // Step 2: Fetch trailer info
    const { data: trailer } = await axios.get(
      `${api}/movie/trailer?q=${encodeURIComponent(movie.url)}`
    );

    if (!trailer.status || !trailer.result?.trailerUrl) {
      return reply("❌ Trailer not available.");
    }

    // Step 3: Send trailer video with rating and type
    await client.sendMessage(from, {
      video: { url: trailer.result.trailerUrl },
      caption: `🎬 *${movie.title}*\n⭐ Rating: ${movie.rating}\n🎞️ Type: ${movie.type}\n\n${trailer.result.description}`
    }, { quoted: mek });

  } catch (err) {
    reply("⚠️ An error occurred while fetching the trailer.");
  }
});
//========================================================================================================================


//========================================================================================================================


keith({
  pattern: "neverhaveiever",
  aliases: ["nhie", "neverever"],
  description: "Get a random 'Never Have I Ever' prompt",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/never-have-i-ever`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a prompt.");
    }

    reply(data.result);
  } catch (err) {
    console.error("neverhaveiever error:", err);
    reply("❌ Error fetching prompt: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "quote",
  aliases: ["inspire", "wisdom"],
  description: "Get a random quote",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/quote`);
    const data = res.data;

    if (!data.status || !data.result?.quote || !data.result?.author) {
      return reply("❌ Failed to fetch a quote.");
    }

    reply(`"${data.result.quote}"\n— ${data.result.author}`);
  } catch (err) {
    console.error("quote error:", err);
    reply("❌ Error fetching quote: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "quickquiz",
  description: "Get a random multiple-choice question",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/question`);
    const data = res.data;

    if (!data.status || !data.result?.question || !Array.isArray(data.result.allAnswers)) {
      return reply("❌ Failed to fetch a question.");
    }

    const { question, allAnswers, correctAnswer } = data.result;
    const options = allAnswers.map((opt, i) => `${i + 1}. ${opt}`).join("\n");

    const caption = `❓ *${question}*\n\n${options}\n\n📌 Reply with the correct number.`;

    const sent = await client.sendMessage(from, { text: caption }, { quoted: mek });
    const messageId = sent.key.id;

    client.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;

      const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
      const chatId = msg.key.remoteJid;

      if (!isReply) return;

      const index = parseInt(responseText.trim()) - 1;
      const selected = allAnswers[index];

      if (!selected) {
        return client.sendMessage(chatId, {
          text: "❌ Invalid number. Reply with a valid option.",
          quoted: msg
        });
      }

      const resultText = selected === correctAnswer
        ? `✅ Correct! *${correctAnswer}*`
        : `❌ Wrong. The correct answer is *${correctAnswer}*`;

      await client.sendMessage(chatId, { text: resultText }, { quoted: msg });
    });
  } catch (err) {
    console.error("question error:", err);
    reply("❌ Error fetching question: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "meme",
  aliases: ["memes", "funmeme"],
  description: "Get a random meme",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/meme`);
    const data = res.data;

    if (!data.status || !data.url || !data.title) {
      return reply("❌ Failed to fetch meme.");
    }

    await client.sendMessage(from, {
      image: { url: data.url },
      caption: data.title
    }, { quoted: mek });
  } catch (err) {
    console.error("meme error:", err);
    reply("❌ Error fetching meme: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "jokes",
  aliases: ["joke", "funny"],
  description: "Get a random joke",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/jokes`);
    const data = res.data;

    if (!data.status || !data.result?.setup || !data.result?.punchline) {
      return reply("❌ Failed to fetch a joke.");
    }

    reply(`${data.result.setup}\n\n${data.result.punchline}`);
  } catch (err) {
    console.error("jokes error:", err);
    reply("❌ Error fetching joke: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "fact",
  aliases: ["funfact", "randomfact"],
  description: "Get a random fun fact",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/fact`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a fact.");
    }

    reply(data.result);
  } catch (err) {
    console.error("fact error:", err);
    reply("❌ Error fetching fact: " + err.message);
  }
});
//========================================================================================================================


keith({
  pattern: "paranoia",
  aliases: ["paranoiaprompt", "mostlikely"],
  description: "Get a random paranoia question",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/paranoia`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a paranoia prompt.");
    }

    reply(data.result);
  } catch (err) {
    console.error("paranoia error:", err);
    reply("❌ Error fetching paranoia: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "wyrather",
  description: "Get a random truth question",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/would-you-rather`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a truth prompt.");
    }

    reply(data.result);
  } catch (err) {
    console.error("truth error:", err);
    reply("❌ Error fetching truth: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "dare",
  description: "Get a random dare question",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/dare`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a truth prompt.");
    }

    reply(data.result);
  } catch (err) {
    console.error("truth error:", err);
    reply("❌ Error fetching truth: " + err.message);
  }
});
//========================================================================================================================

keith({
  pattern: "truth",
  description: "Get a random truth question",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/fun/truth`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ Failed to fetch a truth prompt.");
    }

    reply(data.result);
  } catch (err) {
    console.error("truth error:", err);
    reply("❌ Error fetching truth: " + err.message);
  }
});
//====================================================================================================================
keith({
  pattern: "quoteaudio",
  aliases: ["audioquote", "inspireaudio"],
  description: "Play a surreal quote audio with caption",
  category: "fun",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, mek, api } = conText;

  try {
    const res = await axios.get(`${api}/quote/audio`);
    const data = res.data;

    if (!data.status || !data.result?.mp3 || !Array.isArray(data.result.data)) {
      return reply("❌ Failed to fetch quote audio.");
    }

    const quotes = data.result.data
      .filter(item => item.type === "quote" && item.text)
      .map((item, i) => `🧠 ${i + 1}. ${item.text}`)
      .join("\n");

    const caption = `${quotes}`;

    await client.sendMessage(from, {
      audio: { url: data.result.mp3 },
      mimetype: 'audio/mpeg',
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("quowteaudio error:", err);
    reply("❌ Error fetching quote audio: " + err.message);
  }
});
