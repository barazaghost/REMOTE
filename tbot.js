const TelegramBot = require('node-telegram-bot-api');
const config = require('./set');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');

// Import command handler and logger
const { keith, commands, evt } = require('./commandHandler');
const KeithLogger = require('./logger');

// Initialize bot
const bot = new TelegramBot(config.token, { polling: true });
let adminOnlyMode = false;
const cooldowns = new Map();
const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;

// Bot banner
const botName = `
██╗  ██╗ ███████╗ ██╗ ████████╗ ██╗  ██╗
██║ ██╔╝ ██╔════╝ ██║ ╚══██╔══╝ ██║  ██║
█████╔╝  █████╗   ██║    ██║    ███████║
██╔═██╗  ██╔══╝   ██║    ██║    ██╔══██║
██║  ██╗ ███████╗ ██║    ██║    ██║  ██║
╚═╝  ╚═╝ ╚══════╝ ╚═╝    ╚═╝    ╚═╝  ╚═╝`;

// Load commands from local Cmds folder
function loadLocalCommands() {
    try {
        KeithLogger.info('Loading commands from Cmds folder...');
        const pluginsPath = path.join(__dirname, "Cmds");
        
        if (!fs.existsSync(pluginsPath)) {
            fs.mkdirSync(pluginsPath, { recursive: true });
            KeithLogger.info('Cmds folder created');
            return;
        }
        
        const commandFiles = fs.readdirSync(pluginsPath).filter(file => 
            path.extname(file).toLowerCase() === ".js"
        );

        let loadedCount = 0;
        
        commandFiles.forEach((fileName) => {
            try {
                require(path.join(pluginsPath, fileName));
                loadedCount++;
                KeithLogger.success(`Loaded: ${fileName}`);
            } catch (error) {
                KeithLogger.error(`Error loading ${fileName}: ${error.message}`);
            }
        });
        
        KeithLogger.success(`Successfully loaded ${loadedCount} commands`);
        return loadedCount;
    } catch (error) {
        KeithLogger.error('Failed to load commands:', error.message);
        return 0;
    }
}

// Admin check
async function isUserAdmin(bot, chatId, userId) {
    try {
        const chatAdministrators = await bot.getChatAdministrators(chatId);
        return chatAdministrators.some(admin => admin.user.id === userId);
    } catch (error) {
        return false;
    }
}

// Get group member count
async function getGroupMemberCount(bot, chatId) {
    try {
        const chat = await bot.getChat(chatId);
        return chat.members_count || 'N/A';
    } catch (error) {
        KeithLogger.error('Error getting member count:', error);
        return 'N/A';
    }
}

// Enhanced welcome message handler with profile photo
async function handleNewMemberWelcome(bot, msg) {
    if (!config.greetNewMembers || !config.greetNewMembers.enabled) return;
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    const gifUrl = config.greetNewMembers.gifUrl;
    const groupName = msg.chat.title;
    const joinTime = moment().format('MMMM Do YYYY, h:mm:ss a');
    
    try {
        const memberCount = await getGroupMemberCount(bot, chatId);
        
        for (const member of newMembers) {
            const fullName = `${member.first_name} ${member.last_name || ''}`.trim();
            const username = member.username ? `@${member.username}` : fullName;
            
            // Create welcome message
            const welcomeMessage = `Welcome to ${groupName}!
Hello ${username}! We're excited to have you here.
Group Info:
- Name: ${groupName}
- Total Members: ${memberCount}
- You joined at: ${joinTime}
Please read the group description for rules and guidelines.
Enjoy your stay!`;
            try {
                // Get user profile photos
                const photos = await bot.getUserProfilePhotos(member.id, { limit: 1 });
                
                if (photos.total_count > 0) {
                    // Get the largest available photo
                    const photo = photos.photos[0].pop();
                    const fileId = photo.file_id;
                    
                    // Send photo with welcome message as caption
                    await bot.sendPhoto(chatId, fileId, {
                        caption: welcomeMessage,
                        parse_mode: 'Markdown'
                    });
                } else {
                    // If no profile photo, send welcome message as text
                    await bot.sendMessage(chatId, welcomeMessage, {
                        parse_mode: 'Markdown'
                    });
                }
                
                // Send welcome GIF if configured
                if (gifUrl) {
                    try {
                        await bot.sendAnimation(chatId, gifUrl);
                    } catch (error) {
                        KeithLogger.error("Error sending welcome GIF:", error);
                    }
                }
            } catch (error) {
                KeithLogger.error('Error sending profile photo welcome:', error);
                // Fallback to simple welcome if there's an error
                await bot.sendMessage(chatId, `Welcome, ${fullName}!`);
                if (gifUrl) {
                    try {
                        await bot.sendAnimation(chatId, gifUrl);
                    } catch (gifError) {
                        KeithLogger.error("Error sending fallback GIF:", gifError);
                    }
                }
            }
        }
    } catch (error) {
        KeithLogger.error('Error in welcome handler:', error);
        // Fallback to simple welcome if there's an error
        newMembers.forEach(member => {
            const fullName = `${member.first_name} ${member.last_name || ''}`.trim();
            bot.sendMessage(chatId, `Welcome, ${fullName}!`);
        });
    }
}

