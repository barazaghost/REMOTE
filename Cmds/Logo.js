const { keith } = require('../commandHandler');
const axios = require('axios');


const fetchLogoUrl = async (url, texts, api) => {
  try {
    
    const params = texts.map((t, i) => `text${i + 1}=${encodeURIComponent(t)}`).join("&");
    const response = await axios.get(`${api}/logo/ephoto?url=${encodeURIComponent(url)}&${params}`);
    return response.data?.result?.download_url || null;
  } catch (error) {
    console.error("Error fetching logo:", error.message);
    return null;
  }
};


const loadStyles = async () => {
  try {
    const stylesRes = await axios.get("https://raw.githubusercontent.com/kkeizzahB/RAW/refs/heads/main/Cmds/style.json");
    const styles = stylesRes.data || {};

    for (const [pattern, url] of Object.entries(styles)) {
      keith({
        pattern,
        category: "ephoto",
        description: `Generate logo using Ephoto style: ${pattern}`,
        filename: __filename
      },
      async (sender, client, { q, mek, reply, api }) => {
        if (!q) {
          return reply(`_Please provide text(s) to create logo_\nUsage: .${pattern} <text1>|<text2>|<text3> or just single text`);
        }

        
        const texts = q.split("|").map(s => s.trim()).filter(Boolean);
        if (!texts.length) {
          return reply("_At least one text is required._");
        }

        try {
          const logoUrl = await fetchLogoUrl(url, texts, api);
          if (logoUrl) {
            await client.sendMessage(sender, { image: { url: logoUrl } }, { quoted: mek });
          } else {
            reply("_Unable to fetch logo. Please try again later._");
          }
        } catch (error) {
          console.error(`${pattern} logo command error:`, error);
          reply(`❌ An error occurred:\n${error.message}`);
        }
      });
    }
  } catch (err) {
    console.error("Error loading styles:", err.message);
  }
};

loadStyles();
