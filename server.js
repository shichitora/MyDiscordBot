import fs from "fs";
import path from "path";
import { join } from 'path';
import { readdirSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import express from "express";
import fetch from "node-fetch";
import { modalSubmit } from './commands/samples/admin.mjs';
import { Client, Collection, Events, GatewayIntentBits, ActivityType, EmbedBuilder, ButtonBuilder, ButtonStyle, IntentsBitField, AuditLogEvent, PermissionsBitField, ContextMenuCommandBuilder, ApplicationCommandType, Routes, Partials, WebhookClient } from "discord.js";
import CommandsRegister from "./regist-commands.mjs";
import { getShopPanels, getUserData, updateUserData } from "./utils/db.js";
import { handleReactionSpam } from './reactionSpam.mjs';
import 'dotenv/config';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEVELOPER_LOG_GUILD_ID = 'YOUR_DEVELOPER_LOG_GUILD_ID';
const DEVELOPER_LOG_CHANNEL_ID = 'YOUR_DEVELOPER_LOG_CHANNEL_ID';

// Client
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions ],
  partials: [ Partials.Message, Partials.Channel, Partials.Reaction ],
  messageCacheLifetime: 25,
  messageSweepInterval: 25,
});
client.login('YOUR_BOT_TOKEN');

// AntiReactionSpam
handleReactionSpam(client);

// bypassUserIds
const bypassUserIds = new Set( [ "USER_ID_1", "USER_ID_2" ]);

// Handler
const handlers = new Map();
const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs
  .readdirSync(handlersPath)
  .filter((file) => file.endsWith(".mjs"));
for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  import(filePath).then((module) => {
    handlers.set(file.slice(0, -4), module);
  });
}

// SlashCommand
CommandsRegister();
client.commands = new Collection();
const categoryFoldersPath = path.join(process.cwd(), "commands");
const commandFolders = fs.readdirSync(categoryFoldersPath);
for (const folder of commandFolders) {
  const commandsPath = path.join(categoryFoldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".mjs"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then((module) => {
      client.commands.set(module.data.name, module);
    });
  }
}

// Anti-Troll
import { execute, executeUpdate } from './events/messageHandler.js';
client.on('messageCreate', execute);
client.on('messageUpdate', executeUpdate);

// OtherMessageFile
const eventFiles = fs.readdirSync('./event').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = await import(`./event/${file}`);
  client.on(event.default.name, (...args) => event.default.execute(...args, client));
}

// PointFile
async function initializeFiles() {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    const pointsPath = path.join(process.cwd(), "data", "points.json");
    try {
      await readFile(settingsPath);
    } catch {
      await writeFile(settingsPath, JSON.stringify({ guilds: {} }, null, 2));
    }
    try {
      await readFile(pointsPath);
    } catch {
      await writeFile(pointsPath, JSON.stringify({}, null, 2));
    }
  } catch (err) {
    console.error('Failed to initialize files:', err);
  }
}

