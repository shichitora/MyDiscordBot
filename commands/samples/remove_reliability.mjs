import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/wdb.js';

export const data = new SlashCommandBuilder()
  .setName('remove_reliability')
  .setDescription('ユーザーの信頼度を減らします')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('対象ユーザー')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('減らす信頼度')
      .setRequired(true)
      .setMinValue(1))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const guildId = interaction.guild.id;
  const userData = getUserData(guildId, targetUser.id);
  if (userData.point < amount) {
    return interaction.editReply('エラー: 信頼度が不足しています。');
  }
  userData.point -= amount;
  updateUserData(guildId, targetUser.id, userData);
  await interaction.editReply(`${targetUser.tag} から ${amount} の信頼度を減らしました。現在の信頼度: ${userData.point}`);
}
