
const { keith } = require("../commandHandler");

keith({
    name: "react",
    aliases: ["rt"],
    category: "Fun",
    usePrefix: false,
    usage: "react <emoji> (reply to the message you want to react to)",
    version: "1.0",
    admin: false,
    cooldown: 3,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply) {
            return reply("⚠️ Reply to the message you want to react to.\nUsage: react <emoji>");
        }

        const emoji = args[0];
        if (!emoji) {
            return reply("⚠️ Please provide an emoji.\nUsage: react <emoji>");
        }

        try {
            await client.setMessageReaction(emoji, messageReply.messageID);
            return reply(`✅ Reacted with ${emoji}`);
        } catch (err) {
            return reply(`❌ Couldn't react: ${err.message}`);
        }
    }
});
