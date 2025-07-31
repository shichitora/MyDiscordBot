import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('points')
  .setDescription('ユーザーの違反ポイントを編集します')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('ユーザーの違反ポイントを指定値に設定')
      .addUserOption(option =>
        option.setName('user').setDescription('対象ユーザー').setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('points')
          .setDescription('設定する違反ポイント数')
          .setRequired(true)
          .setMinValue(0)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('ユーザーの違反ポイントを追加')
      .addUserOption(option =>
        option.setName('user').setDescription('対象ユーザー').setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('points')
          .setDescription('追加する違反ポイント数')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('ユーザーの違反ポイントを減らす')
      .addUserOption(option =>
        option.setName('user').setDescription('対象ユーザー').setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('points')
          .setDescription('減らす違反ポイント数')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset')
      .setDescription('ユーザーの違反ポイントをリセット')
      .addUserOption(option =>
        option.setName('user').setDescription('対象ユーザー').setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('ユーザーの現在の違反ポイントを確認')
      .addUserOption(option =>
        option.setName('user').setDescription('対象ユーザー').setRequired(true)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    await interaction.editReply({
      content: 'このコマンドを使用するにはサーバー管理権限が必要です！',
      ephemeral: true,
    });
    return;
  }
  const guildId = interaction.guildId;
  const user = interaction.options.getUser('user');
  const subcommand = interaction.options.getSubcommand();
  const pointsPath = path.join(process.cwd(), 'points.json');
  const settingsPath = path.join(process.cwd(), 'settings.json');
  let pointsData;
  try {
    const data = await readFile(pointsPath, 'utf8');
    pointsData = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      pointsData = {};
      await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
    } else {
      console.error('Error reading points.json:', err);
      await interaction.editReply({
        content: 'ポイントデータの読み込みに失敗しました。',
        ephemeral: true,
      });
      return;
    }
  }
  if (!pointsData[guildId]) pointsData[guildId] = {};
  if (!pointsData[guildId][user.id]) pointsData[guildId][user.id] = { points: 0, lastViolation: null };
  let settings;
  try {
    const data = await readFile(settingsPath, 'utf8');
    settings = JSON.parse(data);
  } catch (err) {
    console.error('Error reading settings.json:', err);
    settings = { guilds: {} };
  }
  const guildSettings = settings.guilds[guildId] || {};
  let response;
  let newPoints = pointsData[guildId][user.id].points;
  if (subcommand === 'set') {
    const points = interaction.options.getInteger('points');
    newPoints = points;
    pointsData[guildId][user.id].points = newPoints;
    response = `${user.tag} のポイントを ${newPoints} に設定しました。`;
  } else if (subcommand === 'add') {
    const points = interaction.options.getInteger('points');
    newPoints += points;
    pointsData[guildId][user.id].points = newPoints;
    response = `${user.tag} のポイントを ${points} 追加し、${newPoints} になりました。`;
  } else if (subcommand === 'remove') {
    const points = interaction.options.getInteger('points');
    newPoints = Math.max(0, newPoints - points);
    pointsData[guildId][user.id].points = newPoints;
    response = `${user.tag} のポイントを ${points} 減らし、${newPoints} になりました。`;
  } else if (subcommand === 'reset') {
    newPoints = 0;
    pointsData[guildId][user.id].points = newPoints;
    pointsData[guildId][user.id].lastViolation = null;
    response = `${user.tag} のポイントをリセットしました（0）。`;
  } else if (subcommand === 'view') {
    response = `${user.tag} の現在のポイントは ${newPoints} です。`;
  }
  if (subcommand !== 'view') {
    try {
      await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
    } catch (err) {
      console.error('Error writing points.json:', err);
      await interaction.editReply({
        content: 'ポイントデータの保存に失敗しました。',
        ephemeral: true,
      });
      return;
    }
  }
  if (guildSettings.logChannel && subcommand !== 'view') {
    const logChannel = interaction.guild.channels.cache.get(guildSettings.logChannel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('ポイント編集')
        .setDescription(`**ユーザー**: ${user.tag}\n**操作**: ${subcommand}\n**新しいポイント**: ${newPoints}\n**操作者**: ${interaction.user.tag}`)
        .setColor('#ffaa00')
        .setTimestamp();
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error('Error sending log:', err);
      }
    }
  }
  if (['set', 'add', 'remove'].includes(subcommand) && guildSettings.points?.thresholds) {
    const thresholds = guildSettings.points.thresholds;
    let punishment = null;
    for (const [point, action] of Object.entries(thresholds)) {
      if (newPoints >= parseInt(point)) punishment = action;
    }
    if (punishment && guildSettings.block?.enabled) {
      try {
        const member = await interaction.guild.members.fetch(user.id);
        if (punishment === 'timeout') {
          await member.timeout(guildSettings.block.timeout || 600000, `ポイント閾値到達: ${newPoints}`);
          response += `\n${user.tag} をタイムアウトしました（${guildSettings.block.timeout / 1000}秒）。`;
        } else if (punishment === 'kick') {
          await member.kick(`ポイント閾値到達: ${newPoints}`);
          response += `\n${user.tag} をキックしました。`;
        } else if (punishment === 'ban') {
          await interaction.guild.members.ban(user.id, { reason: `ポイント閾値到達: ${newPoints}` });
          response += `\n${user.tag} をBANしました。`;
        }
        if (guildSettings.logChannel) {
          const logChannel = interaction.guild.channels.cache.get(guildSettings.logChannel);
          if (logChannel) {
            const punishmentEmbed = new EmbedBuilder()
              .setTitle('ポイント閾値処罰')
              .setDescription(`**ユーザー**: ${user.tag}\n**ポイント**: ${newPoints}\n**処罰**: ${punishment}\n**操作者**: ${interaction.user.tag}`)
              .setColor('#ff0000')
              .setTimestamp();
            await logChannel.send({ embeds: [punishmentEmbed] });
          }
        }
      } catch (err) {
        console.error(`Error applying punishment (${punishment}):`, err);
        response += `\n処罰の適用に失敗しました（${punishment}）。`;
      }
    }
  }

  await interaction.editReply({ content: response, ephemeral: true });
}
