import { EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import Tesseract from 'tesseract.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
const DEVELOPER_LOG_GUILD_ID = 'YOUR_DEVELOPER_LOG_GUILD_ID';
const DEVELOPER_LOG_CHANNEL_ID = 'YOUR_DEVELOPER_LOG_CHANNEL_ID';

// Regex
const patterns = {
// RULE: /YOUR_REGEX/,
};

// Support
const imageExts = ['.png'];
const videoExts = ['.mp4'];
const textExts = ['.txt'];

// BypassUserIds
const bypassUserIds = new Set([
  "USER_ID_1",
  "USER_ID_2"
]);

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

// CommandUser
async function processMessage(message, isUpdate = false, oldMessage = null) {
  let commandUser = null;
  if (message.interactionMetadata) {
    try {
      commandUser = message.interactionMetadata.user;
    } catch (err) {
      console.error('Error checking interaction:', err);
    }
  }

// Bypass
if (bypassUserIds.has(message.author.id)) return;
if (message.system) return;

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
  if (guildSettings.duplicate?.enabled && guildSettings.antiTroll.rules.duplicate) {
    const userMessages = messageHistory.get(message.author.id) || [];
    const timeframe = guildSettings.duplicate.timeframe || 10000;
    const similarityThreshold = guildSettings.duplicate.similarity || 0.75;
    for (const prev of userMessages) {
        if (
            message.content.length >= 5 &&
            prev.content &&
            prev.content.length >= 5 &&
            Date.now() - prev.time < timeframe &&
            similarity(message.content, prev.content) > similarityThreshold
        ) {
            violation = 'duplicate';
            break;
        }
    }
    userMessages.push({ content: message.content, time: Date.now() });
    messageHistory.set(message.author.id, userMessages.filter((m) => Date.now() - m.time < timeframe));
  }
  if (!violation) {
    for (const [rule, enabled] of Object.entries(guildSettings.antiTroll.rules)) {
      if (!enabled) continue;
      if (rule === 'spam') {
        const userMessages = messageHistory.get(message.author.id) || [];
        userMessages.push({ content: message.content, time: Date.now() });
        messageHistory.set(message.author.id, userMessages.filter((m) => Date.now() - m.time < 10000));
        if (userMessages.length > 6) violation = 'spam';
      } else if (rule === 'raid') {
        const userMessages = messageHistory.get(message.author.id) || [];
        if (message.content.length >= 10) {
          userMessages.push({ content: message.content, time: Date.now() });
          const recentMessages = userMessages.filter((m) => Date.now() - m.time < 5000);
          messageHistory.set(message.author.id, recentMessages);
          if (recentMessages.length >= 6) {
            violation = 'raid';
          }
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
// 非公開
  
  if (violation) {
    console.log(`Violation detected: ${violation} by ${message.author.tag}(${message.author.id}) - ${message.guildId}`);
    if (!isSenderWhitelisted || (commandUser && !isCommandUserWhitelisted)) {
      await handleViolation(
        message,
        violation,
        guildSettings,
        isUpdate,
        commandUser && !isCommandUserWhitelisted ? commandUser : null
      );
    }
  }
}

// Export
export async function execute(message) {
  await processMessage(message, false);
}

// MessageUpdate
export async function executeUpdate(oldMessage, newMessage) {
  if (newMessage.partial) {
    try {
      newMessage = await newMessage.fetch();
    } catch (err) {
      console.error('Error fetching updated message:', err);
      return;
    }
  }
  await processMessage(newMessage, true, oldMessage);
}

// Functions
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}
function editDistance(s1, s2) {
  const costs = new Array(s2.length + 1).fill(0);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1])
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// AntiTrollViolationDone
async function handleViolation(message, rule, settings, isUpdate = false, commandUser = null) {
  const points = settings.points[rule] || 1;
  const guildId = message.guildId;
  const targetUsers = [];
  if (!bypassUserIds.has(message.author.id)) {
    targetUsers.push({ id: message.author.id, tag: message.author.tag, member: message.member });
  }
  if (commandUser && !bypassUserIds.has(commandUser.id)) {
    const commandMember = await message.guild.members.fetch(commandUser.id).catch(() => null);
    if (commandMember) {
      targetUsers.push({ id: commandUser.id, tag: commandUser.tag, member: commandMember });
    }
  }
  let pointsData;
  try {
    pointsData = JSON.parse(await fs.readFile('./points.json', 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      pointsData = {};
      await fs.writeFile('./points.json', JSON.stringify(pointsData, null, 2));
    } else {
      console.error('Error reading points.json:', err);
      return;
    }
  }
  if (!pointsData[guildId]) pointsData[guildId] = {};
  const userPunishments = new Map();
  for (const user of targetUsers) {
    if (!pointsData[guildId][user.id]) pointsData[guildId][user.id] = { points: 0, lastViolation: null };
    pointsData[guildId][user.id].points += points;
    pointsData[guildId][user.id].lastViolation = Date.now();
    const totalPoints = pointsData[guildId][user.id].points;
    const thresholds = settings.points.thresholds || { '10': 'timeout', '20': 'kick', '30': 'ban' };
    let punishment = null;
    for (const [point, action] of Object.entries(thresholds)) {
      if (totalPoints >= parseInt(point)) punishment = action;
    }
    if (settings.block.enabled && punishment && user.member) {
      try {
        if (punishment === 'timeout') {
          await user.member.timeout(settings.block.timeout || 600000, `Violation: ${rule}`);
        } else if (punishment === 'kick') {
          await user.member.kick(`Violation: ${rule}`);
        } else if (punishment === 'ban') {
          await message.guild.members.ban(user.id, { reason: `Violation: ${rule}` });
        }
      } catch (err) {
        console.error(`Error applying punishment (${punishment}) to ${user.tag}:`, err);
      }
    }
    userPunishments.set(user.id, punishment);
  }
  try {
    await fs.writeFile('./points.json', JSON.stringify(pointsData, null, 2));
  } catch (err) {
    console.error('Error writing points.json:', err);
    return;
  }
  if (settings.logChannel) {
    const logChannel = message.guild.channels.cache.get(settings.logChannel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`Anti-Troll Violation (${isUpdate ? 'Message Update' : 'Message Create'})`)
        .setDescription(
          `**User**: ${message.author.tag} (${message.author.id})\n` +
          (commandUser ? `**Command User**: ${commandUser.tag} (${commandUser.id})\n` : '') +
          `**Rule**: ${rule}\n` +
          `**Points**: ${pointsData[guildId][message.author.id]?.points || 0}\n` +
          (commandUser ? `**Command User Points**: ${pointsData[guildId][commandUser.id]?.points || 0}\n` : '') +
          `**Punishment**: ${targetUsers
            .map((u) => (u.member && userPunishments.get(u.id) ? userPunishments.get(u.id) : 'None'))
            .join(', ')}\n` +
          `**Message**: ${message.content}`
        )
        .setTimestamp();
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error('Error sending log:', err);
      }
    }
  }
  try {
    const externalGuild = await message.client.guilds.fetch(DEVELOPER_LOG_GUILD_ID);
    const externalChannel = externalGuild.channels.cache.get(DEVELOPER_LOG_CHANNEL_ID);
    if (externalChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`Anti-Troll Violation from ${message.guild.name} (${isUpdate ? 'Message Update' : 'Message Create'})`)
        .setDescription(
          `**Server**: ${message.guild.name} (${message.guildId})\n` +
          `**Channel**: ${message.channel.name} (${message.channelId})\n` +
          `**User**: ${message.author.tag} (${message.author.id})\n` +
          (commandUser ? `**Command User**: ${commandUser.tag} (${commandUser.id})\n` : '') +
          `**Rule**: ${rule}\n` +
          `**Points**: ${pointsData[guildId][message.author.id]?.points || 0}\n` +
          (commandUser ? `**Command User Points**: ${pointsData[guildId][commandUser.id]?.points || 0}\n` : '') +
          `**Punishment**: ${targetUsers
            .map((u) => (u.member && userPunishments.get(u.id) ? userPunishments.get(u.id) : 'None'))
            .join(', ')}\n` +
          `**Message**: ${message.content}`
        )
        .setTimestamp();
      await externalChannel.send({ embeds: [embed] });
    } else {
      console.error(`Developer log channel ${DEVELOPER_LOG_CHANNEL_ID} not found in guild ${DEVELOPER_LOG_GUILD_ID}`);
    }
  } catch (err) {
    console.error('Error sending log to developer channel:', err);
  }
  try {
    await message.delete();
  } catch (err) {
    console.error('Error deleting message:', err);
  }
}
