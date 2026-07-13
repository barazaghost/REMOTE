
const { keith, uniqueCommands } = require("../commandHandler");
const config = require("../set");

function groupByCategory(cmds) {
    const groups = new Map();
    for (const cmd of cmds) {
        const category = cmd.category || "Other";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(cmd);
    }
    for (const list of groups.values()) {
        list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
}

function sortedCategories(groups) {
    
    return [...groups.keys()].sort((a, b) => a.localeCompare(b));
}

function formatCommandLine(cmd, index) {
    return `┃${index}│${cmd.name}`;
}

function buildMenu({ pushName, botName, owner, prefix, cmds }) {
    
    const categories = sortedCategories(groups);

    let menu = `Hello, ${pushName || "User"}\n`;
    menu += `╭━━⟮ ${botName} ⟯━━━━┈⊷\n`;
    menu += `┃✵╭──────────────\n`;
    menu += `┃✵│ Owner : ${owner}\n`;
    menu += `┃✵│ Commands: ${cmds.length}\n`;
    menu += `┃✵│ Prefix: ${prefix}\n`;
    menu += `┃✵╰─────────────\n`;
    menu += `╰━━━━━━━━━━━━━━━━┈⊷\n\n`;

    for (const category of categories) {
        const cmdList = groups.get(category);
        menu += `╭━━⟮ ${category.toUpperCase()} ⟯━━┈⊷\n`;
        cmdList.forEach((cmd, index) => {
            menu += `${formatCommandLine(cmd, index + 1)}\n`;
        });
        menu += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;
    }

    menu += `👉 help [command] for details`;
    return menu;
}

function buildCommandDetail(cmd) {
    const aliasLine = cmd.aliases && cmd.aliases.length ? cmd.aliases.join(", ") : "none";
    return (
        `╭━━⟮ COMMAND INFO ⟯━━┈⊷\n` +
        `┃✵│ Name     : ${cmd.name}\n` +
        `┃✵│ Aliases  : ${aliasLine}\n` +
        `┃✵│ Category : ${cmd.category || "Other"}\n` +
        `┃✵│ Usage    : ${cmd.usage}\n` +
        `┃✵│ Prefix   : ${cmd.usePrefix ? "✅ Required" : "❌ Not required"}\n` +
        `┃✵│ Admin    : ${cmd.admin ? "✅ Yes" : "❌ No"}\n` +
        `┃✵│ Version  : ${cmd.version}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━┈⊷`
    );
}

keith({
    name: "help",
    aliases: ["menu", "commands", "h"],
    category: "General",
    usePrefix: false,
    usage: "help [command_name] (optional) | help all",
    version: "1.5",

    async execute({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const cmds = uniqueCommands();

        if (args.length > 0 && args[0].toLowerCase() !== "all") {
            const commandName = args[0].toLowerCase();
            const command = cmds.find(
                c => c.name === commandName || (c.aliases && c.aliases.includes(commandName))
            );

            if (!command) {
                return api.sendMessage(`❌ Command '${commandName}' not found.`, threadID, messageID);
            }

            return api.sendMessage(buildCommandDetail(command), threadID, messageID);
        }

        
        let pushName = "User";
        try {
            const info = await api.getUserInfo(senderID);
            pushName = info?.firstName || info?.name || "User";
        } catch (_) {
            
        }

        const menu = buildMenu({
            pushName,
            botName: config.botName,
            owner: config.ownerName || config.ownerID,
            prefix: config.prefix,
            cmds,
        });

        return api.sendMessage(menu, threadID, messageID);
    }
});