// AntiNuke
async function handleAntiNuke(eventType, guild, userId, targetId, targetName) {
  const settingsPath = path.join(process.cwd(), "settings.json");
  let settings;
  try {
    const data = await readFile(settingsPath);
    settings = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read settings.json:', err);
    return;
  }
  const actionHistory = new Map();
  const postCreation = new Map();
  const TIME_WINDOW = 60000;
  const TIMEOUT_DURATION = 10 * 60 * 1000;
  const guildId = guild.id;
  const logChannelId = settings.guilds[guildId]?.logChannel;
  const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;
  const whitelist = settings.guilds[guildId]?.whitelist || { members: [], roles: [], channels: [] };
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member || whitelist.members.includes(userId) || member.roles.cache.some(r => whitelist.roles.includes(r.id))) {
    return;
  }
  const now = Date.now();
  if (!actionHistory.has(guildId)) {
    actionHistory.set(guildId, new Map());
  }
  const guildActions = actionHistory.get(guildId);
  if (!guildActions.has(userId)) {
    guildActions.set(userId, []);
  }
  const userActions = guildActions.get(userId);
  userActions.push({ type: eventType, timestamp: now, targetId });
  actionHistory.get(guildId).set(userId, userActions.filter(a => now - a.timestamp <= TIME_WINDOW));
  const rateLimit = 10;
  if (userActions.length > rateLimit) {
    try {
    if (bypassUserIds.has(member.id)) return;
      await member.kick();
      if (logChannel && logChannel.type === 0) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Anti-Nuke 検知')
          .setDescription(`${member.user.tag} が ${eventType} を過剰に実行しました。`)
          .addFields(
            { name: 'ユーザー', value: `<@${userId}>`, inline: true },
            { name: 'アクション', value: eventType, inline: true },
            { name: '対象', value: targetName || targetId, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });
      }
      await member.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('警告')
            .setDescription(`あなたは ${eventType} を過剰に実行しました。`)
            .setTimestamp()
        ]
      }).catch(() => {});
    } catch (error) {
      console.error(`Error handling ${eventType} rate limit:`, error);
    }
  }
}
client.on(Events.ChannelCreate, async (channel) => {
  if (!channel.guild) return;
  const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE', limit: 1 }).catch(() => null);
  const entry = auditLogs?.entries.first();
  const userId = entry?.executorId || client.user.id;
});
client.on(Events.ChannelDelete, async (channel) => {
  if (!channel.guild) return;
  const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 1 }).catch(() => null);
  const entry = auditLogs?.entries.first();
  const userId = entry?.executorId || client.user.id;
});
client.on(Events.RoleCreate, async (role) => {
  const auditLogs = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE', limit: 1 }).catch(() => null);
  const entry = auditLogs?.entries.first();
  const userId = entry?.executorId || client.user.id;
});
client.on(Events.RoleDelete, async (role) => {
  const auditLogs = await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE', limit: 1 }).catch(() => null);
  const entry = auditLogs?.entries.first();
  const userId = entry?.executorId || client.user.id;
});
client.on('guildBanAdd', async (ban) => {
  try {
    const guild = ban.guild;
    const user = ban.user;
    const auditLogs = await guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 }).catch(() => null);
    const entry = auditLogs?.entries.first();
    const userId = entry?.executorId || client.user.id;
  } catch (error) {
    console.error('Error handling guild ban add:', error);
  }
});

// botBAN
client.on('guildCreate', async guild => {
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  const botban = config.botban || { users: {}, servers: {} };
  if (botban.servers[guild.id] || botban.users[guild.ownerId]) {
    await guild.leave();
  }
});
client.on('guildMemberAdd', async member => {
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  const botban = config.botban || { users: {}, servers: {} };
  if (botban.users[member.id] && member.id === member.guild.ownerId) {
    await member.guild.leave();
  }
});

// AutoRole
client.on('guildMemberAdd', async member => {
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  const roleId = config[member.guild.id]?.autorole;
  if (roleId) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role);
  }
});

// GuildBotFirstMessage
client.on(Events.GuildCreate, async (guild) => {
    try {
        const channel = guild.systemChannel;
        if (!channel) {
            console.log(`No suitable channel found in guild: ${guild.name}`);
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle('ご導入ありがとうございます！')
            .setDescription(`${guild.name} EXAMPLE MESSAGE`)
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: 'EXAMPLE MESSAGE' });
        await channel.send({ embeds: [embed] });
        console.log(`Sent welcome embed to ${guild.name}`);
    } catch (error) {
        console.error(`Error sending embed to ${guild.name}:`, error);
    }
});

// AutoKick
client.on('guildMemberAdd', async member => {
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  const guildConfig = config[member.guild.id]?.autokick;
  if (!guildConfig?.enabled) return;

  if (guildConfig.condition === 'avatarless' && !member.user.avatar) {
    await member.kick('アバターが設定されていません');
  } else if (guildConfig.condition === 'newaccount') {
    const createdAt = member.user.createdAt;
    const now = new Date();
    const diff = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (diff < 1) await member.kick('アカウント作成から1日未満');
  }
});

