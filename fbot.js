const fs = require("fs");
const path = require("path");
const express = require("express");
const { login } = require("ws3-fca");

const config = require("./set");
const { commands, events, uniqueCommands } = require("./commandHandler");
const KeithLogger = require("./logger");

// Kept for backward compatibility — cmds/help.js and cmds/cmd.js still read
// from global.commands directly, so we point it at the same Map commandHandler owns.
global.commands = commands;
global.events = events;

const app = express();
const PORT = config.port;

const botPrefix = config.prefix;
const cooldowns = new Map();

const loadEvents = () => {
    try {
        const files = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
        for (const file of files) {
            require(`./events/${file}`); // self-registers into `events` via evt()
        }
        console.log(`✅ Loaded ${events.size} event(s)`);
    } catch (err) {
        console.error("❌ Error loading events:", err);
    }
};

const loadCommands = () => {
    try {
        const files = fs.readdirSync("./cmds").filter(file => file.endsWith(".js"));
        for (const file of files) {
            require(`./cmds/${file}`); // self-registers into `commands` via keith()
        }
        console.log(`✅ Loaded ${uniqueCommands().length} command(s) (${commands.size} names+aliases)`);
    } catch (err) {
        console.error("❌ Error loading commands:", err);
    }
};

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.listen(PORT, () => {
    console.log(`🌐 Web Server running at http://localhost:${PORT}`);
});

const credentials = config.appState
    ? { appState: config.appState }
    : { email: config.email, password: config.password };

if (!config.appState && !(config.email && config.password)) {
    console.error("❌ No Facebook login available. Set APPSTATE, or FB_EMAIL + FB_PASSWORD, in set.env.");
    process.exit(1);
}

const detectedURLs = new Set();

const startBot = () => {
    try {
        login(credentials, async (err, client) => {
            if (err) {
                console.error("❌ Login failed:", err);
                return;
            }

            try {
                console.clear();
                client.setOptions(config.option);
                console.log("🤖 Bot is now online!");

                try {
                    await client.sendMessage("🤖 Bot has started successfully!", config.ownerID);
                } catch (startupMsgError) {
                    KeithLogger.warn(
                        `Could not send startup message to OWNER_ID "${config.ownerID}". ` +
                        `Check that it's a valid, reachable Facebook user ID.`,
                        startupMsgError.message || startupMsgError
                    );
                }

                events.forEach((handler) => {
                    if (handler.onStart) handler.onStart(client);
                });

                client.listenMqtt(async (err, event) => {
                    if (err) {
                        console.error("❌ Event error:", err);
                        return client.sendMessage("❌ Error while listening to events.", config.ownerID);
                    }

                    // Shortcut for "send this back to wherever the event came from, threaded
                    // as a reply". Every command gets this instead of building the
                    // (msg, threadID, messageID) call itself.
                    const reply = (msg) => client.sendMessage(msg, event.threadID, event.messageID);

                    try {
                        KeithLogger.logEvent(event);

                        if (events.has(event.type)) {
                            await events.get(event.type).execute({ client, event });
                        }

                        const urlRegex = /(https?:\/\/[^\s]+)/gi;
                        if (event.body && urlRegex.test(event.body)) {
                            const urlCommand = commands.get("url");
                            if (urlCommand) {
                                const detectedURL = event.body.match(urlRegex)[0];
                                const key = `${event.threadID}-${detectedURL}`;
                                if (detectedURLs.has(key)) return;
                                detectedURLs.add(key);

                                try {
                                    await urlCommand.execute({ 
                                        client, 
                                        event, 
                                        args: [], 
                                        reply, 
                                        keithApi: "https://apiskeith2-production-ec66.up.railway.app"
                                    });
                                } catch (error) {
                                    console.error("❌ URL command failed:", error);
                                }

                                setTimeout(() => detectedURLs.delete(key), 3600000);
                            }
                        }

                        if (event.body) {
                            let args = event.body.trim().split(/ +/);
                            let commandName = args.shift().toLowerCase();
                            let command;

                            if (commands.has(commandName)) {
                                command = commands.get(commandName);
                            } else if (event.body.startsWith(botPrefix)) {
                                commandName = event.body.slice(botPrefix.length).split(/ +/).shift().toLowerCase();
                                command = commands.get(commandName);
                            }

                            if (command) {
                                if (command.usePrefix && !event.body.startsWith(botPrefix)) return;

                                const requiredFields = ["name", "execute", "usage", "version"];
                                const isValid = requiredFields.every(field => field in command && command[field]);
                                if (!isValid || typeof command.execute !== "function") {
                                    console.warn(`⚠️ Command '${commandName}' structure is invalid.`);
                                    return reply(`⚠️ Command '${commandName}' is broken.`);
                                }

                                if (command.admin && event.senderID !== config.ownerID) {
                                    return reply("❌ This command is restricted to the bot owner.");
                                }

                                const now = Date.now();
                                const cooldown = (command.cooldown || 0) * 1000;
                                const key = `${event.senderID}-${command.name}`;
                                const lastUsed = cooldowns.get(key) || 0;

                                if (now - lastUsed < cooldown) {
                                    const wait = ((cooldown - (now - lastUsed)) / 1000).toFixed(1);
                                    return reply(`⏳ Please wait ${wait}s before using '${command.name}' again.`);
                                }

                                try {
                                    await command.execute({ client, event, args, reply, keithApi: config.keithApi });
                                    cooldowns.set(key, now);
                                } catch (error) {
                                    console.error(`❌ Command '${command.name}' failed:`, error);
                                    reply(`❌ Error while executing '${command.name}'.`);
                                    client.sendMessage(`❌ Error in '${command.name}':\n${error.message}`, config.ownerID);
                                }
                            }
                        }
                    } catch (eventError) {
                        console.error("❌ Error in event handler:", eventError);
                        client.sendMessage("❌ Critical error during event handling.", config.ownerID);
                    }
                });
            } catch (innerError) {
                console.error("❌ Critical bot error:", innerError);
            }
        });
    } catch (error) {
        console.error("❌ Bot crashed at launch:", error);
    }
};

process.on("unhandledRejection", (reason) => {
    console.error("⚠️ Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

loadEvents();
loadCommands();
startBot();
