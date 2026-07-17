const { keith } = require("../commandHandler");
const config = require("../set");




keith({
    name: "groupinfo",
    aliases: ["gcinfo", "threadinfo"],
    category: "Group",
    usePrefix: false,
    admin: false,
    usage: "groupinfo",
    version: "1.0",
    cooldown: 10,

    execute: async ({ client, event, reply, keithApi }) => {
        const { threadID, messageID } = event;

        try {
            const info = await client.getThreadInfo(threadID);

            if (!info || info.isGroup === false) {
                return reply("⚠️ This command only works in group chats.");
            }

            const memberCount = info.participantIDs ? info.participantIDs.length : "unknown";
            const adminCount = info.adminIDs ? info.adminIDs.length : 0;

            const msg =
                `╭━━⟮ GROUP INFO ⟯━━┈⊷\n` +
                `┃✵│ Name    : ${info.name || "Unnamed"}\n` +
                `┃✵│ ID      : ${info.threadID}\n` +
                `┃✵│ Members : ${memberCount}\n` +
                `┃✵│ Admins  : ${adminCount}\n` +
                `╰━━━━━━━━━━━━━━━━━┈⊷`;

            return reply(msg);
        } catch (err) {
            return reply(`❌ Couldn't fetch group info: ${err.message}`);
        }
    }
});


keith({
    name: "demote",
    aliases: ["unadmin"],
    category: "Group",
    usePrefix: false,
    admin: true,
    usage: "demote <@mention> (or reply to their message)",
    version: "1.0",
    cooldown: 5,

    execute: async ({ client, event, reply, keithApi }) => {
        const { threadID, messageID, mentions, messageReply } = event;

        let targetID;
        if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (messageReply) {
            targetID = messageReply.senderID;
        }

        if (!targetID) {
            return reply("⚠️ Mention the user, or reply to one of their messages.");
        }

        try {
            const result = await client.gcrule("unadmin", targetID, threadID);
            if (result && result.type === "error_gc_rule") {
                return reply(`❌ ${result.error}`);
            }
            return reply("✅ User demoted from group admin.");
        } catch (err) {
            return reply(`❌ Couldn't demote user: ${err.message}`);
        }
    }
});

keith({
    name: "add",
    aliases: ["invite"],
    category: "Group",
    usePrefix: false,
    admin: true,
    usage: "add [list | number]",
    version: "1.1",
    description: "Add the owner to a group.",
    cooldown: 5,

    async execute({ client, event, args, reply, keithApi }) {
        const threadID = event.threadID;
        const senderID = event.senderID;

        if (senderID !== config.ownerID) {
            return client.sendMessage("❌ You are not authorized to use this command.", threadID);
        }

        const threads = await client.getThreadList(100, null, ["INBOX"]);
        const groups = threads.filter(t => t.isGroup);

        if (args[0] === "list") {
            if (groups.length === 0) return client.sendMessage("❌ No groups found.", threadID);

            const msg = groups.map((g, i) => `${i + 1}. ${g.name || "Unnamed"} (${g.threadID})`).join("\n");
            return client.sendMessage("📋 List of Groups:\n\n" + msg, threadID);
        }

        const index = parseInt(args[0]) - 1;
        const group = groups[index];
        if (!group) return client.sendMessage("❌ Invalid group number.", threadID);

        try {
            const result = await client.gcmember("add", [config.ownerID], group.threadID);
            if (result && result.type === "error_gc") {
                return client.sendMessage(`❌ ${result.error}`, threadID);
            }
            return client.sendMessage(`✅ Owner added to group: ${group.name || "Unnamed Group"}`, threadID);
        } catch (err) {
            console.error("❌ Failed to add owner:", err);
            return client.sendMessage("❌ Couldn't add owner. They might already be in the group or can't be added.", threadID);
        }
    }
});

keith({
    name: "leave",
    aliases: ["left", "exit"],
    category: "Group",
    usePrefix: false,
    description: "Make the bot leave a group or list groups.",
    usage: "leave [list | number]",
    version: "1.4",
    cooldown: 5,
    admin: true,

    async execute({ client, event, args, reply, keithApi }) {
        const senderID = event.senderID;
        const threadID = event.threadID;

        // command is already gated by admin:true (checked against config.ownerID in index.js) —
        // this is just a defensive second check using the same source of truth.
        if (senderID !== config.ownerID) {
            return client.sendMessage("❌ You are not authorized to use this command.", threadID);
        }

        // Restrict basic "leave" command in private chat
        if (!args[0] && event.isGroup === false) {
            return client.sendMessage("⚠️ You can't use `leave` in private chat. Use `leave list` or `leave <number>` instead.", threadID);
        }

        const threads = await client.getThreadList(100, null, ["INBOX"]);
        const groupThreads = threads.filter(t => t.isGroup);

        if (args[0] === "list") {
            if (groupThreads.length === 0) return client.sendMessage("❌ No groups found.", threadID);

            let msg = "📋 List of Groups:\n\n";
            groupThreads.forEach((group, index) => {
                msg += `${index + 1}. ${group.name || "Unnamed Group"} (${group.threadID})\n`;
            });

            return client.sendMessage(msg, threadID);
        }

        const tagEveryone = {
            body: "👋 Goodbye @everyone.",
            mentions: [{
                tag: "@everyone",
                id: threadID
            }]
        };

        if (!args[0]) {
            // leave current group
            await client.sendMessage(tagEveryone, threadID);
            return client.gcmember("remove", [client.getCurrentUserID()], threadID);
        }

        // leave specific group
        const index = parseInt(args[0]) - 1;
        const group = groupThreads[index];

        if (!group) {
            return client.sendMessage("❌ Invalid group number.", threadID);
        }

        try {
            await client.sendMessage(tagEveryone, group.threadID);
            await client.gcmember("remove", [client.getCurrentUserID()], group.threadID);
            return client.sendMessage(`✅ Left group: ${group.name || "Unnamed Group"}`, threadID);
        } catch (err) {
            console.error("❌ Error leaving group:", err);
            return client.sendMessage("❌ Failed to leave the group.", threadID);
        }
    }
});
