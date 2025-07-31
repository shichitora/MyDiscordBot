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
export async function handleReactionSpam(client) {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (bypassUserIds.has(user.id)) return;
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('リアクションの取得に失敗:', error);
        return;
      }
    }
    const guildId = reaction.message.guildId;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    let settings;
    try {
      const data = await readFile(settingsPath, 'utf8');
      settings = JSON.parse(data);
    } catch (error) {
      console.error('設定ファイルの読み込みに失敗:', error);
      return;
    }
    const guildSettings = settings.guilds[guildId];
    if (!guildSettings || !guildSettings.antiTroll?.enabled || !guildSettings.antiTroll.rules.emoji_limit?.enabled) return;
    if (
      guildSettings.whitelist?.channels.includes(reaction.message.channelId) ||
      member.roles.cache.some((role) => guildSettings.whitelist?.roles.includes(role.id)) ||
      guildSettings.whitelist?.members.includes(user.id)
    ) return;
    const reactionLimit = guildSettings.antiTroll.rules.emoji_limit?.limit || 5;
    const timeframe = 5000;
    const userReactions = reactionHistory.get(user.id) || [];
    userReactions.push({ time: Date.now() });
    const recentReactions = userReactions.filter((r) => Date.now() - r.time < timeframe);
    reactionHistory.set(user.id, recentReactions);
    if (recentReactions.length >= reactionLimit) {
      await handleViolation(reaction, user, 'emoji_limit', guildSettings);
      reactionHistory.set(user.id, []);
    }
  });
  setInterval(() => {
    for (const [userId, reactions] of reactionHistory) {
      const recentReactions = reactions.filter((r) => Date.now() - r.time < 10000);
      if (recentReactions.length === 0) {
        reactionHistory.delete(userId);
      } else {
        reactionHistory.set(userId, recentReactions);
      }
    }
  }, 60000);
}

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
