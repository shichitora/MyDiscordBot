import { EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import Tesseract from 'tesseract.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

// Regex
const patterns = {
// RULE: /YOUR_REGEX/,
};

// Support
const imageExts = ['.png'];
const videoExts = ['.mp4'];
const textExts = ['.txt'];

// History
const messageHistory = new Map();
const actionHistory = new Map();

// CleanFiles
async function cleanupFiles(tempFile, framesDir) {
  try {
    if (tempFile && (await fs.stat(tempFile).catch(() => null))) {
      await fs.unlink(tempFile);
      console.log(`Deleted temporary file: ${tempFile}`);
    }
  } catch (err) {
    console.error(`Error deleting temporary file ${tempFile}:`, err);
  }
  try {
    if (framesDir && (await fs.stat(framesDir).catch(() => null))) {
      await fs.rm(framesDir, { recursive: true, force: true });
      console.log(`Deleted temporary frames directory: ${framesDir}`);
    }
  } catch (err) {
    console.error(`Error deleting frames directory ${framesDir}:`, err);
  }
}
async function cleanupOldFiles() {
  const tempDir = process.env.HOME;
  try {
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      if (file.startsWith('temp_') || file.startsWith('frames_')) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats && Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          if (stats.isFile()) {
            await fs.unlink(filePath);
            console.log(`Deleted old temporary file: ${filePath}`);
          } else if (stats.isDirectory()) {
            await fs.rm(filePath, { recursive: true, force: true });
            console.log(`Deleted old temporary directory: ${filePath}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during old files cleanup:', err);
  }
}
setTimeout(cleanupOldFiles, 0);
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// SettingsLoad
const guildId = message.guildId;
let settings;
try {
    settings = JSON.parse(await fs.readFile('./settings.json', 'utf8'));
  } catch (err) {
    console.error('Error reading settings.json:', err);
    return;
  }
const guildSettings = settings.guilds[guildId];
if (!guildSettings) return;

// WhiteList
const isSenderWhitelisted =
  guildSettings.whitelist?.channels.includes(message.channelId) ||
  message.member?.roles.cache.some((role) => guildSettings.whitelist?.roles.includes(role.id)) ||
  guildSettings.whitelist?.members.includes(message.author.id);
  let isCommandUserWhitelisted = false;
  if (commandUser) {
  const commandMember = await message.guild.members.fetch(commandUser.id).catch(() => null);
  isCommandUserWhitelisted =
  guildSettings.whitelist?.members.includes(commandUser.id) ||
  (commandMember && commandMember.roles.cache.some((role) => guildSettings.whitelist?.roles.includes(role.id)));
}

// AntiTroll
// 一部非公開
if (!guildSettings.antiTroll?.enabled) return;
  let violation = null;
  if (!violation) {
    for (const [rule, enabled] of Object.entries(guildSettings.antiTroll.rules)) {
      if (!enabled) continue;
      if (rule === 'spam') {
        const userMessages = messageHistory.get(message.author.id) || [];
        userMessages.push({ content: message.content, time: Date.now() });
        messageHistory.set(message.author.id, userMessages.filter((m) => Date.now() - m.time < 10000));
        if (userMessages.length > 6) violation = 'spam';
      } else {
          userMessages.push({ content: message.content, time: Date.now() });
          messageHistory.set(message.author.id, userMessages.filter((m) => Date.now() - m.time < 5000));
        }
      } else if (patterns[rule] && patterns[rule].test(message.content)) {
        violation = rule;
      }
    }
  }

// ここに他の荒らし対策の処理を入れる
// 荒らし対策の処理を入れる
// 非公開
}