// WelcomeMessage
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    const data = await readFile(settingsPath);
    const settings = JSON.parse(data);
    const guildId = member.guild.id;
    const welcomeChannelId = settings.guilds[guildId]?.welcomeChannel;
    if (!settings.guilds[guildId]?.welcomeChannel) { return; }
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) { return; }
    const memberCount = member.guild.memberCount;
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('ようこそ！')
      .setDescription(`${member.user.tag} さんが ${member.guild.name} に参加しました！`)
      .addFields(
        { name: 'ユーザー名', value: `${member.user.username}`, inline: true },
        { name: 'ユーザーID', value: `${member.user.id}`, inline: true },
        { name: 'アカウント作成日', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'サーバー参加日時', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'サーバー人数', value: `${memberCount}人`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({}))
      .setTimestamp();
    await channel.send({
      content: `ようこそ、${member.user.tag}！`,
      embeds: [welcomeEmbed]
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// MemberByeMessage
client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    const data = await readFile(settingsPath);
    const settings = JSON.parse(data);
    const guildId = member.guild.id;
    const welcomeChannelId = settings.guilds[guildId]?.welcomeChannel;
    if (!settings.guilds[guildId]?.welcomeChannel) { return; }
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) { return; }
    const memberCount = member.guild.memberCount;
    const leaveEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('さようなら')
      .setDescription(`${member.user.tag} さんが ${member.guild.name} から退出しました。`)
      .addFields(
        { name: 'ユーザー名', value: `${member.user.username}`, inline: true },
        { name: 'ユーザーID', value: `${member.user.id}`, inline: true },
        { name: 'アカウント作成日', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'サーバー人数', value: `${memberCount}人`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({}))
      .setTimestamp();
    await channel.send({
      content: `${member.user.tag} さんがサーバーから退出しました。また戻ってきてね！`,
      embeds: [leaveEmbed]
    });
  } catch (error) {
    console.error('Error sending leave message:', error);
  }
});

// MutedRole
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  const settingsPath = path.join(process.cwd(), "settings.json");
  let settings;
  try {
    const data = await readFile(settingsPath);
    settings = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read settings.json:', err);
    return;
  }
  const guildId = message.guild.id;
  const muteRoleId = settings.guilds[guildId]?.muteRoleId;
  const muteRole = muteRoleId ? message.guild.roles.cache.get(muteRoleId) : null;
  if (muteRole && message.member.roles.cache.has(muteRoleId)) {
    try {
      await message.delete();
      await message.member.timeout(604800000, 'Muted user attempted to send a message');
      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('警告')
            .setDescription('あなたはミュートされています。メッセージを送信しないでください。')
            .setTimestamp()
        ],
      }).catch(() => {});
    } catch (error) {
      console.error('Error handling muted user:', error);
    }
  }
});

