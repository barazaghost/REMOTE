const { keith } = require("../commandHandler");

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
