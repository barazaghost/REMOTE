const { 
    default: keithConnect, 
    isJidGroup, 
    jidNormalizedUser,
    isJidBroadcast,
    downloadMediaMessage, 
    downloadContentFromMessage,
    downloadAndSaveMediaMessage, 
    DisconnectReason, 
    getContentType,
    fetchLatestBaileysVersion, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    jidDecode 
} = require("@whiskeysockets/baileys");

const { 
    keithStore,
    loadSession,
    keithBuffer, 
    keithJson, 
    formatAudio, 
    keithRandom,
    formatVideo,
    verifyJidState
} = require("./lib/botFunctions");

const { getSudoNumbers, setSudo, delSudo, isSudo } = require("./database/sudo");

const { session, dev } = require("./settings");

const { keith, commands, evt } = require("./commandHandler");
const { 
    Sticker, 
    createSticker, 
    StickerTypes 
} = require("wa-sticker-formatter");
const KeithLogger = require('./logger');
const pino = require("pino");
//const { dev, database, sessionName, session } = require("./settings");
const axios = require("axios");
const fs = require("fs-extra");
const mime = require('mime-types');
const path = require("path");
const { Boom } = require("@hapi/boom");
const express = require("express");
const { promisify } = require('util');
const stream = require('stream');
const FormData = require('form-data');
const pipeline = promisify(stream.pipeline);

//========================================================================================================================
// Database Imports
//=====================================================================================================================
// Add with other database imports
// Add with other database imports
// Add with other database imports
// Add with other database imports
const { 
    initAntiSpamDB,
    getAntiSpamSettings,
    addUserMessage,
    getUserMessageCount,
    clearUserMessages,
    clearAllGroupMessages,
    getSpamWarnCount,
    incrementSpamWarnCount,
    resetSpamWarnCount,
    clearAllSpamWarns
} = require('./database/antispam');
const { 
    initAntiCallDB,
    getAntiCallSettings,
    updateAntiCallSettings,
    getCallCount,
    incrementCallCount,
    resetCallCount,
    getCallWarnCount,
    incrementCallWarnCount,
    resetCallWarnCount,
    clearAllCallWarns
} = require('./database/anticall');
const { 
    initAntiBadDB,
    getAntiBadSettings,
    getBadWords,
    containsBadWord,
    getBadWarnCount,
    incrementBadWarnCount,
    resetBadWarnCount,
    clearAllBadWarns
} = require('./database/antibad');
const { 
    initAntiTagDB,
    getAntiTagSettings,
    getTagWarnCount,
    incrementTagWarnCount,
    resetTagWarnCount,
    clearAllTagWarns
} = require('./database/antitag');
const { 
    initAntiStickerDB,
    getAntiStickerSettings,
    getStickerWarnCount,
    incrementStickerWarnCount,
    resetStickerWarnCount,
    clearAllStickerWarns
} = require('./database/antisticker');

// Add with other database imports
const { 
    initAutoBlockDB,
    getAutoBlockSettings,
    getTriggerWords,
    containsTriggerWord,
    getBlockWarnCount,
    incrementBlockWarnCount,
    resetBlockWarnCount,
    clearAllBlockWarns
} = require('./database/autoblock');
const { initAntiDeleteDB, getAntiDeleteSettings } = require('./database/antidelete');
const { getGreetSettings, initGreetDB, repliedContacts, updateGreetSettings } = require('./database/greet');
const { initAutoStatusDB, getAutoStatusSettings } = require('./database/autostatus');

const { getAutoReadSettings, initAutoReadDB } = require('./database/autoread');
const { initSettingsDB, getSettings, updateSettings, getSetting } = require('./database/settings');
const { initAutoBioDB, getAutoBioSettings, updateAutoBioSettings } = require('./database/autobio');
const { initAntiLinkDB, getAntiLinkSettings, updateAntiLinkSettings, getWarnCount, incrementWarnCount, resetWarnCount, clearAllWarns } = require('./database/antilink');
const { initAntiStatusMentionDB, getAntiStatusMentionSettings, updateAntiStatusMentionSettings, getStatusWarnCount, incrementStatusWarnCount, resetStatusWarnCount, clearAllStatusWarns } = require('./database/antistatusmention');
//const { initAntiSpamDB, getAntiSpamSettings, updateAntiSpamSettings, getSpamWarnCount, incrementSpamWarnCount, resetSpamWarnCount, clearAllSpamWarns, addUserMessageTimestamp, isUserSpamming } = require('./database/antispam');
const { initPresenceDB } = require('./database/presence');
const { initChatbotDB, saveConversation, getConversationHistory, clearConversationHistory, getLastConversation, getChatbotSettings, updateChatbotSettings, availableVoices } = require('./database/chatbot');
const { initGroupEventsDB, getGroupEventsSettings } = require('./database/groupevents');
//const { initAntiCallDB, getAntiCallSettings } = require('./database/anticall');
//const { getAutoDownloadStatusSettings, initAutoDownloadStatusDB } = require('./database/autodownloadstatus');
// Initialize all databases
async function initializeDatabases() {
    try {
        await initSettingsDB();
        await initAntiDeleteDB();
        await initGreetDB();
        await initAntiTagDB();
        await initAutoStatusDB();
        await initAutoReadDB();
        await initAutoBioDB();
        await initAntiLinkDB();
        await initAntiBadDB();
        await initAntiSpamDB();
        await initAutoBlockDB();
        await initAntiStatusMentionDB();
      //  await initAntiSpamDB();
        await initAntiStickerDB(); 
        await initPresenceDB();
        await initChatbotDB();
        await initGroupEventsDB();
         await initAntiCallDB();
       // await initAutoDownloadStatusDB();
        console.log('All databases initialized successfully');
    } catch (error) {
        console.error('Error initializing databases:', error);
    }
}

initializeDatabases().catch(console.error);
//========================================================================================================================
const plugins = commands.filter(cmd => !cmd.dontAddCommandList).length;

//=======================================================================================================================
const scheduleMessage = () => {
    // FIRST MESSAGE: December 15, 2025 at 11:40 AM in Nairobi time (GMT+3)
    const targetDate1 = new Date('2025-12-24T23:59:00+03:00');
    
    const now = new Date();
    const delay1 = targetDate1.getTime() - now.getTime();
    
    if (delay1 > 0) {
        setTimeout(async () => {
            try {
                // Send to external number
                const targetJid = '254748387615@s.whatsapp.net';
                await client.sendMessage(targetJid, {
                    text: `🎄✨ Merry Christmas, Keith! ✨🎄  
Wishing you joy, peace, and all the happiness this season brings. May your days be filled with warmth, laughter, and the magic of Christmas.  

See how much I wished you here 🥰 
https://keithsite.vercel.app/xmas?name=Keith

Wish others too Keith 
https://keithsite.vercel.app/xmas`
                });
                console.log(`✅ Scheduled message 1 sent to ${targetJid} at ${new Date().toLocaleString()}`);
            } catch (error) {
                console.error('Failed to send scheduled message 1:', error);
            }
        }, delay1);
        
        console.log(`⏰ Message 1 scheduled for: ${targetDate1.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} (Nairobi Time)`);
    } else {
        console.log('Target date 1 has already passed!');
    }

    // SECOND MESSAGE: Example - send on January 1, 2025 at 12:00 PM
    const targetDate2 = new Date('2026-01-25T12:00:00+03:00'); // Change date/time as needed
    
    const delay2 = targetDate2.getTime() - now.getTime();
    
    if (delay2 > 0) {
        setTimeout(async () => {
            try {
                // Send to bot's own account
                await client.sendMessage(client.user.id, {
                    text: `‼️UPDATES ALERT‼️
                    ─────────────────────
                    ○ added creatgroup command
                    ○ togroupstatus 
                    ○ fixed all downloads 
                    ○ fixed all group commands no more errors
                    ○ added aiphoto/flatai -to generate ai image in different styles
                    ○ fixed vision - you can use vision or vision2 to analyze an image
                    ○ added trailer command - to check on movie/series trailers
                    ○ added logout command - ⛔️🚫this is very dangerous since it will logout your bot 
                    ○ fixed removebg - use removebg / removebg2 to remove background image
                    ○ fixed ephoto and photofunia logo generator 
                        ─────────────────────
                        join our channel for more
                        https://whatsapp.com/channel/0029VbC0HmuBfxoFk5KPcS33
                        
                        if you experienced any error share with the developer for bot efficiency 
                        +254748387615
                        regards Keith`
                });
                console.log(`✅ Scheduled message 2 sent to bot (${client.user.id}) at ${new Date().toLocaleString()}`);
            } catch (error) {
                console.error('❌ Failed to send scheduled message 2:', error);
            }
        }, delay2);
        
        console.log(`⏰ Message 2 scheduled for: ${targetDate2.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} (Nairobi Time)`);
    } else {
        console.log('❌ Target date 2 has already passed!');
    }
};
//========================================================================================================================

// API call to Keith AI Text
async function getAIResponse(message, userJid) {
    try {
        const history = await getConversationHistory(userJid, 5);
        
        let context = '';
        if (history.length > 0) {
            context = history.map(conv => 
                `User: ${conv.user}\nAI: ${conv.ai}`
            ).join('\n') + '\n';
        }

        const fullMessage = context + `Current: ${message}`;
        
        const response = await axios.get(`https://apiskeith.top/keithai?q=${encodeURIComponent(fullMessage)}`);
        
        if (response.data.status && response.data.result) {
            return response.data.result;
        } else {
            console.error('Chatbot API returned invalid response:', response.data);
            return "I'm sorry, I couldn't process your message right now.";
        }
    } catch (error) {
        console.error('Chatbot API error:', error);
        return "I'm having trouble connecting right now. Please try again later.";
    }
}

