const { keith } = require("../commandHandler");
const config = require("../set");

function followPromise(client, userID, shouldFollow) {
    return new Promise((resolve, reject) => {
        client.follow(userID, shouldFollow, (err, data) => {
            if (err) return reject(err instanceof Error ? err : new Error(JSON.stringify(err)));
            resolve(data);
        });
    });
}

keith({
    name: "follow",
    aliases: ["fw"],
    category: "Owner",
    usePrefix: false,
    admin: false,
    usage: "follow <@mention|uid> [on|off]",
    version: "1.0",
    cooldown: 10,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const { threadID, messageID } = event;
        const eventMentions = event.mentions;

        let targetID;
        if (eventMentions && Object.keys(eventMentions).length > 0) {
            targetID = Object.keys(eventMentions)[0];
        } else if (args[0] && /^\d+$/.test(args[0])) {
            targetID = args[0];
        }

        if (!targetID) {
            return reply("⚠️ Usage: follow <@mention|uid> [on|off]");
        }

        const mode = args[args.length - 1]?.toLowerCase();
        const shouldFollow = mode !== "off";

        try {
            await followPromise(client, targetID, shouldFollow);
            return reply(shouldFollow ? "✅ Now following." : "✅ Unfollowed.");
        } catch (err) {
            return reply(`❌ Couldn't update follow status: ${err.message}`);
        }
    }
});


 


keith({
    name: "prefix",
    aliases: ["px"],
    category: "General",
    usePrefix: false,
    usage: "prefix",
    version: "1.2",
    description: "Displays the bot's prefix",
    cooldown: 5,
    admin: false,

    execute: async ({ reply }) => {
        const botPrefix = config.prefix || "/";
        const botName = config.botName || "My Bot";

        return reply(`🤖 Bot Information\n━━━━━━━━━━━━━━━━\n📌 Prefix: ${botPrefix}\n🆔 Bot Name: ${botName}\n━━━━━━━━━━━━━━━━\nThanks for using my bot!`);
    }
});       


//const { keith } = require("../commandHandler");

keith({
    name: "del",
    aliases: ["delete", "recall"],
    category: "Utility",
    usePrefix: false,
    usage: "unsend (reply to bot message)",
    version: "1.1",
    cooldown: 5,
    admin: false,

    execute: async ({ client, event, reply, keithApi }) => {
        if (!event.messageReply) {
            return reply("⚠️ Please reply to a bot message to unsend it.");
        }

        const { messageReply } = event;

        // Check if the replied message was sent by the bot
        if (messageReply.senderID !== client.getCurrentUserID()) {
            return reply("⚠️ You can only unsend bot messages!");
        }

        try {
            await client.unsendMessage(messageReply.messageID);
            console.log(`✅ Message unsent: ${messageReply.messageID}`);
        } catch (error) {
            console.error("❌ Error unsending message:", error);
            reply("❌ Failed to unsend the message.");
        }
    },
});
                   
