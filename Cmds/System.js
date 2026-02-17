const { keith } = require('../commandHandler');
const fs = require('fs');
const path = require('path');
const now = require('performance-now');
const fsp = require('fs').promises;
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "removebg2",
  aliases: ["bgremove2", "nobg"],
  category: "Ai",
  description: "Remove background from quoted image"
}, async (from, client, conText) => {
  const { quotedMsg, mek, reply } = conText;

  const mediaType = quotedMsg?.imageMessage;
  if (!mediaType) return reply("❌ Quote an image to remove background.");

  try {
    // Download quoted image
    const mediaPath = await client.downloadAndSaveMediaMessage(mediaType);

    // Step 1: create job
    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(mediaPath)); // stream file
    formData.append("turnstile_token", "");

    const createRes = await axios.post(
      "https://api.ezremove.ai/api/ez-remove/background-remove/create-job-v2",
      formData,
      {
        headers: {
          "product-serial": "07cc2e862644a6a1860194a9f6a6f70f",
          ...formData.getHeaders()
        }
      }
    );

    const jobId = createRes.data?.result?.job_id;
    if (!jobId) {
      fs.unlinkSync(mediaPath);
      return reply("❌ Failed to create removebg job.");
    }

    // Step 2: poll job result
    let outputUrl;
    for (let i = 0; i < 10; i++) {
      const getRes = await axios.get(
        `https://api.ezremove.ai/api/ez-remove/background-remove/get-job/${jobId}`
      );
      outputUrl = getRes.data?.result?.output?.[0];
      if (outputUrl) break;
      await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
    }

    fs.unlinkSync(mediaPath);

    if (!outputUrl) return reply("⚠️ Background removal not ready.");

    // Step 3: send result image
    await client.sendMessage(from, {
      image: { url: outputUrl },
      caption: "✅ Background removed"
    }, { quoted: mek });

  } catch (err) {
    console.error("removebg error:", err);
    reply("⚠️ An error occurred while removing background.");
  }
});
//========================================================================================================================
//========================================================================================================================