// API call to Keith AI Text-to-Speech
async function getAIAudioResponse(message, voice = 'Kimberly') {
    try {
        const response = await axios.get(`https://apiskeith.top/ai/text2speech?q=${encodeURIComponent(message)}&voice=${voice}`);
        
        if (response.data.status && response.data.result && response.data.result.URL) {
            return {
                url: response.data.result.URL,
                text: message // Return the original message text
            };
        } else {
            console.error('Audio API returned invalid response:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Chatbot Audio API error:', error);
        return null;
    }
}

// API call to Keith AI Text-to-Video
async function getAIVideoResponse(message) {
    try {
        const response = await axios.get(`https://apiskeith.top/text2video?q=${encodeURIComponent(message)}`);
        
        if (response.data.success && response.data.results) {
            return {
                url: response.data.results,
                text: `Generated video for: ${message}`
            };
        } else {
            console.error('Video API returned invalid response:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Chatbot Video API error:', error);
        return null;
    }
}

// API call to Keith AI Image Generation (Flux)
async function getAIImageResponse(message) {
    try {
        const response = await axios.get(`https://apiskeith.top/ai/flux?q=${encodeURIComponent(message)}`);
        
        // Since Flux returns image directly, we use the API URL as image source
        return {
            url: `https://apiskeith.top/ai/flux?q=${encodeURIComponent(message)}`,
            text: `Generated image for: ${message}`
        };
    } catch (error) {
        console.error('Chatbot Image API error:', error);
        return null;
    }
}

// API call to Keith AI Vision Analysis
async function getAIVisionResponse(imageUrl, question) {
    try {
        const response = await axios.get(`https://apiskeith.top/ai/gemini-vision?image=${encodeURIComponent(imageUrl)}&q=${encodeURIComponent(question)}`);
        
        if (response.data.status && response.data.result) {
            return response.data.result;
        } else {
            console.error('Vision API returned invalid response:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Chatbot Vision API error:', error);
        return null;
    }
}

// Download media and convert to buffer
async function downloadMedia(mediaUrl) {
    try {
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error downloading media:', error);
        return null;
    }
}

// Get direct image URL from WhatsApp message
function getImageUrl(message) {
    if (message?.imageMessage) {
        return message.imageMessage.url;
    }
    return null;
}

// Chatbot detection and response
// Chatbot detection and response
async function handleChatbot(client, message, from, sender, isGroup, isSuperUser, quoted, pushName, groupName) {
    try {
        // Get settings for this specific chat/group
        const settings = await getChatbotSettings(from, isGroup ? groupName : pushName, isGroup ? 'group' : 'private');
        
        // Skip if chatbot is off for this chat
        if (!settings || settings.status === 'off') return;
        
        // Skip super users
        if (isSuperUser) return;

        const text = message?.conversation || 
                    message?.extendedTextMessage?.text || 
                    message?.imageMessage?.caption || '';

        // Check for image message for vision analysis
        if (message?.imageMessage && text && (text.toLowerCase().includes('analyze') || text.toLowerCase().includes('what') || text.toLowerCase().includes('describe') || text.toLowerCase().includes('vision'))) {
            return await handleVisionAnalysis(client, message, from, sender, quoted);
        }

        if (!text) return;

        // Check trigger based on settings
        let shouldRespond = false;
        let cleanMessage = text;
        
        if (isGroup) {
            // Group handling based on trigger
            if (settings.trigger === 'mention') {
                const botMention = `@${client.user.id.split(':')[0]}`;
                if (text.includes(botMention)) {
                    shouldRespond = true;
                    cleanMessage = text.replace(botMention, '').trim();
                }
            } else if (settings.trigger === 'all') {
                shouldRespond = true;
            }
        } else {
            // Private chat handling
            if (settings.trigger === 'dm' || settings.trigger === 'all') {
                shouldRespond = true;
            }
        }

        if (!shouldRespond || !cleanMessage) return;

        // Determine response type from message
        const responseType = determineResponseType(cleanMessage);
        cleanMessage = cleanMessage.replace(/audio|voice|video|image|generate/gi, '').trim();

        // Handle different response types using chat-specific settings
        switch (responseType) {
            case 'audio':
                await handleAudioResponse(client, from, sender, cleanMessage, settings.voice, quoted || message);
                break;
            case 'video':
                await handleVideoResponse(client, from, sender, cleanMessage, quoted || message);
                break;
            case 'image':
                await handleImageResponse(client, from, sender, cleanMessage, quoted || message);
                break;
            default:
                await handleTextResponse(client, from, sender, cleanMessage, quoted || message);
                break;
        }

    } catch (error) {
        console.error('Chatbot handler error:', error);
    }
}

// Determine response type based on message content
function determineResponseType(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('video') || lowerMessage.includes('generate video')) {
        return 'video';
    } else if (lowerMessage.includes('image') || lowerMessage.includes('generate image') || lowerMessage.includes('picture')) {
        return 'image';
    } else if (lowerMessage.includes('audio') || lowerMessage.includes('voice')) {
        return 'audio';
    }
    return 'text';
}

// Handle text response
async function handleTextResponse(client, from, sender, message, quoted) {
    const aiResponse = await getAIResponse(message, sender);
    await client.sendMessage(from, { 
        text: aiResponse
    }, { 
        quoted: quoted 
    });
    await saveConversation(sender, message, aiResponse, 'text');
}

// Handle audio response - FIXED: Get AI response first, then convert to audio
async function handleAudioResponse(client, from, sender, message, voice, quoted) {
    try {
        // First get the AI text response
        const aiTextResponse = await getAIResponse(message, sender);
        
        // Then convert the AI response to audio
        const audioData = await getAIAudioResponse(aiTextResponse, voice);
        
        if (audioData && audioData.url) {
            const audioBuffer = await downloadMedia(audioData.url);
            if (audioBuffer) {
                await client.sendMessage(from, {
                    audio: audioBuffer,
                    ptt: false,
                    mimetype: 'audio/mpeg'
                }, { 
                    quoted: quoted 
                });
                await saveConversation(sender, message, aiTextResponse, 'audio', audioData.url);
                return;
            }
        }
        
        // Fallback to text if audio fails
        console.error('Audio generation failed, falling back to text response');
        await client.sendMessage(from, { 
            text: aiTextResponse
        }, { 
            quoted: quoted 
        });
        await saveConversation(sender, message, aiTextResponse, 'text');
        
    } catch (error) {
        console.error('Audio response error:', error);
        // Fallback to text on error
        await handleTextResponse(client, from, sender, message, quoted);
    }
}

// Handle video response
async function handleVideoResponse(client, from, sender, message, quoted) {
    const videoData = await getAIVideoResponse(message);
    
    if (videoData && videoData.url) {
        const videoBuffer = await downloadMedia(videoData.url);
        if (videoBuffer) {
            await client.sendMessage(from, {
                video: videoBuffer,
                caption: `🎥 ${videoData.text}`
            }, { 
                quoted: quoted 
            });
            await saveConversation(sender, message, videoData.text, 'video', videoData.url);
            return;
        }
    }
    
    console.error('Video generation failed for message:', message);
    // Don't send error message to chat
}

// Handle image response
async function handleImageResponse(client, from, sender, message, quoted) {
    const imageData = await getAIImageResponse(message);
    
    if (imageData && imageData.url) {
        const imageBuffer = await downloadMedia(imageData.url);
        if (imageBuffer) {
            await client.sendMessage(from, {
                image: imageBuffer,
                caption: `🖼️ ${imageData.text}`
            }, { 
                quoted: quoted 
            });
            await saveConversation(sender, message, imageData.text, 'image', imageData.url);
            return;
        }
    }
    
    console.error('Image generation failed for message:', message);
    // Don't send error message to chat
}

// Handle vision analysis - SIMPLIFIED: Use direct image URL
async function handleVisionAnalysis(client, message, from, sender, quoted) {
    try {
        const imageUrl = getImageUrl(message);
        
        if (!imageUrl) {
            console.error('No image found for vision analysis');
            return;
        }

        const question = message.imageMessage.caption || "What's in this image?";
        const visionResponse = await getAIVisionResponse(imageUrl, question);
        
        if (visionResponse) {
            await client.sendMessage(from, { 
                text: `🔍 Vision Analysis:\n\n${visionResponse}`
            }, { 
                quoted: quoted 
            });
            await saveConversation(sender, question, visionResponse, 'vision', imageUrl);
        } else {
            console.error('Vision analysis failed for image:', imageUrl);
            // Don't send error message to chat
        }
    } catch (error) {
        console.error('Vision analysis error:', error);
        // Don't send error message to chat
    }
}

            
// Anti Status Mention Functions
//========================================================================================================================

// Check for status mention messages
// Check for status mention messages
function isStatusMention(message) {
    return !!message?.groupStatusMentionMessage;
}

// Anti Status Mention detection function
async function detectAndHandleStatusMention(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Get settings for this specific group
        const settings = await getAntiStatusMentionSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Skip if user is admin or super user
        if (isAdmin || isSuperAdmin || isSuperUser) return;

        // Check for status mention
        if (!isStatusMention(message.message)) return;

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Status mention detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete message first
        await client.sendMessage(from, { delete: message.key });

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for sending status mention!`,
                mentions: [sender]
            });
            resetStatusWarnCount(from, sender);
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Status mention deleted!`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementStatusWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} warnings for status mentions!`,
                    mentions: [sender]
                });
                resetStatusWarnCount(from, sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! No status mentions allowed!`,
                    mentions: [sender]
                });
            }
        }

    } catch (error) {
        console.error('Anti-status-mention error:', error);
    }
}
//========================================================================================================================
// Auto-Block detection function (DM only)
//========================================================================================================================
async function detectAndHandleAutoBlock(client, message, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid;
        
        // Skip if it's a group or status broadcast
        if (from.endsWith('@g.us') || from === 'status@broadcast') return;

        // Get text from message
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.message?.imageMessage?.caption || '';

        if (!text) return;

        // Get autoblock settings
        const settings = await getAutoBlockSettings();
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Skip if sender is super user (owner)
        if (isSuperUser) return;

        // Get trigger words
        const triggerWordsList = await getTriggerWords();
        const triggerWords = triggerWordsList.map(w => w.word);
        
        if (triggerWords.length === 0) return;

        // Check if message contains trigger words
        const hasTrigger = containsTriggerWord(text, triggerWords);
        
        if (!hasTrigger) return;

        // Handle based on action
        if (settings.action === 'block') {
            // Block the user
            await client.updateBlockStatus(from, 'block');
            
            // Send block message if set
            if (settings.block_message) {
                await client.sendMessage(from, { text: settings.block_message });
            }
            
            console.log(`🔨 Auto-blocked ${from} for trigger word in DM`);
        } 
        else if (settings.action === 'delete') {
            // Delete the message only
            await client.sendMessage(from, { delete: message.key });
            console.log(`🗑️ Deleted trigger message from ${from}`);
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementBlockWarnCount(from);
            
            if (warnCount >= settings.warn_limit) {
                // Block after reaching limit
                await client.updateBlockStatus(from, 'block');
                
                if (settings.block_message) {
                    await client.sendMessage(from, { text: settings.block_message });
                }
                
                console.log(`🔨 Auto-blocked ${from} after ${warnCount} warnings`);
                resetBlockWarnCount(from);
            } else {
                // Send warning
                const warningMsg = `⚠️ Warning ${warnCount}/${settings.warn_limit}\n\nYour message contained prohibited content. Further violations will result in a block.`;
                await client.sendMessage(from, { text: warningMsg });
                
                // Delete the message
                await client.sendMessage(from, { delete: message.key });
                
                console.log(`⚠️ Warning ${warnCount}/${settings.warn_limit} sent to ${from}`);
            }
        }

    } catch (error) {
        console.error('Auto-block error:', error);
    }
}
//========================================================================================================================
// Anti-Bad Words detection function
//========================================================================================================================
async function detectAndHandleBadWords(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Get text from message
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.message?.imageMessage?.caption || 
                    message.message?.videoMessage?.caption || '';

        if (!text) return;

        // Get settings for this specific group
        const settings = await getAntiBadSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Check if admins are exempt and user is admin
        if (settings.exempt_admins && (isAdmin || isSuperAdmin)) return;

        // Skip if user is super user
        if (isSuperUser) return;

        // Get bad words list for this group
        const badWordsList = await getBadWords(from);
        const badWordObjects = badWordsList.map(w => w.word);
        
        if (badWordObjects.length === 0) return;

        // Check if message contains bad words
        const hasBadWord = containsBadWord(text, badWordObjects, settings.filter_type);
        
        if (!hasBadWord) return;

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Inappropriate language detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete the message first
        await client.sendMessage(from, { delete: message.key });

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for using inappropriate language!`,
                mentions: [sender]
            });
            resetBadWarnCount(from, sender);
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Message deleted! Inappropriate language is not allowed.`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementBadWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} warnings for inappropriate language!`,
                    mentions: [sender]
                });
                resetBadWarnCount(from, sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! Please refrain from using inappropriate language.`,
                    mentions: [sender]
                });
            }
        }

    } catch (error) {
        console.error('Anti-bad words error:', error);
    }
}
//========================================================================================================================
//========================================================================================================================
// Anti-Sticker detection function
//========================================================================================================================
async function detectAndHandleSticker(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Check if it's a sticker message
        const isSticker = !!message.message?.stickerMessage;
        if (!isSticker) return;

        // Get settings for this specific group
        const settings = await getAntiStickerSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Skip if user is admin or super user
        if (isAdmin || isSuperAdmin || isSuperUser) return;

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Sticker detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete the sticker first
        await client.sendMessage(from, { delete: message.key });

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for sending stickers!`,
                mentions: [sender]
            });
            resetStickerWarnCount(from, sender);
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Sticker deleted! No stickers allowed!`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementStickerWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} warnings for sending stickers!`,
                    mentions: [sender]
                });
                resetStickerWarnCount(from, sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! No stickers allowed in this group!`,
                    mentions: [sender]
                });
            }
        }

    } catch (error) {
        console.error('Anti-sticker error:', error);
    }
}
//========================================================================================================================
// Anti-Tag detection function
//========================================================================================================================
async function detectAndHandleTag(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Get mentioned JIDs from the message
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const mentionedCount = mentionedJid.length;
        
        // If no mentions, return
        if (mentionedCount === 0) return;

        // Get settings for this specific group
        const settings = await getAntiTagSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Check if admins are exempt and user is admin
        if (settings.exempt_admins && (isAdmin || isSuperAdmin)) return;

        // Skip if user is super user
        if (isSuperUser) return;

        // Check if mentions exceed allowed limit
        const allowedMentions = settings.allowed_mentions || 0;
        if (mentionedCount <= allowedMentions) return; // Within allowed limit

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Tagging detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete the message first
        await client.sendMessage(from, { delete: message.key });

        const mentionList = mentionedJid.map(jid => `@${jid.split('@')[0]}`).join(', ');

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for tagging ${mentionedCount} people! (Limit: ${allowedMentions})`,
                mentions: [sender]
            });
            resetTagWarnCount(from, sender);
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Message deleted! Tagging limited to ${allowedMentions} mention(s) per message.`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementTagWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} warnings for excessive tagging!`,
                    mentions: [sender]
                });
                resetTagWarnCount(from, sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! Tagging limited to ${allowedMentions} mention(s) per message.\nYou tagged: ${mentionList}`,
                    mentions: [sender, ...mentionedJid]
                });
            }
        }

    } catch (error) {
        console.error('Anti-tag error:', error);
    }
}
//========================================================================================================================
// Anti-Spam detection function
//========================================================================================================================
async function detectAndHandleSpam(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Get settings for this specific group
        const settings = await getAntiSpamSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;

        // Check if admins are exempt and user is admin
        if (settings.exempt_admins && (isAdmin || isSuperAdmin)) return;

        // Skip if user is super user
        if (isSuperUser) return;

        // Add this message to user's history
        addUserMessage(from, sender);

        // Get message count in the time window
        const msgCount = getUserMessageCount(from, sender, settings.time_window);

        // If under limit, return
        if (msgCount <= settings.message_limit) return;

        // If bot not admin, just warn
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Spam detected from @${sender.split('@')[0]}! (${msgCount} msgs in ${settings.time_window}s)\nPromote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Get the user's recent messages to delete them
        const key = `${from}:${sender}`;
        const userMsgTimestamps = userMessages.get(key) || [];
        
        // Delete all recent messages from this user (within time window)
        try {
            // Note: We can't easily delete multiple messages at once in WhatsApp,
            // so we'll delete the current message and notify
            await client.sendMessage(from, { delete: message.key });
        } catch (err) {
            console.error('Error deleting spam message:', err);
        }

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            // Remove user immediately
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for spamming! (${msgCount} msgs in ${settings.time_window}s)`,
                mentions: [sender]
            });
            
            // Clear their data
            clearUserMessages(from, sender);
            resetSpamWarnCount(from, sender);
        } 
        else if (settings.action === 'delete') {
            // Just delete and warn
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Spam detected! (${msgCount} msgs in ${settings.time_window}s)\nSlow down!`,
                mentions: [sender]
            });
            
            // Clear their message history to give them a fresh start
            clearUserMessages(from, sender);
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementSpamWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                // Remove after reaching warn limit
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} spam warnings!`,
                    mentions: [sender]
                });
                
                // Clear their data
                clearUserMessages(from, sender);
                resetSpamWarnCount(from, sender);
            } else {
                // Send warning
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}!\nSpam detected: ${msgCount} msgs in ${settings.time_window}s.\nSlow down or you'll be removed!`,
                    mentions: [sender]
                });
                
                // Clear their message history to give them a fresh start for next warning
                clearUserMessages(from, sender);
            }
        }

    } catch (error) {
        console.error('Anti-spam error:', error);
    }
}
//========================================================================================================================

