import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('remove_money')
  .setDescription('ユーザーの通貨を減らします')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('対象ユーザー')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('減らす通貨量')
      .setRequired(true)
      .setMinValue(1))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const guildId = interaction.guild.id;
  const userData = getUserData(guildId, targetUser.id);
  if (userData.balance < amount) {
    return interaction.editReply('エラー: 残高が不足しています。');
  }
  userData.balance -= amount;
  updateUserData(guildId, targetUser.id, userData);
  await interaction.editReply(`${targetUser.tag} から ${amount} コインを減らしました。現在の残高: ${userData.balance} コイン`);
}
