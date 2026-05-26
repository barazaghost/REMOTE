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
//========================================================================================================================
//========================================================================================================================

keith({
  pattern: "fruit",
  aliases: ["fruitinfo", "nutrition"],
  description: "🍋 Get nutritional and botanical info about a fruit",
  category: "Education",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) {
    return reply("🍎 Type a fruit name to look up.\n\nExample: fruit lemon");
  }

  try {
    const res = await axios.get(`${api}/education/fruit?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply("❌ No fruit data found.");
    }

    const { name, family, genus, order, nutritions } = data.result;

    const caption = `🍇 *${name}*\n` +
      `🌿 Family: ${family}\n` +
      `🌱 Genus: ${genus}\n` +
      `🌾 Order: ${order}\n\n` +
      `🥗 *Nutrition per 100g:*\n` +
      `• Calories: ${nutritions.calories} kcal\n` +
      `• Fat: ${nutritions.fat} g\n` +
      `• Sugar: ${nutritions.sugar} g\n` +
      `• Carbs: ${nutritions.carbohydrates} g\n` +
      `• Protein: ${nutritions.protein} g`;

    reply(caption);
  } catch (err) {
    console.error("fruit error:", err);
    reply("❌ Error fetching fruit info: " + err.message);
  }
});
//========================================================================================================================


/*const examples = {
  simplify: "math simplify 2^2+2(2)",
  factor: "math factor x^2-1",
  derive: "math derive x^2+2x",
  integrate: "math integrate x^2+2x",
  zeroes: "math zeroes x^2+2x",
  tangent: "math tangent 2|x^3",
  area: "math area x^3|2|4",
  cos: "math cos pi",
  sin: "math sin 0",
  tan: "math tan 0",
  arccos: "math arccos 1",
  arcsin: "math arcsin 0",
  arctan: "math arctan 0",
  abs: "math abs -1",
  log: "math log 2|8"
};

const validOps = Object.keys(examples);

keith({
  pattern: "math",
  aliases: ["calc", "solve"],
  description: "🧮 Perform math operations like simplify, derive, factor, etc.",
  category: "Education",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, api } = conText;

  if (!q) {
    const usage = Object.entries(examples)
      .map(([op, ex]) => `🔹 ${op} → _${ex}_`)
      .join("\n");

    return reply(
      `📚 Provide an operation and expression.\n\n` +
      `Example usage:\n${usage}`
    );
  }

  const [op, ...exprParts] = q.split(" ");
  const expr = exprParts.join(" ");

  if (!validOps.includes(op)) {
    return reply(`❌ Invalid operation: *${op}*\n\nValid options:\n${validOps.join(", ")}`);
  }

  if (!expr) {
    return reply(`✏️ Provide an expression to ${op}.\n\nExample:\n${examples[op]}`);
  }

  try {
    const url = `${api}/math/${op}?expr=${encodeURIComponent(expr)}`;
    const res = await axios.get(url);
    const data = res.data;

    if (!data.status || !data.result) {
      return reply(`❌ Failed to ${op} expression.`);
    }

    reply(`🧮 *${op.toUpperCase()}*\n📥 Expression: ${data.expression}\n📤 Result: ${data.result}`);
  } catch (err) {
    console.error("math error:", err);
    reply("❌ Error: " + err.message);
  }
});*/
//========================================================================================================================

keith({
  pattern: "poem",
  aliases: ["randompoem", "eduversefull"],
  description: "📖 Get the full educational poem",
  category: "education",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, api } = conText;

  try {
    const res = await axios.get(`${api}/education/randompoem`);
    const data = res.data;

    if (!data.status || !data.result || !data.result.fullText) {
      return reply("❌ Failed to fetch the full poem.");
    }

    const { title, author, fullText } = data.result;
    reply(`📚 *${title}*\n✍️ ${author}\n\n${fullText}`);
  } catch (err) {
    console.error("fullpoem error:", err);
    reply("❌ Error fetching full poem: " + err.message);
  }
});
//=========================================
keith({
  pattern: "dictionary",
  aliases: ["define", "meaning"],
  description: "Look up word definitions and phonetics",
  category: "Education",
  filename: __filename
}, async (from, client, conText) => {
  const { q, reply, mek, api } = conText;

  if (!q) return reply("📚 Type a word to define.\n\nExample: dictionary cat");

  try {
    const res = await axios.get(`${api}/education/dictionary?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result?.meanings) {
      return reply("❌ No definition found.");
    }

    const { word, phonetics, meanings, sourceUrls } = data.result;

    const phoneticText = phonetics.map(p => p.text).filter(Boolean).join(", ");
    const audio = phonetics.find(p => p.audio)?.audio;

    const defs = meanings.map(m => {
      const defs = m.definitions.map((d, i) => `  ${i + 1}. ${d.definition}`).join("\n");
      return `📌 *${m.partOfSpeech}*\n${defs}`;
    }).join("\n\n");

    const caption = `📚 *${word}*\n🔊 Phonetics: ${phoneticText || "—"}\n\n${defs}\n\n🔗 Source: ${sourceUrls[0]}`;

    if (audio) {
      await client.sendMessage(from, {
        audio: { url: audio },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: mek });
    }

    await client.sendMessage(from, { text: caption }, { quoted: mek });
  } catch (err) {
    console.error("dictionary error:", err);
    reply("❌ Error fetching definition: " + err.message);
  }
});