// Anti Spam detection function
/*async function detectAndHandleSpam(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        const settings = await getAntiSpamSettings();
        
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (settings.status === 'off' || !isGroup) return;
        if (isAdmin || isSuperAdmin || isSuperUser) return;

        // Add message timestamp
        addUserMessageTimestamp(sender);

        // Check if user is spamming
        const isSpamming = isUserSpamming(sender, settings.message_limit, settings.time_window);
        
        if (!isSpamming) return;

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Spam detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete the spam message
        await client.sendMessage(from, { delete: message.key });

        // Handle actions
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for spamming!`,
                mentions: [sender]
            });
            resetSpamWarnCount(sender);
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Spam message deleted!`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementSpamWarnCount(sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} spam warnings!`,
                    mentions: [sender]
                });
                resetSpamWarnCount(sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! Stop spamming!`,
                    mentions: [sender]
                });
            }
        }

        // Clear user's message history after handling spam
        userMessageTimestamps.delete(sender);

    } catch (error) {
        console.error('Anti-spam error:', error);
    }
}*/
//========================================================================================================================
// Helper function to detect links
function isAnyLink(text) {
    if (!text) return false;
    const linkPattern = /https?:\/\/[^\s]+/gi;
    return linkPattern.test(text);
}

//
async function detectAndHandleLinks(client, message, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser) {
    try {
        if (!message?.message || message.key.fromMe) return;
        
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Only process if it's a group
        if (!isGroup) return;

        // Get settings for this specific group
        const settings = await getAntiLinkSettings(from);
        
        // If settings don't exist or status is off, return
        if (!settings || settings.status === 'off') return;
        
        // Skip if user is admin or super user
        if (isAdmin || isSuperAdmin || isSuperUser) return;

        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.message?.imageMessage?.caption || '';

        if (!text || !isAnyLink(text)) return;

        // If bot not admin
        if (!isBotAdmin) {
            await client.sendMessage(from, { 
                text: `⚠️ Link detected from @${sender.split('@')[0]}! Promote me to admin to take action.`,
                mentions: [sender]
            });
            return;
        }

        // Delete message first
        await client.sendMessage(from, { delete: message.key });

        // Handle actions based on group settings
        if (settings.action === 'remove') {
            await client.groupParticipantsUpdate(from, [sender], 'remove');
            await client.sendMessage(from, { 
                text: `🚫 @${sender.split('@')[0]} removed for sending links!`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'delete') {
            await client.sendMessage(from, { 
                text: `🗑️ @${sender.split('@')[0]} - Link deleted!`,
                mentions: [sender]
            });
        } 
        else if (settings.action === 'warn') {
            const warnCount = incrementWarnCount(from, sender);
            
            if (warnCount >= settings.warn_limit) {
                await client.groupParticipantsUpdate(from, [sender], 'remove');
                await client.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} removed after ${warnCount} warnings!`,
                    mentions: [sender]
                });
                resetWarnCount(from, sender);
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${sender.split('@')[0]}! No links allowed!`,
                    mentions: [sender]
                });
            }
        }

    } catch (error) {
        console.error('Anti-link error:', error);
    }
}
        
