
const { keith } = require('../commandHandler');
const axios = require('axios');

// Utility functions
const fetchLogoUrl = async (url, name, api) => {
  try {
    const response = await axios.get(
      `${api}/logo/ephoto?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
    );
    return response.data?.result?.download_url || null;
  } catch (error) {
    console.error("Error fetching logo:", error.message);
    return null;
  }
};

const fetchLogoUrl2 = async (url, text1, text2, api) => {
  try {
    const response = await axios.get(
      `${api}/logo/ephoto2?url=${encodeURIComponent(url)}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`
    );
    return response.data?.result?.download_url || null;
  } catch (error) {
    console.error("Error fetching two-text logo:", error.message);
    return null;
  }
};

// Load styles from GitHub JSON
const loadStyles = async () => {
  try {
    const [stylesRes, styles2Res] = await Promise.all([
      axios.get("https://raw.githubusercontent.com/Keithkeizzah/INFO/refs/heads/main/Cmds/style.json"),
      axios.get("https://raw.githubusercontent.com/Keithkeizzah/INFO/refs/heads/main/Cmds/style2.json")
    ]);

    const styles = stylesRes.data || {};
    const styles2 = styles2Res.data || {};

    // Register single-text styles
    for (const [pattern, url] of Object.entries(styles)) {
      keith({
        pattern,
        category: "ephoto",
        description: `Generate text logo using Ephoto style: ${pattern}`
      },
      async (from, client, conText) => {
        const { q, mek, reply, api } = conText;

        if (!q) {
          return reply(`_Please provide text to create logo_\nUsage: .${pattern} <text>`);
        }

        try {
          const logoUrl = await fetchLogoUrl(url, q, api);
          if (logoUrl) {
            await client.sendMessage(from, { image: { url: logoUrl } }, { quoted: mek });
          } else {
            reply("_Unable to fetch logo. Please try again later._");
          }
        } catch (error) {
          console.error(`${pattern} logo command error:`, error);
          reply(`❌ An error occurred:\n${error.message}`);
        }
      });
    }

    // Register two-text styles
    for (const [pattern, url] of Object.entries(styles2)) {
      keith({
        pattern,
        category: "ephoto",
        description: `Generate two-text logo using Ephoto style: ${pattern}`
      },
      async (from, client, conText) => {
        const { q, mek, reply, api } = conText;

        if (!q || !q.includes("|")) {
          return reply(`_Please provide two texts separated by '|'.\nUsage: .${pattern} text1|text2_`);
        }

        const [text1, text2] = q.split("|").map(s => s.trim());
        if (!text1 || !text2) {
          return reply("_Both text1 and text2 are required._");
        }

        try {
          const logoUrl = await fetchLogoUrl2(url, text1, text2, api);
          if (logoUrl) {
            await client.sendMessage(from, { image: { url: logoUrl } }, { quoted: mek });
          } else {
            reply("_Unable to fetch logo. Please try again later._");
          }
        } catch (error) {
          console.error(`${pattern} two-text logo command error:`, error);
          reply(`❌ An error occurred:\n${error.message}`);
        }
      });
    }
  } catch (err) {
    console.error("Error loading styles:", err.message);
  }
};

// Call loader once at startup
loadStyles();
