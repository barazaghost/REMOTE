const { keith } = require("../commandHandler");

keith({
    name: "theme",
    aliases: ["settheme"],
    category: "Settings",
    usePrefix: false,
    usage: "theme <name | list>",
    version: "1.0",
    admin: false,
    cooldown: 10,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const { threadID, messageID, senderID } = event;
        const input = args.join(" ");

        if (!input) {
            return reply("⚠️ Usage: theme <name> or theme list");
        }

        try {
            // NOTE: ws3-fca's theme() inspects the 3rd argument's type to decide whether it's a
            // callback or an initiatorID string — passing initiatorID here means skipping the
            // callback slot entirely: theme(name, threadID, initiatorID), NOT a 4th argument.
            if (input.toLowerCase() === "list") {
                const themes = await client.theme("list", threadID, senderID);
                const names = themes.slice(0, 20).map(t => `• ${t.name}`).join("\n");
                return reply(`🎨 Available themes (first 20):\n${names}`);
            }

            const result = await client.theme(input, threadID, senderID);
            return reply(`✅ Theme changed to "${result.themeName}"`);
        } catch (err) {
            return reply(`❌ Couldn't change theme: ${err.message}`);
        }
    }
});