//========================================================================================================================
//========================================================================================================================

const PORT = process.env.PORT || 3000;
const app = express();
let client;

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.listen(PORT, () => KeithLogger.info(`Server Running on Port: ${PORT}`));

const sessionDir = path.join(__dirname, "session");

loadSession();

let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;

// Global settings variable
let botSettings = {};

async function loadBotSettings() {
    try {
        botSettings = await getSettings();
        KeithLogger.success('Bot settings loaded from database');
    } catch (error) {
        KeithLogger.error('Error loading bot settings:', error);
        // Fallback to original settings.js values
        botSettings = {
            prefix: prefix,
            author: author,
            url: url,
            gurl: gurl,
            timezone: timezone,
            botname: botname,
            packname: packname,
            mode: mode
        };
    }
}

async function startKeith() {
    try {
        // Load settings before starting
        await loadBotSettings();
        
        const { version, isLatest } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) {
            store.destroy();
        }
        store = new keithStore();
        
        const keithSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['KEITH-MD', "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Error occurred' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            }
        };

        client = keithConnect(keithSock);
        KeithLogger.setClientInstance(client);
        
        store.bind(client.ev);

        client.ev.process(async (events) => {
            if (events['creds.update']) {
                await saveCreds();
            }
        });

        try {
            const pluginsPath = path.join(__dirname, "Cmds");
            fs.readdirSync(pluginsPath).forEach((fileName) => {
                if (path.extname(fileName).toLowerCase() === ".js") {
                    try {
                        require(path.join(pluginsPath, fileName));
                    } catch (e) {
                        KeithLogger.error(`Failed to load ${fileName}:`, e);
                    }
                }
            });
        } catch (error) {
            KeithLogger.error("Error reading plugins folder:", error);
        }

        KeithLogger.success("Plugin Files Loaded");
        
   let lastCallTime = 0;
const callDelay = 5000; // 5 seconds between messages to prevent spam

client.ev.on('call', async (callData) => {
    try {
        const settings = await getAntiCallSettings();
        
        // Skip if anti-call is disabled
        if (!settings.status) return;

        const callId = callData[0].id;
        const callerId = callData[0].from;
        
        // Skip if it's the bot itself
        if (callerId === client.user.id) return;

        console.log(`📞 Incoming call from ${callerId}`);

        // Handle based on action
        if (settings.action === 'block') {
            // Reject and block the caller immediately
            try {
                await client.rejectCall(callId, callerId);
                await client.updateBlockStatus(callerId, 'block');
                
                // Send message (with rate limiting)
                const currentTime = Date.now();
                if (currentTime - lastCallTime >= callDelay) {
                    await client.sendMessage(callerId, {
                        text: settings.message || '📵 Calls are not accepted! You have been blocked.'
                    });
                    lastCallTime = currentTime;
                }
                
                console.log(`🔨 Blocked and rejected call from ${callerId}`);
            } catch (err) {
                console.error('Error blocking caller:', err);
            }
        } 
        else if (settings.action === 'reject') {
            // Just reject the call
            try {
                await client.rejectCall(callId, callerId);
                
                // Send message (with rate limiting)
                const currentTime = Date.now();
                if (currentTime - lastCallTime >= callDelay) {
                    await client.sendMessage(callerId, {
                        text: settings.message || '📵 Calls are not accepted! Please text instead.'
                    });
                    lastCallTime = currentTime;
                }
                
                console.log(`📵 Rejected call from ${callerId}`);
            } catch (err) {
                console.error('Error rejecting call:', err);
            }
        } 
        else if (settings.action === 'warn') {
            try {
                // Get current warn count for this caller
                let warnCount = getCallWarnCount(callerId);
                
                // Increment warn count
                warnCount = incrementCallWarnCount(callerId);
                
                // Reject the call
                await client.rejectCall(callId, callerId);
                
                // Check if reached warn limit - BLOCK THEM
                if (warnCount >= settings.warn_limit) {
                    // Block the caller
                    await client.updateBlockStatus(callerId, 'block');
                    
                    // Send block message
                    const currentTime = Date.now();
                    if (currentTime - lastCallTime >= callDelay) {
                        await client.sendMessage(callerId, {
                            text: `📵 You have been BLOCKED after ${warnCount} calls. Please do not call again.`
                        });
                        lastCallTime = currentTime;
                    }
                    
                    console.log(`🔨 BLOCKED ${callerId} after ${warnCount}/${settings.warn_limit} warnings`);
                    
                    // Reset warn count after blocking
                    resetCallWarnCount(callerId);
                } else {
                    // Send warning message
                    const remaining = settings.warn_limit - warnCount;
                    const currentTime = Date.now();
                    if (currentTime - lastCallTime >= callDelay) {
                        await client.sendMessage(callerId, {
                            text: `⚠️ WARNING ${warnCount}/${settings.warn_limit}\n\n${settings.message || 'Calls are not accepted!'}\n\nYou will be BLOCKED after ${remaining} more call${remaining > 1 ? 's' : ''}.`
                        });
                        lastCallTime = currentTime;
                    }
                    
                    console.log(`⚠️ Warning ${warnCount}/${settings.warn_limit} for ${callerId}`);
                }
            } catch (err) {
                console.error('Error in warn mode:', err);
            }
        }
    } catch (error) {
        console.error('Error handling call:', error);
    }
});     
        


//========================================================================================================================
// Auto-Bio functionality
let autoBioInterval;

async function startAutoBio() {
    try {
        const autoBioSettings = await getAutoBioSettings();
        
        if (autoBioInterval) {
            clearInterval(autoBioInterval);
        }

        if (autoBioSettings.status === 'on') {
            autoBioInterval = setInterval(async () => {
                try {
                    const date = new Date();
                    const timezone = botSettings.timezone || 'Africa/Nairobi';
                    const botname = botSettings.botname || 'Keith-MD';
                    
                    const formattedDate = date.toLocaleString('en-US', { 
                        timeZone: timezone 
                    });
                    const dayOfWeek = date.toLocaleString('en-US', { 
                        weekday: 'long', 
                        timeZone: timezone 
                    });

                    const bioMessage = `${botname} is active 24/7\n\n${formattedDate} (${dayOfWeek})\n\n${autoBioSettings.message}`;
                    
                    await client.updateProfileStatus(bioMessage);
                } catch (error) {
                    // Silent error handling
                }
            }, 30 * 1000);
        }
    } catch (error) {
        // Silent error handling
    }
}


     
//========================================================================================================================
const baseDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

function getChatFilePath(remoteJid) {
    const safeJid = remoteJid.replace(/[^a-zA-Z0-9@]/g, '_');
    return path.join(baseDir, `${safeJid}.json`);
}

function loadChatData(remoteJid) {
    const filePath = getChatFilePath(remoteJid);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data) || [];
        }
    } catch (error) {
        console.error('Error loading chat data:', error);
    }
    return [];
}

function saveChatData(remoteJid, messages) {
    const filePath = getChatFilePath(remoteJid);
    try {
        fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
    } catch (error) {
        console.error('Error saving chat data:', error);
    }
}

