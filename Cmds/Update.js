const { keith } = require('../commandHandler');
const { database } = require('../settings');
const { DataTypes } = require('sequelize');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// DB Model for tracking updates
const UpdateDB = database.define('bot_updates', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  current_hash: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'initial' },
  last_checked: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('pending', 'updated', 'failed'), allowNull: false, defaultValue: 'updated' }
}, {
  timestamps: false,
  freezeTableName: true
});

// DB Operations
async function initializeUpdateDB() {
  await UpdateDB.sync();
  await UpdateDB.findOrCreate({
    where: { id: 1 },
    defaults: {
      current_hash: 'initial',
      last_checked: new Date(),
      status: 'updated'
    }
  });
}

async function getCurrentHash() {
  const record = await UpdateDB.findByPk(1);
  return record?.current_hash || 'initial';
}

async function setCurrentHash(hash) {
  return await UpdateDB.update({
    current_hash: hash,
    last_checked: new Date(),
    status: 'updated'
  }, { where: { id: 1 } });
}

// File Sync with preservation rules
async function syncFiles(source, target) {
  const preserveFiles = ['app.json', 'set.env'];
  const preserveFolders = ['backups', 'logs'];
  
  const items = await fs.readdir(source);

  for (const item of items) {
    if (preserveFiles.includes(item)) continue;
    if (preserveFolders.includes(item)) continue;
    
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);
    const stat = await fs.lstat(srcPath);

    if (stat.isDirectory()) {
      await fs.ensureDir(destPath);
      await syncFiles(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

// Update Command
keith({
  pattern: "update",
  aliases: ["upgrade", "sync"],
  description: "Update KEITH-MD from remote repository",
  category: "System",
  filename: __filename,
  reaction: "🔄"
}, async (from, client, conText) => {
  const { reply, isSuperUser, mek } = conText;

  if (!isSuperUser) return reply("❌ Owner-only command");

  // Send initial message and get its key
  const sent = await client.sendMessage(from, { text: "🔍 Checking for updates..." });
  const statusKey = sent.key;

  try {
    const repo = "kkeizza/Keith";
    const { data: commit } = await axios.get(
      `https://api.github.com/repos/${repo}/commits/main`,
      { timeout: 8000 }
    );

    const currentHash = await getCurrentHash();
    if (commit.sha === currentHash) {
      await client.sendMessage(from, { 
        text: "✅ Already running the latest version!", 
        edit: statusKey 
      });
      return;
    }

    // Download update
    await client.sendMessage(from, { 
      text: "⬇️ Downloading update...", 
      edit: statusKey 
    });
    
    const zipUrl = `https://github.com/${repo}/archive/${commit.sha}.zip`;
    const zipPath = path.join(__dirname, '..', 'temp_update.zip');
    const writer = fs.createWriteStream(zipPath);

    const response = await axios({
      url: zipUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000
    });

    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extract files
    await client.sendMessage(from, { 
      text: "📦 Extracting files...", 
      edit: statusKey 
    });
    
    const extractPath = path.join(__dirname, '..', 'temp_extract');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const extractedFolder = fs.readdirSync(extractPath)
      .find(name => name.startsWith('Keith-'));
    const updateSrc = path.join(extractPath, extractedFolder);

    // Apply update
    await client.sendMessage(from, { 
      text: "🔄 Applying update (preserving settings)...", 
      edit: statusKey 
    });
    
    await syncFiles(updateSrc, path.join(__dirname, '..'));
    await setCurrentHash(commit.sha);

    // Cleanup
    await client.sendMessage(from, { 
      text: "🧹 Cleaning up temporary files...", 
      edit: statusKey 
    });
    
    fs.unlinkSync(zipPath);
    fs.removeSync(extractPath);

    // Complete
    await client.sendMessage(from, { 
      text: "✅ Update complete! Restarting in 3 seconds...", 
      edit: statusKey 
    });
    
    setTimeout(() => {
      process.exit(0);
    }, 3000);
    
  } catch (err) {
    console.error("❗ Update failed:", err);
    await client.sendMessage(from, { 
      text: `❌ Update failed: ${err.message}`, 
      edit: statusKey 
    });
  }
});

// Initialize DB
initializeUpdateDB().catch(console.error);