// Anti-Thread-Spam
const threadCreation = new Map();
client.on('threadCreate', async (thread) => {
  const member = await thread.guild.members.fetch(thread.ownerId).catch(() => null);
  if (!member) return;
  const settingsPath = path.join(process.cwd(), "settings.json");
  let settings;
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    settings = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read settings.json:', err);
    return;
  }
  const guildId = thread.guild.id;
  const guildSettings = settings.guilds[guildId];
  if (!guildSettings?.antiTroll?.enabled) return;
  const isWhitelisted =
    bypassUserIds.has(member.id) ||
    guildSettings.whitelist?.members.includes(member.id) ||
    member.roles.cache.some(role => guildSettings.whitelist?.roles.includes(role.id));
  if (isWhitelisted) return;
  const rateLimit = guildSettings.antiTroll?.rules?.thread_limit?.limit || 2;
  const TIME_WINDOW = 5000;
  const TIMEOUT_DURATION = guildSettings.block?.timeout || 600000;
  const points = guildSettings.points?.thread_limit || 1;
  const now = Date.now();
  if (!threadCreation.has(member.id)) {
    threadCreation.set(member.id, [{ timestamp: now, threadId: thread.id }]);
  } else {
    const userThreads = threadCreation.get(member.id);
    userThreads.push({ timestamp: now, threadId: thread.id });
    const recentThreads = userThreads.filter(t => now - t.timestamp <= TIME_WINDOW);
    threadCreation.set(member.id, recentThreads);
    if (recentThreads.length > rateLimit) {
      try {
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
        if (!pointsData[guildId][member.id]) pointsData[guildId][member.id] = { points: 0, lastViolation: null };
        pointsData[guildId][member.id].points += points;
        pointsData[guildId][member.id].lastViolation = now;
        const totalPoints = pointsData[guildId][member.id].points;
        const thresholds = guildSettings.points?.thresholds || { '10': 'timeout', '20': 'kick', '30': 'ban' };
        let punishment = null;
        for (const [point, action] of Object.entries(thresholds)) {
          if (totalPoints >= parseInt(point)) punishment = args[0];
        }
        for (const t of recentThreads) {
          const threadToDelete = await thread.guild.channels.fetch(t.threadId).catch(() => null);
          if (threadToDelete) await threadToDelete.delete();
        }
        if (guildSettings.block?.enabled && punishment) {
          try {
            if (punishment === 'timeout') {
              await member.timeout(TIMEOUT_DURATION, 'Rate limit exceeded for thread creation');
            } else if (punishment === 'kick') {
              await member.kick('Rate limit exceeded for thread creation');
            } else if (punishment === 'ban') {
              await thread.guild.members.ban(member.id, { reason: 'Rate limit exceeded for thread creation' });
            }
          } catch (err) {
            console.error(`Error applying punishment (${punishment}) to ${member.user.tag}:`, err);
          }
        }
        try {
          await fs.writeFile('./points.json', JSON.stringify(pointsData, null, 2));
        } catch (err) {
          console.error('Error writing points.json:', err);
          return;
        }
        await member.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Warning')
              .setDescription(
                `You have exceeded the thread creation limit (${rateLimit}/5 seconds).\n` +
                `**Points**: ${totalPoints}\n` +
                `**Punishment**: ${punishment || 'None'}\n` +
                `You have been timed out for 10 minutes.`
              )
              .setTimestamp()
          ]
        }).catch(err => console.error('Error sending user notification:', err));
        if (guildSettings.logChannel) {
          const logChannel = await thread.guild.channels.fetch(guildSettings.logChannel).catch(() => null);
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setTitle('Thread Creation Limit Violation')
              .setDescription(
                `**User**: ${member.user.tag} (${member.id})\n` +
                `**Rule**: thread_limit\n` +
                `**Points**: ${totalPoints}\n` +
                `**Punishment**: ${punishment || 'None'}\n` +
                `**Thread Count**: ${recentThreads.length}/${rateLimit}`
              )
              .setTimestamp();
            await logChannel.send({ embeds: [embed] }).catch(err => console.error('Error sending server log:', err));
          }
        }
        try {
          const externalGuild = await client.guilds.fetch(DEVELOPER_LOG_GUILD_ID);
          const externalChannel = externalGuild.channels.cache.get(DEVELOPER_LOG_CHANNEL_ID);
          if (externalChannel) {
            const embed = new EmbedBuilder()
              .setTitle(`Thread Creation Limit Violation from ${thread.guild.name}`)
              .setDescription(
                `**Server**: ${thread.guild.name} (${thread.guild.id})\n` +
                `**Channel**: ${thread.parent?.name || 'Unknown'} (${thread.parentId || 'Unknown'})\n` +
                `**User**: ${member.user.tag} (${member.id})\n` +
                `**Rule**: thread_limit\nrobot.txt` +
                `**Points**: ${totalPoints}\n` +
                `**Punishment**: ${punishment || 'None'}\n` +
                `**Thread Count**: ${threadCreation.size}/${rateLimit}`
              )
              .setTimestamp();
            await externalChannel.send({ embeds: [embed] });
          } else {
            console.error(`Developer log channel ${DEVELOPER_LOG_CHANNEL_ID} not found in guild ${DEVELOPER_LOG_GUILD_ID}`);
          }
        } catch (err) {
          console.error('Error sending log to developer channel:', err);
        }
      } catch (error) {
        console.error('Error handling thread creation rate limit:', error);
      }
    }
  }
  setTimeout(() => {
    const userThreads = threadCreation.get(member.id) || [];
    threadCreation.set(member.id, userThreads.filter(t => now - t.timestamp <= TIME_WINDOW));
  }, TIME_WINDOW);
});

