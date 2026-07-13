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

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;
        const input = args.join(" ");

        if (!input) {
            return api.sendMessage("⚠️ Usage: theme <name> or theme list", threadID, messageID);
        }

        try {
            
            if (input.toLowerCase() === "list") {
                const themes = await api.theme("list", threadID, senderID);
                const names = themes.slice(0, 40).map(t => `• ${t.name}`).join("\n");
                return api.sendMessage(`🎨 Available themes:\n${names}`, threadID, messageID);
            }

            const result = await api.theme(input, threadID, senderID);
            return api.sendMessage(`✅ Theme changed to "${result.themeName}"`, threadID, messageID);
        } catch (err) {
            return api.sendMessage(`❌ Couldn't change theme: ${err.message}`, threadID, messageID);
        }
    }
});