keith({
  pattern: "deljunk",
  aliases: ["deletejunk", "clearjunk", "cleanjunk"],
  description: "Delete junk files from session, tmp, logs, and more",
  category: "System",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("✖ You need superuser privileges to execute this command.");

  await reply("🔍 Scanning for junk files...");

  const JUNK_FILE_TYPES = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg',
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv',
    '.mp3', '.wav', '.ogg', '.opus', '.m4a', '.flac',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.log', '.tmp', '.temp', '.cache'
  ];

  const DIRECTORIES_TO_CLEAN = [
    { path: "./session", filters: ["pre-key", "sender-key", "session-", "app-state"], name: "session" },
    { path: "./tmp", filters: JUNK_FILE_TYPES.map(ext => ext.slice(1)), name: "temporary" },
    { path: "./logs", filters: ['.log', '.txt'], name: "logs" },
    { path: "./message_data", filters: JUNK_FILE_TYPES.map(ext => ext.slice(1)), name: "message data" }
  ];

  const OPTIONAL_DIRS = ['temp', 'cache', 'downloads', 'upload'];
  for (const dir of OPTIONAL_DIRS) {
    const dirPath = path.resolve(`./${dir}`);
    try {
      await fsp.access(dirPath);
      DIRECTORIES_TO_CLEAN.push({
        path: dirPath,
        filters: JUNK_FILE_TYPES.map(ext => ext.slice(1)),
        name: dir
      });
    } catch {}
  }

  const cleanDirectory = async (dirPath) => {
    const files = await fsp.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fsp.stat(filePath);
      if (stat.isDirectory()) {
        await cleanDirectory(filePath);
        await fsp.rmdir(filePath);
      } else {
        await fsp.unlink(filePath);
      }
    }
  };

  const cleanJunkFiles = async (dirPath, filters, folderName) => {
    try {
      const exists = await fsp.access(dirPath).then(() => true).catch(() => false);
      if (!exists) return { count: 0, folder: folderName };

      const files = await fsp.readdir(dirPath);
      const junkFiles = files.filter(item => {
        const lower = item.toLowerCase();
        return filters.some(f => lower.includes(f.toLowerCase())) ||
               JUNK_FILE_TYPES.some(ext => lower.endsWith(ext));
      });

      if (junkFiles.length === 0) return { count: 0, folder: folderName };

      await reply(`🗑️ Clearing ${junkFiles.length} junk files from ${folderName}...`);

      let deleted = 0;
      for (const file of junkFiles) {
        try {
          const filePath = path.join(dirPath, file);
          const stat = await fsp.stat(filePath);
          if (stat.isDirectory()) {
            await cleanDirectory(filePath);
          } else {
            await fsp.unlink(filePath);
          }
          deleted++;
        } catch (err) {
          console.error(`Error deleting ${file}:`, err);
        }
      }

      return { count: deleted, folder: folderName };
    } catch (err) {
      console.error(`Error scanning ${folderName}:`, err);
      await reply(`⚠ Error cleaning ${folderName}: ${err.message}`);
      return { count: 0, folder: folderName, error: true };
    }
  };

  let totalDeleted = 0;
  const results = [];

  for (const dir of DIRECTORIES_TO_CLEAN) {
    const result = await cleanJunkFiles(dir.path, dir.filters, dir.name);
    results.push(result);
    totalDeleted += result.count;
  }

  if (totalDeleted === 0) {
    await reply("✅ No junk files found to delete!");
  } else {
    let summary = "🗑️ *Junk Cleanup Summary:*\n";
    results.forEach(res => {
      summary += `• ${res.folder}: ${res.count} files${res.error ? ' (with errors)' : ''}\n`;
    });
    summary += `\n✅ *Total deleted:* ${totalDeleted} junk files`;
    await reply(summary);
  }

  if (os.platform() === 'win32') {
    try {
      await execAsync('del /q /f /s %temp%\\*.*');
      await reply("♻ Also cleared system temporary files!");
    } catch (err) {
      console.error('System temp cleanup error:', err);
    }
  }
});
//========================================================================================================================


keith({
  pattern: "ping",
  aliases: ["speed", "latency"],
  description: "To check bot speed",
  category: "System",
  filename: __filename
}, async (from, client, conText) => {
  const { botname, author, sender } = conText;

  try {
    const startTime = now();

    const contactMessage = {
      key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
      message: {
        contactMessage: {
          displayName: author,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${author};;;;\nFN:${author}\nitem1.TEL;waid=${sender?.split('@')[0] ?? 'unknown'}:${sender?.split('@')[0] ?? 'unknown'}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        },
      },
    };

    const pingSpeed = now() - startTime;

    await client.sendMessage(from, {
      text: `${botname} speed\n\n *${pingSpeed.toFixed(4)} ms*`
    }, { quoted: contactMessage });

  } catch (err) {
    console.error("Ping error:", err);
  }
}); 


//========================================================================================================================
//const { keith } = require('../commandHandler');

keith({
  pattern: "resetdb",
  aliases: ["cleardb", "refreshdb"],
  description: "Delete the database file at ./database.db",
  category: "System",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;

  if (!isSuperUser) return reply("✖ You need superuser privileges to execute this command.");

  const dbPath = path.resolve("./database.db");

  try {
    if (!fs.existsSync(dbPath)) return reply("✅ No database file found to delete.");

    fs.unlinkSync(dbPath);
    reply("🗑️ Database file deleted successfully.");
  } catch (err) {
    console.error("cleardb error:", err);
    reply("❌ Failed to delete database file. Check logs for details.");
  }
});
//========================================================================================================================


