import { Events, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
const reactionHistory = new Map();
const settingsPath = join(process.cwd(), 'settings.json');
const pointsPath = join(process.cwd(), 'points.json');

// BypassUserIds
const bypassUserIds = new Set([
  "USER_ID_1",
  "USER_ID_2",
]);

// MainHandler
// ここは非公開

// AntiTrollViolationDone
async function handleViolation(reaction, user, rule, settings) {
  const guildId = reaction.message.guildId;
  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  const points = settings.points[rule] || 1;
  let pointsData;
  try {
    pointsData = JSON.parse(await readFile(pointsPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      pointsData = {};
      await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
    } else {
      console.error('Error reading points.json:', err);
      return;
    }
  }
  if (!pointsData[guildId]) pointsData[guildId] = {};
  if (!pointsData[guildId][user.id]) pointsData[guildId][user.id] = { points: 0, lastViolation: null };
  pointsData[guildId][user.id].points += points;
  pointsData[guildId][user.id].lastViolation = Date.now();
  try {
    await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
  } catch (err) {
    console.error('Error writing points.json:', err);
    return;
  }
  const totalPoints = pointsData[guildId][user.id].points;
  const thresholds = settings.points.thresholds || { '10': 'timeout', '20': 'kick', '30': 'ban' };
  let punishment = null;
  for (const [point, action] of Object.entries(thresholds)) {
    if (totalPoints >= parseInt(point)) punishment = action;
  }
  if (settings.block.enabled && punishment) {
    try {
      if (punishment === 'timeout') {
        await member.timeout(settings.block.timeout || 600000, `Violation: ${rule}`);
      } else if (punishment === 'kick') {
        await member.kick(`Violation: ${rule}`);
      } else if (punishment === 'ban') {
        await guild.members.ban(user.id, { reason: `Violation: ${rule}` });
      }
    } catch (err) {
      console.error(`Error applying punishment (${punishment}):`, err);
    }
  }
  if (settings.logChannel) {
    const logChannel = guild.channels.cache.get(settings.logChannel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Anti-Troll Violation')
        .setDescription(
          `**User**: ${user.tag}\n**Rule**: ${rule}\n**Points**: ${totalPoints}\n**Punishment**: ${punishment || 'None'}\n**Message**: ${reaction.message.url}`
        )
        .setTimestamp();
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error('Error sending log:', err);
      }
    }
  }
}
