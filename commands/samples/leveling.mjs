import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('leveling')
  .setDescription('レベルシステム')
  .addSubcommand(subcommand =>
    subcommand.setName('setup')
      .setDescription('レベルシステムの設定')
      .addBooleanOption(option =>
        option.setName('enabled')
          .setDescription('有効/無効')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand.setName('ranking')
      .setDescription('レベルランキングを表示'))
  .addSubcommand(subcommand =>
    subcommand.setName('role')
      .setDescription('レベルに応じたロールを設定')
      .addIntegerOption(option =>
        option.setName('level')
          .setDescription('レベル')
          .setRequired(true))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('付与するロール')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand.setName('check')
      .setDescription('ユーザーのレベルを確認')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('確認するユーザー')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand.setName('edit')
      .setDescription('ユーザーのレベルを編集')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('編集するユーザー')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('level')
          .setDescription('新しいレベル')
          .setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  const levels = JSON.parse(fs.readFileSync('./new/levels.json', 'utf8'));
  if (!levels[guildId]) levels[guildId] = { users: {}, roles: {}, enabled: false };
  if (subcommand === 'setup') {
    const enabled = interaction.options.getBoolean('enabled');
    levels[guildId].enabled = enabled;
    fs.writeFileSync('./new/levels.json', JSON.stringify(levels, null, 2));
    await interaction.reply(`レベルシステムを${enabled ? '有効' : '無効'}にしました。`);
  } else if (subcommand === 'ranking') {
    await interaction.deferReply();
    const users = Object.entries(levels[guildId].users)
      .sort((a, b) => b[1].level - a[1].level)
      .slice(0, 10);
    const embed = new EmbedBuilder()
      .setTitle('レベルランキング')
      .setDescription(users.map(([userId, data], i) => `${i + 1}. <@${userId}> - レベル ${data.level}`).join('\n'));
    await interaction.editReply({ embeds: [embed] });
  } else if (subcommand === 'role') {
    const level = interaction.options.getInteger('level');
    const role = interaction.options.getRole('role');
    levels[guildId].roles[level] = role.id;
    fs.writeFileSync('./new/levels.json', JSON.stringify(levels, null, 2));
    await interaction.reply(`レベル${level}で${role.name}を付与するように設定しました。`);
  } else if (subcommand === 'check') {
    const user = interaction.options.getUser('user');
    const data = levels[guildId].users[user.id] || { level: 0, xp: 0 };
    await interaction.reply(`${user.tag}のレベル: ${data.level} (XP: ${data.xp})`);
  } else if (subcommand === 'edit') {
    const user = interaction.options.getUser('user');
    const level = interaction.options.getInteger('level');
    if (!levels[guildId].users[user.id]) levels[guildId].users[user.id] = { level: 0, xp: 0 };
    levels[guildId].users[user.id].level = level;
    levels[guildId].users[user.id].xp = level * 100;
    fs.writeFileSync('./new/levels.json', JSON.stringify(levels, null, 2));
    await interaction.reply(`${user.tag}のレベルを${level}に設定しました。`);
  }
}
