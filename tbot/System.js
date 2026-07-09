const { keith } = require('../commandHandler');
const util = require('util');
const { exec } = require('child_process');
const execAsync = util.promisify(exec);
const os = require('os');
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");

const process = require('process');
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
    pattern: "restart",
    aliases: ["reboot", "reset"],
    category: "system",
    description: "Restart the bot",
    role: 2 // Only bot admin can use
},

async (msg, bot, context) => {
    const { reply, isSuperUser } = context;

    if (!isSuperUser) {
        return await reply("❌ Owner Only Command!");
    }

    try {
        await reply("🔄 Restarting bot...");
        
    
        setTimeout(() => {
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error("Restart error:", error);
        await reply("❌ Restart failed.");
    }
});
//========================================================================================================================

keith({
    pattern: "update",
    aliases: ["updatenow", "sync"],
    category: "system",
    description: "Update the bot to the latest version",
    role: 2 // Only bot admin can use
},

async (msg, bot, context) => {
    const { reply, isSuperUser } = context;

    if (!isSuperUser) {
        return await reply("❌ Owner Only Command!");
    }

    try {
        await reply("🔍 Checking for new updates...");

        const { data: commitData } = await axios.get("https://api.github.com/repos/Keithkeizzah/T-BOT/commits/main");
        const latestCommitHash = commitData.sha;

        // Check current commit (you might want to store this in a file)
        const commitFile = path.join(__dirname, '..', 'current_commit.txt');
        let currentHash = '';
        
        if (fs.existsSync(commitFile)) {
            currentHash = fs.readFileSync(commitFile, 'utf8').trim();
        }

        if (latestCommitHash === currentHash) {
            return await reply("✅ Your bot is already up-to-date!");
        }

        await reply("🚀 Updating Bot...");

        const zipPath = path.join(__dirname, '..', 'bot-latest.zip');
        const { data: zipData } = await axios.get("https://github.com/Keithkeizzah/T-BOT/archive/main.zip", { 
            responseType: "arraybuffer" 
        });
        fs.writeFileSync(zipPath, zipData);

        await reply("📦 Extracting the latest bot code...");
        const extractPath = path.join(__dirname, '..', 'latest');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        
        await reply("🔄 Replacing files...");
        const sourcePath = path.join(extractPath, 'T-BOT-main');
        const destinationPath = path.join(__dirname, '..');
        copyFolderSync(sourcePath, destinationPath);
        
        // Save the new commit hash
        fs.writeFileSync(commitFile, latestCommitHash);

        // Clean up
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply("✅ Update complete! Restarting the bot...");
        
        // Graceful shutdown and restart
        setTimeout(() => {
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error("Update error:", error);
        await reply("❌ Update failed. Please try manually.");
    }
});

function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip config files to preserve custom settings
        if (item === "set.js" || item === "set.env" || item === "app.json" || item === "config.js") {
            console.log(`Skipping ${item} to preserve custom settings.`);
            continue;
        }

        // Skip node_modules and other large directories
        if (item === "node_modules" || item === ".git" || item === "logs") {
            console.log(`Skipping ${item} directory.`);
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
//========================================================================================================================
//
keith({
    pattern: "ping",
    aliases: ["speed", "test"],
    category: "system",
    description: "Check bot's response time",
    cooldown: 3
},

async (msg, bot, context) => {
    const { reply } = context;

    try {
        const startTime = Date.now();
        
        // Send initial message
        const sentMessage = await reply("🏓 Pong!");
        
        // Calculate ping after message is sent
        const endTime = Date.now();
        const pingTime = endTime - startTime;

        // Edit the original message with the ping time
        await bot.editMessageText(`🏓 Pong!\n⚡ Ping: ${pingTime}ms`, {
            chat_id: context.chatId,
            message_id: sentMessage.message_id
        });

    } catch (error) {
        console.error('[ERROR]', error);
        await reply('An error occurred while checking ping.');
    }
});
//========================================================================================================================
//

keith({
    pattern: "uptime",
    aliases: ["up", "status"],
    category: "system",
    description: "Display bot statistics",
    cooldown: 5
},

async (msg, bot, context) => {
    const { reply, botName } = context;

    try {
        const uptime = process.uptime(); 
        const memoryUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
        const cpuLoad = os.loadavg()[0].toFixed(2);

        const statsMessage = `
📊 ${botName} Statistics 📊

🕒 Uptime: ${formatUptime(uptime)}
💾 Memory Usage: ${memoryUsage} MB
⚡ CPU Load: ${cpuLoad}
        `.trim();

        await reply(statsMessage);
    } catch (error) {
        console.error('[ERROR]', error);
        await reply('An error occurred while fetching the stats.');
    }
});

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsRemaining = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secondsRemaining}s`;
}

keith({
    pattern: "eval",
    aliases: ["e", "run"],
    category: "owner",
    description: "Execute JavaScript code",
    role: 2, // Only bot admin can use
    cooldown: 3
},

async (msg, bot, context) => {
    const { reply, q, isSuperUser } = context;

    if (!isSuperUser) {
        return await reply("❌ This command is only for bot owner.");
    }

    if (!q) {
        return await reply("❌ Please provide code to evaluate.\nExample: .eval context.pushName");
    }

    try {
        await bot.sendChatAction(context.chatId, 'typing');

        // Enhanced context for eval
        const evalContext = {
            // Your context variables (direct access)
            pushName: context.pushName,
            sender: context.sender,
            owner: context.owner,
            isSuperUser: context.isSuperUser,
            isAdmin: context.isAdmin,
            userId: context.userId,
            chatId: context.chatId,
            q: context.q,
            args: context.args,
            messageReply: context.messageReply,
            botName: context.botName,
            prefix: context.prefix,
            ownerName: context.ownerName,
            timezone: context.timezone,
            sourceUrl: context.sourceUrl,
            
            // Functions
            reply: context.reply,
            api: context.api,
            sendMessage: context.sendMessage,
            
            // Core objects
            bot: bot,
            context: context,
            msg: msg,
            
            
            // Modules
            require: require,
            process: process,
            axios: require('axios'),
            fs: require('fs'),
            path: require('path'),
            config: require('../set'),
            util: util
        };

        // Wrap the code in async function
        let code = q.trim();
        const isExpression = !code.includes(';') && !code.includes('return') && !code.includes('{');
        
        if (isExpression) {
            code = `return ${code}`;
        }

        // Execute the code
        const fn = new Function(...Object.keys(evalContext), code);
        const result = await fn(...Object.values(evalContext));

        // Format the output
        let output;
        if (result === undefined || result === null) {
            output = "✅ Executed successfully (no return value)";
        } else if (typeof result === 'object') {
            output = util.inspect(result, { depth: 3, colors: false });
        } else {
            output = result.toString();
        }

        // Send the result (truncate if too long)
        const maxLength = 2000;
        if (output.length > maxLength) {
            output = output.substring(0, maxLength) + "\n... (truncated)";
        }

        await reply(`📝 *Input:* \`\`\`${q}\`\`\`\n\n💡 *Output:* \`\`\`${output}\`\`\``, {
            parse_mode: 'Markdown'
        });

    } catch (error) {
        await reply(`❌ *Error:* \`\`\`${error.message}\`\`\``, {
            parse_mode: 'Markdown'
        });
    }
});