// Command execution for local commands
async function executeLocalCommand(bot, command, msg, match) {
    try {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const args = match[1] ? match[1].trim().split(/\s+/) : [];
        const messageReply = msg.reply_to_message;

        const isAdmin = await isUserAdmin(bot, chatId, userId);
        const isBotAdmin = userId.toString() === config.owner_id.toString();
        
        if (adminOnlyMode && !isBotAdmin) {
            return bot.sendMessage(chatId, "Sorry, only the bot admin can use commands right now.");
        }
        
        if (command.role === 2 && !isBotAdmin) {
            return bot.sendMessage(chatId, "Sorry, only the bot admin can use this command.");
        }
        
        if (command.role === 1 && !isBotAdmin && !isAdmin) {
            return bot.sendMessage(chatId, "This command is only available to groups admins");
        }

        // Cooldown check
        const cooldownKey = `${command.pattern}-${userId}`;
        const now = Date.now();
        if (cooldowns.has(cooldownKey)) {
            const lastUsed = cooldowns.get(cooldownKey);
            const cooldownAmount = (command.cooldown || 0) * 1000;
            if (now < lastUsed + cooldownAmount) {
                const timeLeft = Math.ceil((lastUsed + cooldownAmount - now) / 1000);
                return bot.sendMessage(chatId, `Please wait ${timeLeft} more seconds before using the ${command.pattern} command again.`);
            }
        }
        cooldowns.set(cooldownKey, now);

        // Prepare context object with all config and user info
        const context = {
            // Message functions
            reply: (text, options = {}) => {
                return bot.sendMessage(chatId, text, {
                    reply_to_message_id: msg.message_id,
                    ...options
                });
            },
            sendMessage: (text, options = {}) => {
                return bot.sendMessage(chatId, text, options);
            },
            
            // User info
            pushName: `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`,
            sender: msg.from.id,
            owner: config.owner_id,
            isSuperUser: isBotAdmin,
            isAdmin: isAdmin,
            userId: userId,
            chatId: chatId,
            
            // Command info
            q: args.join(' '),
            args: args,
            messageReply: messageReply,
            
            // Bot info
            bot: bot,
            prefix: config.prefix,
            botName: config.botName,
            ownerName: config.ownerName,
            timezone: config.timezone,
            sourceUrl: config.sourceUrl
        };

        // Execute command
        await command.function(msg, bot, context);
        
    } catch (error) {
        KeithLogger.error(`Error executing command ${command.pattern}: ${error}`);
        bot.sendMessage(msg.chat.id, 'An error occurred while executing the command.');
    }
}

// Anti-link function (only works in groups)
async function handleAntiLink(msg) {
    try {
        // Skip if not a group or supergroup
        if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
            return;
        }
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text || msg.caption || '';
        
        if (linkRegex.test(text)) {
            const isAdmin = await isUserAdmin(bot, chatId, userId);
            
            if (!isAdmin && userId.toString() !== config.owner_id.toString()) {
                const warningMsg = await bot.sendMessage(chatId, "Anti-link message detected", {
                    reply_to_message_id: msg.message_id
                });
                
                setTimeout(async () => {
                    try {
                        await bot.deleteMessage(chatId, msg.message_id);
                        
                        setTimeout(async () => {
                            try {
                                await bot.deleteMessage(chatId, warningMsg.message_id);
                            } catch (error) {
                                KeithLogger.error("Error deleting warning message:", error);
                            }
                        }, 5000);
                        
                    } catch (error) {
                        KeithLogger.error("Error deleting anti-link message:", error);
                        bot.sendMessage(chatId, `@${msg.from.username || msg.from.first_name}, links are not allowed here!`);
                    }
                }, 2000);
            }
        }
    } catch (error) {
        KeithLogger.error('Error in anti-link handler:', error);
    }
}

