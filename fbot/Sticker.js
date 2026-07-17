const { keith } = require("../commandHandler");

keith({
    name: "sticker",
    aliases: ["s"],
    category: "Sticker",
    usePrefix: false,
    usage: "sticker <search term>",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const { threadID, messageID } = event;
        const query = args.join(" ");

        if (!query) {
            return reply("⚠️ Usage: sticker <search term>");
        }

        try {
            const results = await client.stickers.search(query);
            if (!results || results.length === 0) {
                return reply(`❌ No stickers found for "${query}".`);
            }

            const chosen = results[0];
            return reply({ sticker: chosen.stickerID });
        } catch (err) {
            return reply(`❌ Sticker search failed: ${err.message}`);
        }
    }
});