// ButtonInteractions
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    console.log("Button clicked:", interaction.customId);
    if (
      interaction.customId === "hit" ||
      interaction.customId === "stand" ||
      interaction.customId.startsWith("mines_") ||
      interaction.customId === "rock" ||
      interaction.customId === "scissors" ||
      interaction.customId === "paper"
    ) { return; }
    if (interaction.customId.startsWith("shop_buy_")) {
      await interaction.deferReply({ ephemeral: true });
      const start = Date.now();
      const roleId = interaction.customId.split("_")[2];
      const guildId = interaction.guild.id;
      const channelId = interaction.channel.id;
      const userId = interaction.user.id;
      try {
        const panels = getShopPanels(guildId, channelId);
        console.log("Panels:", panels);
        const panel = panels.find((p) =>
          p.roles.some(
            (r) => r.roleId === roleId && p.messageId === interaction.message.id
          )
        );
        if (!panel) {
          await interaction.editReply({
            content: "このパネルは無効です。",
          });
          return;
        }
        const roleData = panel.roles.find((r) => r.roleId === roleId);
        const price = roleData.price;
        const userData = getUserData(guildId, userId);
        if (userData.balance < price) {
          await interaction.editReply({
            content: `残高不足！必要: ${price} コイン, 現在の残高: ${userData.balance} コイン`,
          });
          return;
        }
        const member = await interaction.guild.members.fetch(userId);
        if (member.roles.cache.has(roleId)) {
          await interaction.editReply({
            content: `あなたはすでに <@&${roleId}> を持っています！`,
          });
          return;
        }
        await member.roles.add(roleId);
        userData.balance -= price;
        updateUserData(guildId, userId, userData);
        await interaction.editReply({
          content: `<@&${roleId}> を ${price} コインで購入しました！現在の残高: ${userData.balance} コイン`,
        });
      } catch (error) {
        console.error("Error in shop buy:", error);
        await interaction.editReply({
          content:
            "ロールの購入中にエラーが発生しました。管理者にお問い合わせください。",
        });
      }
    }
    if (!interaction.guild.members.me.permissions.has(['SendMessages', 'ManageRoles', 'ManageChannels', 'ModerateMembers'])) {
      console.log('Missing required permissions for button interaction');
      await interaction.reply({
        content: 'ボットに必要な権限（メッセージ送信、ロール管理、チャンネル管理、メンバー管理）がありません！',
        ephemeral: true
      });
      return;
    }
    if (interaction.customId.startsWith("ticket_")) {
      await interaction.deferReply({ ephemeral: true });
      const start = Date.now();
      try {
        const categoryId = interaction.channel.parentId;
        if (!categoryId) {
          console.log('No category found for ticket channel');
          await interaction.editReply({ content: 'チケットチャンネルのカテゴリが見つかりません。管理者にお問い合わせください。' });
          return;
        }
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0,
          parent: categoryId,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] },
          ],
        });
        const welcomeEmbed = new EmbedBuilder()
          .setTitle('チケット')
          .setDescription(`ようこそ、${interaction.user}！\nお問い合わせ内容を記載してください。`)
          .setColor('#00FF00')
          .setTimestamp();
        await ticketChannel.send({ embeds: [welcomeEmbed] });
        await interaction.editReply({
          content: `チケットを作成しました: ${ticketChannel}`,
        });
        console.log(`Ticket created in ${Date.now() - start}ms`);
      } catch (error) {
        console.error("Error in create ticket:", error);
        await interaction.editReply({
          content: "チケット作成中にエラーが発生しました。管理者にお問い合わせください。",
        });
      }
    }
    else if (interaction.customId.startsWith("verify_")) {
      await interaction.deferReply({ ephemeral: true });
      const start = Date.now();
      try {
        const roleId = interaction.customId.split("_")[2];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          console.log('Verify role not found:', roleId);
          await interaction.editReply({ content: '認証ロールが見つかりません。管理者にお問い合わせください。' });
          return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(roleId)) {
          await interaction.editReply({
            content: `あなたはすでに認証済みです！(認証ロール：<@&${roleId}>)`
          });
          return;
        }
        await member.roles.add(role);
        await interaction.editReply({
          content: `認証が完了しました！ロールを付与しました: ${role.name}`
        });
        console.log(`Verification completed in ${Date.now() - start}ms`);
      } catch (error) {
        console.error("Error in verify:", error);
        await interaction.editReply({
          content: "認証中にエラーが発生しました。管理者にお問い合わせください。"
        });
      }
    }
    else if (interaction.customId.startsWith("role_")) {
      await interaction.deferReply({ ephemeral: true });
      const start = Date.now();
      try {
        const roleId = interaction.customId.split("_")[2];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          console.log('Role not found:', roleId);
          await interaction.editReply({ content: 'ロールが見つかりません。管理者にお問い合わせください。' });
          return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role);
          await interaction.editReply({
            content: `<@&${roleId}> を解除しました！`
          });
          return;
        }
        await member.roles.add(role);
        await interaction.editReply({
          content: `${role.name} を付与しました！`
        });
        console.log(`Role assigned in ${Date.now() - start}ms`);
      } catch (error) {
        console.error("Error in role panel:", error);
        await interaction.editReply({
          content: "ロール付与中にエラーが発生しました。管理者にお問い合わせください。"
        });
      }
    }
    else {
      console.log("Unknown button:", interaction.customId);
      await interaction.reply({
        content: 'このボタンは無効です。\nミスだと思われる場合はこちらのサーバーで報告ください。\nhttps://discord.gg/gVSNDm2UPR',
        ephemeral: true
      });
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('admin_')) {
      await modalSubmit(interaction);
    }
  }
});

