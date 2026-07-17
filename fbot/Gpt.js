
const { keith } = require("../commandHandler");
const axios = require("axios");

keith({
    name: "ai",
    aliases: ["gpt", "chat"],
    category: "AI",
    usePrefix: false,
    usage: "ai <your question>",
    version: "2.0",
    admin: false,
    cooldown: 2,

    execute: async ({ client, event, args, reply, keithApi }) => {
        const prompt = args.join(" ");

        if (!prompt) {
            return reply("Please ask a question.\nUsage: ai <your question>");
        }

        try {
            const { data } = await axios.get(`${keithApi}/keithai`, {
                params: { q: prompt },
            });

            if (!data || data.status !== true || !data.result) {
                return reply("No response from the AI.");
            }

            return reply(
                `${data.result}`
            );
        } catch (error) {
            console.error("Keith AI Error:", error);
            return reply("Error while contacting the AI API.");
        }
    }
});