keith({
  pattern: "restart",
  aliases: ["reboot", "startbot"],
  description: "Bot restart",
  category: "System",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("❌ You need superuser privileges to execute this command.");
  }

  try {
    await reply("*Restarting...*");

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(3000);

    process.exit(0);
  } catch (err) {
    console.error("Restart error:", err);
    reply("❌ Failed to restart. Check logs for details.");
  }
});
//========================================================================================================================
//const { keith } = require('../commandHandler');

const formatUptime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? `${d} ${d === 1 ? "day" : "days"}, ` : "";
    const hDisplay = h > 0 ? `${h} ${h === 1 ? "hour" : "hours"}, ` : "";
    const mDisplay = m > 0 ? `${m} ${m === 1 ? "minute" : "minutes"}, ` : "";
    const sDisplay = s > 0 ? `${s} ${s === 1 ? "second" : "seconds"}` : "";

    return `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`.trim().replace(/,\s*$/, "");
};

keith(
  {
    pattern: "uptime",
    aliases: ["up", "runtime"],
    category: "System",
    description: "Show bot runtime",
  },
  async (from, client, conText) => {
    const { reply, botname, pushName, author, sender } = conText;

    try {
      const contactMessage = {
        key: {
          fromMe: false,
          participant: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
        },
        message: {
          contactMessage: {
            displayName: author,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${author};;;;\nFN:${author}\nitem1.TEL;waid=${sender?.split('@')[0] ?? 'unknown'}:${sender?.split('@')[0] ?? 'unknown'}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        },
        },
      };

      const uptimeText = `${botname} uptime is: *${formatUptime(process.uptime())}*`;

      await client.sendMessage(from, { text: uptimeText }, { quoted: contactMessage });
    } catch (error) {
      console.error("Error sending uptime message:", error);
    }
  }
);
//========================================================================================================================




const formatSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

keith({
  pattern: "test",
  aliases: ["botstatus", "alive"],
  description: "Display bot system information",
  category: "System",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, isSuperUser } = conText;
  if (!isSuperUser) return reply("❌ You need superuser privileges to view system status.");

  const start = now();

  const uptime = process.uptime();
  const formattedUptime = formatUptime(uptime);

  const totalRam = os.totalmem();
  const freeRam = os.freemem();
  const usedRam = totalRam - freeRam;

  const memory = process.memoryUsage();
  const heapUsed = formatSize(memory.heapUsed);
  const heapTotal = formatSize(memory.heapTotal);

  let disk = { size: "N/A", free: "N/A" };
  try {
    const { stdout } = await execAsync('df -h --total | grep total');
    const parts = stdout.trim().split(/\s+/);
    disk.size = parts[1];
    disk.free = parts[3];
  } catch (err) {
    console.error("Disk usage error:", err);
  }

  let download = "N/A", upload = "N/A";
  try {
    const { stdout } = await execAsync("vnstat --oneline | awk -F';' '{print $4, $6}'");
    const [dl, ul] = stdout.trim().split(" ");
    download = dl || "N/A";
    upload = ul || "N/A";
  } catch (err) {
    console.error("Network stats error:", err);
  }

  const ping = `${(now() - start).toFixed(2)} ms`;

  const status = `📊 *Bot Status*\n\n` +
    `🔸 *Ping:* ${ping}\n` +
    `🔸 *Uptime:* ${formattedUptime}\n` +
    `🔸 *RAM Usage:* ${formatSize(usedRam)} / ${formatSize(totalRam)}\n` +
    `🔸 *Free RAM:* ${formatSize(freeRam)}\n` +
    `🔸 *Process Memory:* ${heapUsed} / ${heapTotal}\n` +
    `🔸 *Disk Usage:* ${disk.size} / ${disk.free}\n` +
    `🔸 *Platform:* ${os.platform()}\n` +
    `🔸 *NodeJS:* ${process.version}\n` +
    `🔸 *CPU:* ${os.cpus()[0].model}\n` +
    `🔸 *Downloaded:* ${download}\n` +
    `🔸 *Uploaded:* ${upload}`;

  await reply(status);
});