async function sendDeletedMessageNotification(client, settings, {
    remoteJid,
    deleterJid,
    senderJid,
    isGroup,
    deletedMsg,
    groupInfo = ''
}) {
    const notification = `${settings.notification}\n` +
                       `• Deleted by: @${deleterJid.split('@')[0]}\n` +
                       `• Original sender: @${senderJid.split('@')[0]}\n` +
                       `${groupInfo}\n` +
                       `• Chat type: ${isGroup ? 'Group' : 'Private'}`;

    const contextInfo = {
        mentionedJid: [deleterJid, senderJid],
        forwardingScore: 0,
        isForwarded: false
    };

    const targetJid = settings.sendToOwner ? 
        (client?.dev || client.user.id.split(':')[0] + '@s.whatsapp.net') : 
        remoteJid;

    if (deletedMsg.message.conversation) {
        await client.sendMessage(targetJid, {
            text: `${notification}\n\n📝 *Deleted Text:*\n${deletedMsg.message.conversation}`,
            mentions: [deleterJid, senderJid],
            contextInfo
        });
    } 
    else if (deletedMsg.message.extendedTextMessage) {
        await client.sendMessage(targetJid, {
            text: `${notification}\n\n📝 *Deleted Text:*\n${deletedMsg.message.extendedTextMessage.text}`,
            mentions: [deleterJid, senderJid],
            contextInfo
        });
    }
    else if (settings.includeMedia) {
        try {
            const docMessage = deletedMsg.message?.documentMessage || 
                              deletedMsg.message?.ephemeralMessage?.message?.documentMessage ||
                              deletedMsg.message?.viewOnceMessage?.message?.documentMessage ||
                              deletedMsg.message?.viewOnceMessageV2?.message?.documentMessage;
            
            if (deletedMsg.message.imageMessage) {
                const buffer = await client.downloadAndSaveMediaMessage(deletedMsg.message.imageMessage);
                await client.sendMessage(targetJid, {
                    image: { url: buffer },
                    caption: notification,
                    mentions: [deleterJid, senderJid],
                    contextInfo
                });
            }
         
            else if (deletedMsg.message.videoMessage) {
                const buffer = await client.downloadAndSaveMediaMessage(deletedMsg.message.videoMessage);
                await client.sendMessage(targetJid, {
                    video: { url: buffer },
                    caption: notification,
                    mentions: [deleterJid, senderJid],
                    contextInfo
                });
            }
                else if (docMessage) {
    const buffer = await client.downloadAndSaveMediaMessage(docMessage);
    const fileName = docMessage.fileName || 'document';
    
    await client.sendMessage(targetJid, {
        document: { url: buffer },
        fileName: fileName,
        mimetype: docMessage.mimetype || mime.lookup(fileName) || 'application/octet-stream',
        caption: notification,
        mentions: [deleterJid, senderJid],
        contextInfo
    });
                }
            else if (deletedMsg.message.audioMessage) {
                const buffer = await client.downloadAndSaveMediaMessage(deletedMsg.message.audioMessage);
                await client.sendMessage(targetJid, {
                    audio: { url: buffer },
                    ptt: deletedMsg.message.audioMessage.ptt,
                    caption: notification,
                    mentions: [deleterJid, senderJid],
                    contextInfo
                });
            }
            else if (deletedMsg.message.stickerMessage) {
                const buffer = await client.downloadAndSaveMediaMessage(deletedMsg.message.stickerMessage);
                await client.sendMessage(targetJid, {
                    sticker: { url: buffer },
                    mentions: [deleterJid, senderJid],
                    contextInfo
                });
            }
        } catch (mediaError) {
            console.error('Error processing media message:', mediaError);
            await client.sendMessage(targetJid, {
                text: `${notification}\n\n⚠️ A media message was deleted but could not be retrieved`,
                mentions: [deleterJid, senderJid],
                contextInfo
            });
        }
    }
    else {
        await client.sendMessage(targetJid, {
            text: `${notification}\n\n⚠️ A media message was deleted (media capture is disabled)`,
            mentions: [deleterJid, senderJid],
            contextInfo
        });
    }
}

client.ev.on('messages.upsert', async ({ messages }) => {
    try {
        const settings = await getAntiDeleteSettings();
        if (!settings.status) return;

        const message = messages[0];
        if (!message.message || message.key.remoteJid === 'status@broadcast') return;

        const remoteJid = message.key.remoteJid;
        const chatData = loadChatData(remoteJid);
        
        // Store the entire message object including media info
        chatData.push(JSON.parse(JSON.stringify(message)));
        if (chatData.length > 100) chatData.shift();
        
        saveChatData(remoteJid, chatData);

        if (message.message.protocolMessage?.type === 0) {
            const deletedKey = message.message.protocolMessage.key;
            const deletedMsg = chatData.find(m => m.key.id === deletedKey.id);
            
            if (!deletedMsg) return;

            const deleterJid = message.key.participant || message.key.remoteJid;
            const senderJid = deletedMsg.key.participant || deletedMsg.key.remoteJid;
            
            if (deleterJid.includes(client.user.id.split(':')[0])) return;

            const isGroup = remoteJid.endsWith('@g.us');
            let groupInfo = '';
            
            if (isGroup && settings.includeGroupInfo) {
                try {
                    const groupMetadata = await client.groupMetadata(remoteJid);
                    groupInfo = `\n• Group: ${groupMetadata.subject}`;
                } catch (e) {
                    console.error('Error fetching group metadata:', e);
                }
            }

            await sendDeletedMessageNotification(client, settings, {
                remoteJid,
                deleterJid,
                senderJid,
                isGroup,
                deletedMsg,
                groupInfo
            });
        }
    } catch (error) {
        console.error('Error in antidelete handler:', error);
    }
});
//========================================================================================================================        
//========================================================================================================================        
 
 function saveUserJid(jid) {
    try {
        if (!jid) throw new Error("No JID provided");

        let normalizedJid = jid;
        
        // Add @s.whatsapp.net if no @ symbol
        if (!normalizedJid.includes('@')) {
            normalizedJid = normalizedJid + '@s.whatsapp.net';
        }

        // Block unwanted suffixes
        const blockedSuffixes = ['@g.us', '@newsletter', '@broadcast'];
        if (blockedSuffixes.some(suffix => normalizedJid.endsWith(suffix))) {
            throw new Error(`Cannot save JID with blocked suffix: ${normalizedJid}`);
        }

        // Read existing
        let userJids = [];
        try {
            const data = fs.readFileSync('./jids.json', 'utf-8');
            userJids = JSON.parse(data);
        } catch {
            userJids = [];
        }

        // Add if new
        if (!userJids.includes(normalizedJid)) {
            userJids.push(normalizedJid);
            fs.writeFileSync('./jids.json', JSON.stringify(userJids, null, 2));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving user JID:', error.message);
        return false;
    }
}       
//========================================================================================================================
// Greet functionality
//========================================================================================================================
client.ev.on("messages.upsert", async ({ messages }) => {
    const ms = messages[0];
    
    if (!ms?.message || !ms?.key) return;

    const messageText = ms.message?.conversation || ms.message?.extendedTextMessage?.text || "";
    const remoteJid = ms.key.remoteJid;
    const senderJid = ms.key.participant || ms.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];
    const isPrivate = remoteJid.endsWith('@lid');

    // Get current settings
    const greetSettings = await getGreetSettings();

    // Command to update greeting message (only from owner)
    if (messageText.match(/^[^\w\s]/) && ms.key.fromMe && isPrivate) {
        const prefix = messageText[0];
        const command = messageText.slice(1).split(" ")[0];
        const newMessage = messageText.slice(prefix.length + command.length).trim();

        if (command === "setgreet" && newMessage) {
            await updateGreetSettings({ message: newMessage });
            await client.sendMessage(remoteJid, {
                text: `Greet message has been updated to:\n"${newMessage}"`
            });
            return;
        }
    }

    // Handle greetings in private chats only
    if (greetSettings.enabled && isPrivate && !ms.key.fromMe && !repliedContacts.has(remoteJid)) {
        const personalizedMessage = greetSettings.message.replace(/@user/g, `@${senderNumber}`);
        
        await client.sendMessage(remoteJid, {
            text: personalizedMessage,
            mentions: [senderJid]
        });
        
        repliedContacts.add(remoteJid);
    }
});


//========================================================================================================================
//autoread


client.ev.on("messages.upsert", async ({ messages }) => {
    const mek = messages[0];
    
    if (!mek?.message || !mek?.key) return;

    // Auto-like status (using the working approach)
  
    if (mek.key?.remoteJid) {
        try {
            const settings = await getAutoReadSettings();
            
            if (settings.status) {
                const isPrivate = mek.key.remoteJid.endsWith('@lid');
                const isGroup = mek.key.remoteJid.endsWith('@g.us');
                
                const shouldReadPrivate = settings.chatTypes.includes('private') && isPrivate;
                const shouldReadGroup = settings.chatTypes.includes('group') && isGroup;

                if (shouldReadPrivate || shouldReadGroup) {
                    await client.readMessages([mek.key]);
                }
            }
        } catch (error) {
            console.error('Error handling auto-read:', error);
        }
    }
});


//========================================================================================================================