// Register local commands
function registerLocalCommands() {
    commands.forEach(command => {
        const patterns = [command.pattern, ...(command.aliases || [])];
        
        patterns.forEach(pattern => {
            const prefixPattern = `^${config.prefix}${pattern}\\b(.*)$`;
            
            bot.onText(new RegExp(prefixPattern, 'i'), (msg, match) => {
                executeLocalCommand(bot, command, msg, match);
            });
        });
        
        KeithLogger.success(`Registered command: ${command.pattern}`);
    });
}
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
// Message handling with logging
/*bot.on('message', async (msg) => {
    // Log all messages
    KeithLogger.logMessage(msg);
    
    if (config.antiLink && config.antiLink.enabled) {
        await handleAntiLink(msg);
    }
});*/
// Message handling with bot deployer detection
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const lowerText = text.toLowerCase();

    // Log all messages
    KeithLogger.logMessage(msg);

    // Check for bot deployment requests
    if (isBotDeploymentRequest(lowerText)) {
        try {
            const buttons = [
                [
                    { text: '👑 Keith', url: 'https://t.me/keithkeizzah' },
                    { text: '🚀 Laurent', url: 'https://t.me/LaurentSams' }
                ],
                [
                    { text: '💻 Nick', url: 'https://t.me/Nick_Hunter9' },
                    { text: '🎁 Maurice', url: 'https://t.me/mauricegift' }
                ]
            ];

            await bot.sendMessage(chatId, 
                `🤖 Need a bot deployed?\n\n` +
                `Here are our trusted bot deployers who can help you:\n\n` +
                `• Keith - Custom bot development\n` +
                `• Laurent - Bot hosting & deployment\n` +
                `• Nick - Technical setup\n` +
                `• Gifted Maurice - Bot solutions\n\n` +
                `Click any button below to contact them directly!`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: buttons
                    },
                    reply_to_message_id: msg.message_id
                }
            );
        } catch (error) {
            KeithLogger.error('Error sending deployer buttons:', error);
        }
    }

    if (config.antiLink && config.antiLink.enabled) {
        await handleAntiLink(msg);
    }
});

// Function to detect bot deployment requests
function isBotDeploymentRequest(text) {
    const keywords = {
        deploy: ['deploy', 'deployment', 'setup', 'install'],
        host: ['host', 'hosting', 'server', 'vps'],
        need: ['need', 'want', 'looking for', 'searching for', 'nataka', 'niekee'],
        bot: ['bot', 'aniekee', 'nataka']
    };

    // Check if text contains at least one word from deploy/host/need categories AND bot
    const hasDeployHostNeed = 
        keywords.deploy.some(word => text.includes(word)) ||
        keywords.host.some(word => text.includes(word)) ||
        keywords.need.some(word => text.includes(word));

    const hasBot = keywords.bot.some(word => text.includes(word));

    return hasDeployHostNeed && hasBot;
}
//========================================================================================================================
//========================================================================================================================
// New members handling
bot.on('new_chat_members', (msg) => {
    KeithLogger.logEvent('new_member', `New member joined ${msg.chat.title}`);
    handleNewMemberWelcome(bot, msg);
});

// Left member handling
bot.on('left_chat_member', (msg) => {
    KeithLogger.logEvent('member_left', `Member left ${msg.chat.title}`);
});

// Callback query handling
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    try {
        const data = JSON.parse(callbackQuery.data);
        const commandName = data.command;
        const command = commands.find(cmd => cmd.pattern === commandName);
        if (command && command.onReply) {
            command.onReply(bot, chatId, userId, data);
        }
    } catch (error) {
        KeithLogger.error('Error handling callback query:', error);
    }
});

// Error handling
bot.on('polling_error', (error) => {
    KeithLogger.error('Polling error:', error);
});

bot.on('polling_started', () => {
    KeithLogger.event('Bot polling started');
});

// Initialize everything
loadLocalCommands();
registerLocalCommands();

// Show bot info
KeithLogger.banner(botName);
KeithLogger.banner('[ Made by keithkeizzah ]');

module.exports = bot;