// CommandInteraction
client.on("interactionCreate", async (interaction) => {
  await handlers.get("interactionCreate").default(interaction);
});

// CacheClean
function startCacheCleanup() {
  setInterval(() => {
    client.channels.cache.forEach((channel) => {
      if (channel.isTextBased()) channel.messages.cache.clear();
    });
  }, 25 * 1000);
}
client.on("messageCreate", async (message) => {
  startCacheCleanup();
});

// BumpUpVoteNotify
const BUMP_SETTINGS_PATH = join(process.cwd(), 'new', 'bump.json');
const bumpNotifySettings = new Map();
const PATTERNS = {
  DISBOARD: {
    SUCCESS: /表示順をアップしたよ|Bump done|Bump effectué|Bump fatto|Podbito serwer|Успешно поднято|갱신했어|Patlatmap tamamlandı/,
    FAILURE: /上げられるようになるまで/,
    NOTIFY_AFTER: 2 * 60 * 60 * 1000,
  },
  DISSOKU: {
    SUCCESS: /ActiveLevel/,
    FAILURE: /間隔をあけてください/,
    NOTIFY_AFTER: 2 * 60 * 60 * 1000,
  },
  DCAFE: {
    SUCCESS: /サーバーの表示順位を上げました/,
    NOTIFY_AFTER: 1 * 60 * 60 * 1000,
  },
  DICOALL: {
    SUCCESS: /UPに成功しました|UP was successful\./,
    FAILURE: /分残りました|Minutes left\./,
    NOTIFY_AFTER: 1 * 60 * 60 * 1000,
  },
  TAKASUMIBOT: {
    SUCCESS: /表示順位が更新されました/,
    NOTIFY_AFTER: 1 * 60 * 60 * 1000,
  },
  DISCADIA: {
    SUCCESS: /has been successfully bumped\!/,
    FAILURE: /please try again/,
    NOTIFY_AFTER: 24 * 60 * 60 * 1000,
  },
  DISTOPIA: {
    SUCCESS: /表示順を上げました/,
    NOTIFY_AFTER: 2 * 60 * 60 * 1000,
  },
  SABACHANNEL: {
    SUCCESS: /このサーバーに1票を投じました|The display order of the server has been changed to a higher position\!/,
    NOTIFY_AFTER: 2 * 60 * 60 * 1000,
  },
  SHICHITORA: {
    SUCCESS: /サーバーを宣伝しました/,
    FAILURE: /クールダウン中です/,
    NOTIFY_AFTER: 2 * 60 * 60 * 1000,
  },
};
async function loadBumpSettings() {
  try {
    const data = await readFile(BUMP_SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(data);
    for (const [guildId, enabled] of Object.entries(settings)) {
      bumpNotifySettings.set(guildId, enabled);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Bump settings file not found, initializing empty.');
    } else {
      console.error('Error loading bump settings:', error);
    }
  }
}
client.once('ready', async () => {
  await loadBumpSettings();
});
client.on('messageCreate', async (message) => {
  if (!bumpNotifySettings.get(message.guildId)) return;
  if (message.author.id === '302050872383242240' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.DISBOARD.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DISBOARDのBUMPが実行されました！')
            .setDescription('2時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('DISBOARDのBUMP通知')
              .setDescription('</bump:947088344167366698> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DISBOARD.NOTIFY_AFTER);
    } else if (PATTERNS.DISBOARD.FAILURE.test(embed.description)) {
      const splcontent_a = embed.description.split('と');
      const splcontent_b = splcontent_a[1].split('分');
      const remaining_time = splcontent_b[0];
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DisBoardのBUMPに失敗しました...')
            .setDescription('後で再度お試しください。')
            .setColor('#ff0000'),
        ],
      });
    }
  }
  if (message.author.id === '850493201064132659' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.DCAFE.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DCafeのUPが実行されました！')
            .setDescription('1時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('DCafeのUP通知')
              .setDescription('</up:980136954169536525> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DCAFE.NOTIFY_AFTER);
    }
  }
  if (message.author.id === '903541413298450462' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.DICOALL.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DicoallのUPが実行されました！')
            .setDescription('1時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('DicoallのUP通知')
              .setDescription('</up:935190259111706754> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DICOALL.NOTIFY_AFTER);
    }
  }
  if (message.author.id === '903541413298450462') {
    if (PATTERNS.DICOALL.FAILURE.test(message.content)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DicoallのUPに失敗しました...')
            .setDescription('後で再度お試しください。')
            .setColor('#ff0000'),
        ]
      });
    }
  }
  if (message.author.id === '981314695543783484' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.TAKASUMIBOT.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('TakasumiBOTのUPが実行されました！')
            .setDescription('1時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('TakasumiBOTのUP通知')
              .setDescription('</up:1135405664852783157> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.TAKASUMIBOT.NOTIFY_AFTER);
    }
  }
  if (message.author.id === '1300797373374529557' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.DISTOPIA.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DistopiaのBUMPが実行されました！')
            .setDescription('2時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('DistopiaのBUMP通知')
              .setDescription('</bump:1309070135360749620> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DISTOPIA.NOTIFY_AFTER);
    }
  }
  if (message.author.id === '1233072112139501608' && message.embeds[0]) {
    const embed = message.embeds[0];
    if (PATTERNS.SABACHANNEL.SUCCESS.test(embed.description)) {
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('鯖ちゃんねるのVOTEが実行されました！')
            .setDescription('2時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(message.guildId)) return;
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('鯖ちゃんねるのVOTE通知')
              .setDescription('</vote:1233256792507682860> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.SABACHANNEL.NOTIFY_AFTER);
    }
  }
});
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!newMessage.guildId || !bumpNotifySettings.get(newMessage.guildId)) return;
  if (newMessage.author.id === '761562078095867916' && newMessage.embeds[0]) {
    const embed = newMessage.embeds[0];
    if (embed.fields?.some((field) => PATTERNS.DISSOKU.SUCCESS.test(field.value))) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('ディス速のUPが実行されました！')
            .setDescription('2時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(newMessage.guildId)) return;
        newMessage.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('ディス速のUP通知')
              .setDescription('</up:1363739182672904354> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DISSOKU.NOTIFY_AFTER);
    } else if (embed.fields?.some((field) => PATTERNS.DISSOKU.FAILURE.test(field.value))) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('ディス速のUPに失敗しました...')
            .setDescription('後で再度お試しください。')
            .setColor('#ff0000'),
        ],
      });
    }
  }
  if (newMessage.author.id === '1222548162741538938') {
    if (PATTERNS.DISCADIA.SUCCESS.test(newMessage.content)) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DiscadiaのBUMPが実行されました！')
            .setDescription('24時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(newMessage.guildId)) return;
        newMessage.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('DiscadiaのBUMP通知')
              .setDescription('</bump:1225075208394768496> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PATTERNS.DISCADIA.NOTIFY_AFTER);
    } else if (PATTERNS.DISCADIA.FAILURE.test(newMessage.content)) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('DiscadiaのUPに失敗しました...')
            .setDescription('後で再度お試しください。')
            .setColor('#ff0000'),
        ],
      });
    }
  }
  if (newMessage.author.id === '1350156436562514043') {
    if (PATTERNS.SHICHITORA.SUCCESS.test(newMessage.content)) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('七虎なるくんのADVERTISEが実行されました！')
            .setDescription('2時間後にお知らせします。')
            .setColor('#00ff00'),
        ],
      });
      setTimeout(() => {
        if (!bumpNotifySettings.get(newMessage.guildId)) return;
        newMessage.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('七虎なるくんのADVERTISE通知')
              .setDescription('</advertise:1399164634216530072> を実行できます')
              .setColor('#00ff00'),
          ],
        });
      }, PETTERNS.SHICHITORA.NOTIFY_AFTER);
    } else if (PATTERNS.SHICHITORA.FAILURE.test(newMessage.content)) {
      await newMessage.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('七虎なるくんのADVERTISEに失敗しました...')
            .setDescription(' Posteriori再度お試しください。')
            .setColor('#ff0000'),
        ],
      });
    }
  }
});
export { bumpNotifySettings, BUMP_SETTINGS_PATH };