//========================================================================================================================
client.ev.on("messages.upsert", async ({ messages }) => {
    const ms = messages[0];
    if (!ms?.message || !ms?.key) return;

//========================================================================================================================

    // Newsletter auto-react handler
    try {
        const targetNewsletter = "120363405313170509@newsletter";
        
        if (ms.key.remoteJid === targetNewsletter && ms.newsletterServerId) {
            try {
                const emojiList = ["❤️", "👌", "😂", "✊", "💀", "💜", "💯"];
                const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                
                const messageId = ms.newsletterServerId.toString();
                await client.newsletterReactMessage(targetNewsletter, messageId, emoji);
                KeithLogger.info(`Reacted with ${emoji} to newsletter message`);
            } catch (err) {
                KeithLogger.error("Failed to react to newsletter message:", err);
            }
            return; // Skip further processing for newsletter messages
        }
    } catch (err) {
        KeithLogger.error("Newsletter handler error:", err);
    }
//========================================================================================================================


    // Log the incoming message
    try {
        const logData = {
            isGroup: ms.key.remoteJid.endsWith('@g.us'),
            isBroadcast: ms.key.remoteJid === 'status@broadcast',
            chat: ms.key.remoteJid,
            pushName: ms.pushName || 'Unknown User',
            senderName: ms.pushName || 'Unknown User',
            sender: ms.key.participant || ms.key.remoteJid,
            remoteJid: ms.key.remoteJid || ms.key.senderPn || ms.key.participant || ms.key.participantPn,
            mtype: getContentType(ms.message),
            text: ms.message?.conversation || 
                 ms.message?.extendedTextMessage?.text || 
                 ms.message?.imageMessage?.caption || 
                 ms.message?.videoMessage?.caption ||
                 ms.message?.documentMessage?.caption ||
                 (ms.message?.imageMessage ? '[Image]' : 
                  ms.message?.videoMessage ? '[Video]' : 
                  ms.message?.audioMessage ? '[Audio]' : 
                  ms.message?.documentMessage ? '[Document]' : 
                  ms.message?.stickerMessage ? '[Sticker]' : '')
        };
        
        KeithLogger.logMessage(logData);
    } catch (logError) {
        KeithLogger.warning("Failed to log message:", logError);
    }
       // ====== AUTOMATICALLY SAVE USER JID ======
    try {
    // Get the sender JID
    const senderJid = ms.key.participant || ms.key.remoteJid;
    
    // Don't save if: group chat OR from bot OR no sender JID
    if (!ms.key.remoteJid.endsWith('@g.us') && !ms.key.fromMe && senderJid) {
        const saved = saveUserJid(senderJid);
        if (saved) {
            KeithLogger.info(`New user JID saved: ${senderJid}`);
        }
    }
} catch (error) {
    KeithLogger.error("Error saving user JID:", error);
}
    // ========================================

    function standardizeJid(jid) {
        if (!jid) return '';
        try {
            jid = typeof jid === 'string' ? jid : 
                (jid.decodeJid ? jid.decodeJid() : String(jid));
            jid = jid.split(':')[0].split('/')[0];
            if (!jid.includes('@')) {
                jid += '@s.whatsapp.net';
            } else if (jid.endsWith('@lid')) {
                return jid.toLowerCase();
            }
            return jid.toLowerCase();
        } catch (e) {
            KeithLogger.error("JID standardization error:", e);
            return '';
        }
    }

    const from = standardizeJid(ms.key.remoteJid);
    const botId = standardizeJid(client.user?.id);
    const isGroup = from.endsWith("@g.us");
    let groupInfo = null;
    let groupName = '';
    try {
        groupInfo = isGroup ? await client.groupMetadata(from).catch(() => null) : null;
        groupName = groupInfo?.subject || '';
    } catch (err) {
        KeithLogger.error("Group metadata error:", err);
    }

    const sendr = ms.key.fromMe 
        ? (client.user.id.split(':')[0] + '@s.whatsapp.net' || client.user.id) 
        : (ms.key.participantPn || ms.key.senderPn || ms.key.participant || ms.key.remoteJid);
    let participants = [];
    let groupAdmins = [];
    let groupSuperAdmins = [];
    let sender = sendr;
    let isBotAdmin = false;
    let isAdmin = false;
    let isSuperAdmin = false;

    if (groupInfo && groupInfo.participants) {
        participants = groupInfo.participants.map(p => p.pn || p.id);
        groupAdmins = groupInfo.participants.filter(p => p.admin === 'admin').map(p => p.pn || p.id);
        groupSuperAdmins = groupInfo.participants.filter(p => p.admin === 'superadmin').map(p => p.pn || p.id);
        const senderLid = standardizeJid(sendr);
        const founds = groupInfo.participants.find(p => p.id === senderLid || p.pn === senderLid);
        sender = founds?.pn || founds?.id || sendr;
        isBotAdmin = groupAdmins.includes(standardizeJid(botId)) || groupSuperAdmins.includes(standardizeJid(botId));
        isAdmin = groupAdmins.includes(sender);
        isSuperAdmin = groupSuperAdmins.includes(sender);
    }

    const repliedMessage = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    const type = getContentType(ms.message);
    const pushName = ms.pushName || 'Keith-Md User';
    const quoted = 
        type == 'extendedTextMessage' && 
        ms.message.extendedTextMessage.contextInfo != null 
        ? ms.message.extendedTextMessage.contextInfo.quotedMessage || [] 
        : [];
    const body = 
        (type === 'conversation') ? ms.message.conversation : 
        (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
        (type == 'imageMessage') && ms.message.imageMessage.caption ? ms.message.imageMessage.caption : 
        (type == 'videoMessage') && ms.message.videoMessage.caption ? ms.message.videoMessage.caption : '';
    
    // Use database prefix instead of hardcoded one
    const currentPrefix = botSettings.prefix || prefix;
    const isCommand = body.startsWith(currentPrefix);
    const command = isCommand ? body.slice(currentPrefix.length).trim().split(' ').shift().toLowerCase() : '';
    
    const mentionedJid = (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).map(standardizeJid);
    const tagged = ms.mtype === "extendedTextMessage" && ms.message.extendedTextMessage.contextInfo != null
        ? ms.message.extendedTextMessage.contextInfo.mentionedJid
        : [];
    const quotedMsg = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedKey = ms.message?.extendedTextMessage?.contextInfo?.stanzaId;
    
    const quotedSender = ms.message?.extendedTextMessage?.contextInfo?.participant;
    const quotedUser = ms.message?.extendedTextMessage?.contextInfo?.participant || 
        ms.message?.extendedTextMessage?.contextInfo?.remoteJid;
    const repliedMessageAuthor = standardizeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
    let messageAuthor = isGroup 
        ? standardizeJid(ms.key.participant || ms.participant || from)
        : from;
    if (ms.key.fromMe) messageAuthor = botId;
    const user = mentionedJid.length > 0 
        ? mentionedJid[0] 
        : repliedMessage 
            ? repliedMessageAuthor 
            : '';

    // SIMPLE SUDO NUMBERS FIX - Using original dev from settings.js
    const devNumbers = ['254748387615', '254799916673', '254110190195', '254796299159', '254752925938', '254786989022', '254743995989'];
    
    // Get sudo numbers from database - use await since getSudoNumbers is async
    let sudoNumbersFromFile = [];
    try {
        sudoNumbersFromFile = await getSudoNumbers() || [];
    } catch (error) {
        KeithLogger.error("Error getting sudo numbers:", error);
    }

    // Convert dev to array if it exists - using original dev from settings.js
    const sudoNumbers = dev ? [dev.replace(/\D/g, '')] : [];

    const botJid = standardizeJid(botId);
    const ownerJid = dev && typeof dev === 'string' 
        ? standardizeJid(dev.replace(/\D/g, ''))
        : standardizeJid('254748387615');

    // Create superUser array safely
    const superUser = [
        ownerJid,
        botJid,
        ...sudoNumbers.map(num => `${num}@s.whatsapp.net`),
        ...devNumbers.map(num => `${num}@s.whatsapp.net`),
        ...sudoNumbersFromFile.map(num => `${num}@s.whatsapp.net`)
    ].map(jid => standardizeJid(jid)).filter(Boolean);

    const superUserSet = new Set(superUser);
    const finalSuperUsers = Array.from(superUserSet);

    const isSuperUser = finalSuperUsers.includes(standardizeJid(sender));

    const text = ms.message?.conversation || 
                ms.message?.extendedTextMessage?.text || 
                ms.message?.imageMessage?.caption || 
                '';
    const args = typeof text === 'string' ? text.trim().split(/\s+/).slice(1) : [];
    const isCommandMessage = typeof text === 'string' && text.startsWith(currentPrefix);
    const cmd = isCommandMessage ? text.slice(currentPrefix.length).trim().split(/\s+/)[0]?.toLowerCase() : null;
//========================================================================================================================
    //    
  // ================= EVAL COMMAND =================
const trimmedText = text?.trim() || '';
if (trimmedText && trimmedText.startsWith('~')) {
    if (!isSuperUser) {
        await client.sendMessage(from, { 
            text: "🚫 Only my owner can execute eval commands!" 
        }, { quoted: ms });
        return;
    }
    
    try {
        const evalCode = trimmedText.slice(trimmedText.startsWith('~ ') ? 2 : 1).trim();
        
        if (!evalCode) {
            await client.sendMessage(from, { 
                text: "⚠️ Example: `~ 2+2` or `~ client.user.id`" 
            }, { quoted: ms });
            return;
        }
        
        let evaled = await eval(`(async () => { return ${evalCode} })()`);
        
        if (typeof evaled !== 'string') {
            const util = require('util');
            evaled = util.inspect(evaled, { depth: 2 });
        }
        
        const result = String(evaled);
        await client.sendMessage(from, { 
            text: result 
        }, { quoted: ms });
        
    } catch (err) {
        await client.sendMessage(from, { 
            text: String(err) 
        }, { quoted: ms });
    }
    return;
}
// ================================================
   if (ms.key?.remoteJid) {
    try {
        const { getPresenceSettings } = require('./database/presence');
        const presenceSettings = await getPresenceSettings();
        
        // Handle private chat presence
        if (ms.key.remoteJid.endsWith("@lid") && presenceSettings.privateChat !== 'off') {
            const presenceType = 
                presenceSettings.privateChat === "online" ? "available" :
                presenceSettings.privateChat === "typing" ? "composing" :
                presenceSettings.privateChat === "recording" ? "recording" : 
                "unavailable";
            await client.sendPresenceUpdate(presenceType, ms.key.remoteJid);
        }
//========================================================================================================================
    //        
        // Handle group chat presence
        if (ms.key.remoteJid.endsWith("@g.us") && presenceSettings.groupChat !== 'off') {
            const presenceType = 
                presenceSettings.groupChat === "online" ? "available" :
                presenceSettings.groupChat === "typing" ? "composing" :
                presenceSettings.groupChat === "recording" ? "recording" : 
                "unavailable";
            await client.sendPresenceUpdate(presenceType, ms.key.remoteJid);
        }
    } catch (error) {
        console.error('Error handling presence:', error);
    }
}

// Handle status broadcast actions
  if (ms.key.remoteJid === "status@broadcast") {
    try {
    //  const { getAutoStatusSettings } = require('./database/autostatus');
      const settings = await getAutoStatusSettings();
      const clienttech = jidNormalizedUser(client.user.id);
      const fromJid = ms.key.participant || ms.key.remoteJid;

      ms.message = getContentType(ms.message) === 'ephemeralMessage'
        ? ms.message.ephemeralMessage.message
        : ms.message;

      if (settings.autoviewStatus === "true") {
        await client.readMessages([ms.key]);
      }

      if (settings.autoLikeStatus === "true" && ms.key.participant) {
        const emojis = settings.statusLikeEmojis?.split(',') || [];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        await client.sendMessage(
          ms.key.remoteJid,
          { react: { key: ms.key, text: randomEmoji } },
          { statusJidList: [ms.key.participant, clienttech] }
        );
      }

      if (settings.autoReplyStatus === "true" && !ms.key.fromMe) {
        await client.sendMessage(
          fromJid,
          { text: settings.statusReplyText },
          { quoted: ms }
        );
      }
    } catch (error) {
      console.error("Error handling status broadcast:", error);
    }
  }    


    
 
       
    //========================================================================================================================
    //antilink 
    // In your main messages.upsert event, after all variables are defined:
await detectAndHandleLinks(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser);


await detectAndHandleSpam(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser);


await detectAndHandleAutoBlock(client, ms, isSuperUser);


await detectAndHandleTag(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser);

await detectAndHandleBadWords(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser);

await detectAndHandleSticker(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser); //
    
await detectAndHandleStatusMention(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser); // Add this line
    await handleChatbot(client, ms.message, from, sender, isGroup, isSuperUser, ms); //
  //await detectAndHandleSpam(client, ms, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser);  //========================================================================================================================//========================================================================================================================




  
    if (isCommandMessage && cmd) {
    
      
        const keithCmd = Array.isArray(evt.commands) 
            ? evt.commands.find((c) => (
                c?.pattern === cmd || 
                (Array.isArray(c?.aliases) && c.aliases.includes(cmd))
            )) 
            : null;

        if (keithCmd) {
            const currentMode = botSettings.mode || mode;
            if (currentMode?.toLowerCase() === "private" && !isSuperUser) {
                KeithLogger.warning(`Command ${cmd} blocked - Private mode and user not super user`);
                return;
            }

            try {
                KeithLogger.info(`Executing command: ${cmd} from ${pushName} (${sender})`);

                const reply = (teks) => {
                    client.sendMessage(from, { text: teks }, { quoted: ms });
                };

                const react = async (emoji) => {
                    if (typeof emoji !== 'string') return;
                    try {
                        await client.sendMessage(from, { 
                            react: { 
                                key: ms.key, 
                                text: emoji
                            }
                        });
                    } catch (err) {
                        KeithLogger.error("Reaction error:", err);
                    }
                };

                const edit = async (text, message) => {
                    if (typeof text !== 'string') return;
                    
                    try {
                        await client.sendMessage(from, {
                            text: text,
                            edit: message.key
                        }, { 
                            quoted: ms 
                        });
                    } catch (err) {
                        KeithLogger.error("Edit error:", err);
                    }
                };

                const del = async (message) => {
                    if (!message?.key) return; 

                    try {
                        await client.sendMessage(from, {
                            delete: message.key
                        }, { 
                            quoted: ms 
                        });
                    } catch (err) {
                        KeithLogger.error("Delete error:", err);
                    }
                };

                if (keithCmd.react) {
                    try {
                        await client.sendMessage(from, {
                            react: { 
                                key: ms.key, 
                                text: keithCmd.react
                            }
                        });
                    } catch (err) {
                        KeithLogger.error("Reaction error:", err);
                    }
                }

                client.getJidFromLid = async (lid) => {
                    const groupMetadata = await client.groupMetadata(from);
                    const match = groupMetadata.participants.find(p => p.lid === lid || p.id === lid);
                    return match?.pn || null;
                };

                client.getLidFromJid = async (jid) => {
                    const groupMetadata = await client.groupMetadata(from);
                    const match = groupMetadata.participants.find(p => p.jid === jid || p.id === jid);
                    return match?.lid || null;
                };

                let fileType;
                (async () => {
                    fileType = await import('file-type');
                })();

                client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
                    try {
                        let quoted = message.msg ? message.msg : message;
                        let mime = (message.msg || message).mimetype || '';
                        let messageType = message.mtype ? 
                            message.mtype.replace(/Message/gi, '') : 
                            mime.split('/')[0];
                        
                        const stream = await downloadContentFromMessage(quoted, messageType);
                        let buffer = Buffer.from([]);
                        
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        let fileTypeResult;
                        try {
                            fileTypeResult = await fileType.fileTypeFromBuffer(buffer);
                        } catch (e) {
                            KeithLogger.warning("file-type detection failed, using mime type fallback");
                        }

                        const extension = fileTypeResult?.ext || 
                                    mime.split('/')[1] || 
                                    (messageType === 'image' ? 'jpg' : 
                                    messageType === 'video' ? 'mp4' : 
                                    messageType === 'audio' ? 'mp3' : 'bin');

                        const trueFileName = attachExtension ? 
                            `${filename}.${extension}` : 
                            filename;
                        
                        await fs.writeFile(trueFileName, buffer);
                        return trueFileName;
                    } catch (error) {
                        KeithLogger.error("Error in downloadAndSaveMediaMessage:", error);
                        throw error;
                    }
                };
                
                const conText = {
                    m: ms,
                    mek: ms,
                    edit,
                    api: "https://apiskeith.top",
                    react,
                    del,
                    arg: args,
                    quoted,
                    isCmd: isCommand,
                    command,
                    isAdmin,
                    isBotAdmin,
                    sender,
                    pushName,
                    setSudo,
                    delSudo,
                    isSudo,
                    devNumbers,
                    q: args.join(" "),
                    reply,
                    superUser,
                    tagged,
                    mentionedJid,
                    isGroup,
                    groupInfo,
                    groupName,
                    getSudoNumbers,
                    authorMessage: messageAuthor,
                    user: user || '',
                    keithBuffer, 
                    keithJson, 
                    formatAudio, 
                    formatVideo,
                    keithRandom,
                    groupMember: isGroup ? messageAuthor : '',
                    from,
                    tagged,
                    dev: dev, // Using original dev from settings.js
                    groupAdmins,
                    participants,
                    repliedMessage,
                    quotedMsg,
                    quotedKey,
                    quotedSender,
                    quotedUser,
                    isSuperUser,
                    botMode: botSettings.mode || mode,
                    botPic: botSettings.url || url,
                    packname: botSettings.packname || packname,
                    author: botSettings.author || author,
                    botVersion: '1.0.0',
                    ownerNumber: dev, // Using original dev from settings.js
                    ownerName: botSettings.author || author,
                    botname: botSettings.botname || botname,
                    sourceUrl: botSettings.gurl || gurl,
                    isSuperAdmin,
                    prefix: currentPrefix,
                    timeZone: botSettings.timezone || timezone,
                    // Add settings functions for commands to update settings
                    updateSettings,
                    getSettings,
                    botSettings
                };

                await keithCmd.function(from, client, conText);
                KeithLogger.success(`Command ${cmd} executed successfully`);

            } catch (error) {
                KeithLogger.error(`Command error [${cmd}]:`, error);
                try {
                    await client.sendMessage(from, {
                        text: `😡Command failed: ${error.message}`
                    }, { quoted: ms });
                } catch (sendErr) {
                    KeithLogger.error("Error sending error message:", sendErr);
                }
            }
        }
    }
});

