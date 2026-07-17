const { keith } = require("../commandHandler");





keith({
    name: "ping",
    aliases: ["pong"],
    category: "General",
    usePrefix: false,
    usage: "ping",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ client, event, reply }) => {
        const { threadID, messageID } = event;
        
        const startTime = Date.now();
        
      
        
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        
        // Edit the message or send new one with ping time
        return reply(`🏓 Pong! ${pingTime.toFixed(4)} ms`);
    }
});

//const { keith } = require("../commandHandler");

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
}

keith({
    name: "uptime",
    aliases: ["runtime"],
    category: "General",
    usePrefix: false,
    usage: "uptime",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ reply }) => {
        const uptime = process.uptime();
        return reply(`⏱️ Bot uptime: ${formatUptime(uptime)}`);
    }
});
