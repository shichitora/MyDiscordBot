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

// Client
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildWebhooks ],
  partials: [ Partials.Message, Partials.Channel, Partials.Reaction ],
  messageCacheLifetime: 25,
  messageSweepInterval: 25,
});
client.login('YOUR_BOT_TOKEN');

// AntiReactionSpam
handleReactionSpam(client);

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
// 非公開

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
// 非公開

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
// これは非公開です

// GlobalChat
// これは非公開です

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