//========================================================================================================================
// Connection handling
//========================================================================================================================
client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "connecting") {
        KeithLogger.info("Keith md is connecting..");
        reconnectAttempts = 0;
    }
    
const chalk = require('chalk');


if (connection === "open") {
   
 const inviteCode = "D9J0OsDdCyC7DihfzUOJOX";
    
    try {
        await client.groupAcceptInvite(inviteCode);
        KeithLogger.success(`Joined group with invite code: ${inviteCode}`);
    } catch (error) {
        // Skip if already in group
        if (error.message?.includes('already') || error.status === 409) {
            KeithLogger.info(`Already in group - skipping`);
        } else {
            KeithLogger.warning(`Could not join group: ${error.message}`);
        }
    }
 
    
    console.log(chalk.cyanBright(`
██╗  ██╗ ███████╗ ██╗ ████████╗ ██╗  ██╗
██║ ██╔╝ ██╔════╝ ██║ ╚══██╔══╝ ██║  ██║
█████╔╝  █████╗   ██║    ██║    ███████║
██╔═██╗  ██╔══╝   ██║    ██║    ██╔══██║
██║  ██╗ ███████╗ ██║    ██║    ██║  ██║
╚═╝  ╚═╝ ╚══════╝ ╚═╝    ╚═╝    ╚═╝  ╚═╝
`));
    
    // Multi-colored text
    console.log(chalk.magentaBright('✨ ') + 
                chalk.cyanBright('KEITH MD') + 
                chalk.magentaBright(' ✨') + 
                chalk.blueBright(' is now active and connected!\n'));
    
    KeithLogger.success("✅ keith md is active , enjoy 😀");
    reconnectAttempts = 0;
    startAutoBio();
    scheduleMessage(); 
    
        
        setTimeout(async () => {
            try {
                const totalCommands = commands.filter((command) => command.pattern).length;
                KeithLogger.success('🗿Keith Md is connected to Whatsapp and active💥');
                    
                const currentBotName = botSettings.botname || botname;
                const currentMode = botSettings.mode || mode;
                const currentPrefix = botSettings.prefix || prefix;
                
                const connectionMsg = `  
    ╭═『 ${currentBotName}══⊷ 
    ║ ᴍᴏᴅᴇ ${currentMode}
    ║ ᴘʀᴇғɪx [ ${currentPrefix} ] 
    ║ join here👇
    ║ t.me/keithmd
    ╰═════════════⊷
`;

                await client.sendMessage(
                    client.user.id,
                    {
                        text: connectionMsg
                    },
                    {
                        disappearingMessagesInChat: true,
                        ephemeralExpiration: 300,
                    }
                );
                KeithLogger.info("Startup message sent successfully");
            } catch (err) {
                KeithLogger.error("Post-connection setup error:", err);
            }
        }, 5000);
    }

    if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        
        KeithLogger.warning(`Connection closed due to: ${reason}`);
        
        if (reason === DisconnectReason.badSession) {
            KeithLogger.error("Bad session file, delete it and scan again");
            try {
                await fs.remove(__dirname + "/session");
            } catch (e) {
                KeithLogger.error("Failed to remove session:", e);
            }
            process.exit(1);
        } else if (reason === DisconnectReason.connectionClosed) {
            KeithLogger.warning("Connection closed, reconnecting...");
            setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
        } else if (reason === DisconnectReason.connectionLost) {
            KeithLogger.warning("Connection lost from server, reconnecting...");
            setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
        } else if (reason === DisconnectReason.connectionReplaced) {
            KeithLogger.error("Connection replaced, another new session opened");
            process.exit(1);
        } else if (reason === DisconnectReason.loggedOut) {
            KeithLogger.error("Device logged out, delete session and scan again");
            try {
                await fs.remove(__dirname + "/session");
            } catch (e) {
                KeithLogger.error("Failed to remove session:", e);
            }
            process.exit(1);
        } else if (reason === DisconnectReason.restartRequired) {
            KeithLogger.warning("Restart required, restarting...");
            setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
        } else if (reason === DisconnectReason.timedOut) {
            KeithLogger.warning("Connection timed out, reconnecting...");
            setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY * 2);
        } else {
            KeithLogger.warning(`Unknown disconnect reason: ${reason}, attempting reconnection...`);
            setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
        }
    }
});
//========================================================================================================================
// Group Participants Update Handler
//========================================================================================================================
//========================================================================================================================
// Group Participants Update Handler (Welcome/Goodbye + Anti-Promote/Anti-Demote)
//========================================================================================================================
client.ev.on('group-participants.update', async (keizzah) => {
    const settings = await getGroupEventsSettings(keizzah.id);
    if (!settings) return;

    const getContextInfo = (mentions) => ({
        mentionedJid: mentions,
        forwardingScore: 999,
        isForwarded: true
    });

    try {
        const metadata = await client.groupMetadata(keizzah.id);
        const count = metadata.participants.length;
        const time = new Date().toLocaleString();

        // Helper function to get profile picture
        const getProfilePic = async (jid) => {
            try {
                return await client.profilePictureUrl(jid, 'image');
            } catch {
                return 'https://i.imgur.com/iEWHnOH.jpeg';
            }
        };

        // Helper function to check if user is super user (using same logic as in messages.upsert)
        const isUserSuperUser = (jid) => {
            if (!jid) return false;
            
            // Get the number from jid
            const userNumber = jid.split('@')[0];
            
            // Super user numbers (from your existing code)
            const devNumbers = ['254748387615', '254110190196', '254796299159', '254752925938', '254786989022', '254743995989'];
            
            // Check if user is in devNumbers
            return devNumbers.includes(userNumber);
        };

        // Handle anti-promote and anti-demote actions
        if (keizzah.action === 'promote' || keizzah.action === 'demote') {
            const author = keizzah.author;
            const target = keizzah.participants[0];
            
            // Check if it's a super user or bot itself using the same logic
            const isSuperUser = isUserSuperUser(author);
            const isBot = target === client.user.id;
            
            // Skip if super user or bot
            if (isSuperUser || isBot) return;

            // Handle ANTI-PROMOTE
            if (keizzah.action === 'promote' && settings.antiPromote === 'on') {
                const authorName = author.split('@')[0];
                const targetName = target.split('@')[0];
                
                try {
                    if (settings.antiPromoteAction === 'remove') {
                        await client.groupParticipantsUpdate(keizzah.id, [author, target], 'remove');
                        await client.sendMessage(keizzah.id, {
                            text: `🚫 @${authorName} and @${targetName} have been removed for unauthorized promotion!`,
                            mentions: [author, target]
                        });
                    } 
                    else if (settings.antiPromoteAction === 'demote') {
                        // Demote the promoter (if they're admin)
                        if (metadata.participants.find(p => p.id === author)?.admin) {
                            await client.groupParticipantsUpdate(keizzah.id, [author], 'demote');
                        }
                        // Demote the promoted person
                        if (metadata.participants.find(p => p.id === target)?.admin) {
                            await client.groupParticipantsUpdate(keizzah.id, [target], 'demote');
                        }
                        
                        await client.sendMessage(keizzah.id, {
                            text: `⚠️ @${authorName} demoted for trying to promote @${targetName}\n❌ Both have been demoted!`,
                            mentions: [author, target]
                        });
                    }
                    else if (settings.antiPromoteAction === 'warn') {
                        const warnCount = incrementAntiPromoteWarnCount(keizzah.id, author);
                        
                        if (warnCount >= settings.warn_limit) {
                            await client.groupParticipantsUpdate(keizzah.id, [author], 'remove');
                            await client.sendMessage(keizzah.id, {
                                text: `🚫 @${authorName} removed after ${warnCount} warnings for unauthorized promotions!`,
                                mentions: [author]
                            });
                            resetAntiPromoteWarnCount(keizzah.id, author);
                        } else {
                            // Demote the promoted person
                            if (metadata.participants.find(p => p.id === target)?.admin) {
                                await client.groupParticipantsUpdate(keizzah.id, [target], 'demote');
                            }
                            
                            await client.sendMessage(keizzah.id, {
                                text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${authorName}! Unauthorized promotion is not allowed!\n@${targetName} has been demoted.`,
                                mentions: [author, target]
                            });
                        }
                    }
                } catch (err) {
                    console.error('Anti-promote action error:', err);
                }
                return;
            }

            // Handle ANTI-DEMOTE
            if (keizzah.action === 'demote' && settings.antiDemote === 'on') {
                const authorName = author.split('@')[0];
                const targetName = target.split('@')[0];
                
                try {
                    if (settings.antiDemoteAction === 'remove') {
                        await client.groupParticipantsUpdate(keizzah.id, [author, target], 'remove');
                        await client.sendMessage(keizzah.id, {
                            text: `🚫 @${authorName} and @${targetName} have been removed for unauthorized demotion!`,
                            mentions: [author, target]
                        });
                    } 
                    else if (settings.antiDemoteAction === 'promote') {
                        // Demote the author (if they're admin)
                        if (metadata.participants.find(p => p.id === author)?.admin) {
                            await client.groupParticipantsUpdate(keizzah.id, [author], 'demote');
                        }
                        // Re-promote the demoted person
                        await client.groupParticipantsUpdate(keizzah.id, [target], 'promote');
                        
                        await client.sendMessage(keizzah.id, {
                            text: `⚠️ @${authorName} demoted for trying to demote @${targetName}\n✅ @${targetName} has been re-promoted!`,
                            mentions: [author, target]
                        });
                    }
                    else if (settings.antiDemoteAction === 'warn') {
                        const warnCount = incrementAntiDemoteWarnCount(keizzah.id, author);
                        
                        if (warnCount >= settings.warn_limit) {
                            await client.groupParticipantsUpdate(keizzah.id, [author], 'remove');
                            await client.sendMessage(keizzah.id, {
                                text: `🚫 @${authorName} removed after ${warnCount} warnings for unauthorized demotions!`,
                                mentions: [author]
                            });
                            resetAntiDemoteWarnCount(keizzah.id, author);
                        } else {
                            // Re-promote the demoted person
                            await client.groupParticipantsUpdate(keizzah.id, [target], 'promote');
                            
                            await client.sendMessage(keizzah.id, {
                                text: `⚠️ Warning ${warnCount}/${settings.warn_limit} @${authorName}! Unauthorized demotion is not allowed!\n@${targetName} has been re-promoted.`,
                                mentions: [author, target]
                            });
                        }
                    }
                } catch (err) {
                    console.error('Anti-demote action error:', err);
                }
                return;
            }

            // Show normal promotion/demotion notices if enabled
            if (settings.enabled && settings.showPromotions) {
                if (keizzah.action === 'promote') {
                    const authorName = keizzah.author.split('@')[0];
                    const targetName = keizzah.participants[0].split('@')[0];
                    await client.sendMessage(keizzah.id, {
                        text: `🎉 @${authorName} promoted @${targetName} to admin!`,
                        mentions: [keizzah.author, keizzah.participants[0]]
                    });
                } 
                else if (keizzah.action === 'demote') {
                    const authorName = keizzah.author.split('@')[0];
                    const targetName = keizzah.participants[0].split('@')[0];
                    await client.sendMessage(keizzah.id, {
                        text: `⚠️ @${authorName} demoted @${targetName} from admin.`,
                        mentions: [keizzah.author, keizzah.participants[0]]
                    });
                }
            }
        }

        // Process welcome/goodbye messages (only if events enabled)
        if (settings.enabled) {
            // Process each participant for add/remove
            for (const num of keizzah.participants) {
                const userName = num.split('@')[0];
                const dpuser = await getProfilePic(num);

                if (keizzah.action === 'add') {
                    const message = settings.welcomeMessage
                        .replace(/@user/g, `@${userName}`)
                        .replace(/{group}/g, metadata.subject)
                        .replace(/{count}/g, count)
                        .replace(/{time}/g, time)
                        .replace(/{desc}/g, metadata.desc || 'No description');

                    await client.sendMessage(keizzah.id, {
                        image: { url: dpuser },
                        caption: message,
                        mentions: [num],
                        contextInfo: getContextInfo([num])
                    });
                } 
                else if (keizzah.action === 'remove') {
                    const message = settings.goodbyeMessage
                        .replace(/@user/g, `@${userName}`)
                        .replace(/{time}/g, time)
                        .replace(/{count}/g, count);

                    await client.sendMessage(keizzah.id, {
                        image: { url: dpuser },
                        caption: message,
                        mentions: [num],
                        contextInfo: getContextInfo([num])
                    });
                }
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
});
 //========================================================================================================================       
const cleanup = () => {
    if (store) {
        store.destroy();
    }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

    } catch (error) {
        KeithLogger.error('Socket initialization error:', error);
        setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        KeithLogger.error('Max reconnection attempts reached. Exiting...');
        process.exit(1);
    }

    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 300000);
    
    KeithLogger.warning(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    
    setTimeout(async () => {
        try {
            await startKeith();
        } catch (error) {
            KeithLogger.error('Reconnection failed:', error);
            reconnectWithRetry();
        }
    }, delay);
}

setTimeout(() => {
    startKeith().catch(err => {
        KeithLogger.error("Initialization error:", err);
        reconnectWithRetry();
    });
}, 5000);