keith({
    pattern: "shell",
    aliases: ["exec", "terminal"],
    category: "owner",
    description: "Execute shell commands",
    role: 2, // Only bot admin can use
    cooldown: 5
},

async (msg, bot, context) => {
    const { reply, q, isSuperUser } = context;

    if (!isSuperUser) {
        return await reply("❌ This command is only for bot owner.");
    }

    if (!q) {
        return await reply("❌ Please provide a shell command.\nExample: .shell ls -la");
    }

    try {
        await bot.sendChatAction(context.chatId, 'typing');

        // Execute the shell command
        const { stdout, stderr } = await execAsync(q, { 
            timeout: 30000, // 30 second timeout
            maxBuffer: 1024 * 1024 // 1MB buffer
        });

        let output = '';
        
        if (stderr) {
            output += `⚠️ *Stderr:*\n\`\`\`${stderr}\`\`\`\n\n`;
        }
        
        if (stdout) {
            output += `📄 *Stdout:*\n\`\`\`${stdout}\`\`\``;
        } else if (!stderr) {
            output = '✅ Command executed successfully (no output)';
        }

        // Truncate if too long
        const maxLength = 4000;
        if (output.length > maxLength) {
            output = output.substring(0, maxLength) + '\n\n... (output truncated)';
        }

        await reply(`💻 *Command:* \`\`\`${q}\`\`\`\n\n${output}`, {
            parse_mode: 'Markdown'
        });

    } catch (error) {
        let errorMessage = error.message;
        
        if (error.killed) {
            errorMessage = 'Command was killed (timeout or manual termination)';
        } else if (error.code === 'ENOENT') {
            errorMessage = 'Command not found';
        } else if (error.signal === 'SIGTERM') {
            errorMessage = 'Command timed out';
        }

        await reply(`❌ *Error executing command:* \`\`\`${q}\`\`\`\n\n💥 *Error:* \`\`\`${errorMessage}\`\`\``, {
            parse_mode: 'Markdown'
        });
    }
});

    