// GlobalChat
const jsonPath = path.join(process.cwd(), 'new', 'globalchat.json');
const userEmojiMap = {
  '1140963618423312436': '🛠️',
  '689972790413361180': '🛠️',
  '1350149558583300157': '🛠️',
  '1092347482958213180': '🛡️',
};
async function initializeGlobalChatData() {
  try {
    await mkdir(path.dirname(jsonPath), { recursive: true });
    try {
      await readFile(jsonPath);
    } catch {
      await writeFile(jsonPath, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('JSONファイル初期化エラー:', error);
    throw error;
  }
}
async function readGlobalChatData() {
  try {
    await initializeGlobalChatData();
    const data = await readFile(jsonPath, 'utf8');
    const parsedData = JSON.parse(data);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('JSON読み込みエラー:', error);
    return [];
  }
}
client.on('messageCreate', async message => {
  if (message.author.bot || message.webhookId) return;
  const globalChatData = await readGlobalChatData();
  const guildData = globalChatData.find(data => data.guildId === message.guildId);
  if (!guildData) return;
  const channelData = guildData.channels.find(data => data.channelId === message.channel.id);
  if (!channelData) return;
  let replyContent = '';
  if (message.reference) {
    try {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.embeds.length > 0) {
        const embed = repliedMessage.embeds[0];
        replyContent = embed.description || '*埋め込みの内容なし*';
      } else {
        replyContent = repliedMessage.content || '*内容なし*';
      }
      replyContent = replyContent.replace(/\n/g, ' ').slice(0, 15);
      if (replyContent.length >= 15) replyContent += '...';
    } catch (error) {
      console.error('返信メッセージ取得エラー:', error);
      replyContent = '*返信メッセージの取得に失敗*';
    }
  }
  let description = message.content || '*メッセージ内容なし*';
  const snapshotContent = message.messageSnapshots?.first()?.content;
  if (snapshotContent) {
    description += `${snapshotContent}`;
  }
  const userEmoji = userEmojiMap[message.author.id] || '';
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${message.author.username} (ID: ${message.author.id})${userEmoji}`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTitle(replyContent || null)
    .setDescription(description)
    .setColor(0x00ff00)
    .setFooter({
      text: `${message.guild.name} (ID: ${message.guild.id}) | ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      iconURL: message.guild.iconURL() || undefined,
    })
    .setTimestamp();
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    if (attachment.contentType?.startsWith('image/')) {
      embed.setImage(attachment.url);
    } else {
      embed.addFields({ name: '添付ファイル', value: attachment.url });
    }
  }
  for (const data of globalChatData) {
    for (const channel of data.channels) {
      if (channel.channelId === message.channel.id) continue;
      try {
        const webhookClient = new WebhookClient({ url: channel.webhookUrl });
        await webhookClient.send({
          embeds: [embed]
        });
      } catch (error) {
        console.error(`Webhook送信エラー (チャンネル ${channel.channelId}):`, error);
      }
    }
  }
});

// ActivitySetting
client.on("ready", async () => {
  const activities = [
    { name: "/setup｜サーバーを荒らしから守る", type: ActivityType.Watching },
    { name: "/help｜ヘルプ", type: ActivityType.Listening },
    { name: "便利な管理コマンド", type: ActivityType.Playing },
    { name: "通貨機能＆ミニゲーム", type: ActivityType.Streaming },
    { name: "サポート｜.gg/KfEGntx2jA", type: ActivityType.Competing },
  ];
  let activityIndex = 0;
  await client.user.setActivity(activities[activityIndex]);
  console.log(`${client.user.tag} がログインしました！`);
  setInterval(() => {
    activityIndex = (activityIndex + 1) % activities.length;
    client.user.setActivity(activities[activityIndex]);
  }, 7500);
});
