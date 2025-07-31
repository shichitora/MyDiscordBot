import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/wdb.js';

export const data = new SlashCommandBuilder()
  .setName('add_reliability')
  .setDescription('ユーザーまたはロールに信頼度を付与します')
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('付与する信頼度')
      .setRequired(true)
      .setMinValue(1))
  .addUserOption(option =>
    option.setName('user')
      .setDescription('対象ユーザー')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const guildId = interaction.guild.id;
  await interaction.deferReply({ ephemeral: true });
  if (!targetUser) {
    return interaction.editReply({
      content: 'ユーザーを指定してください！',
      ephemeral: true,
    });
  }
  try {
    const guild = interaction.guild;
    await guild.members.fetch()
    if (targetUser) {
      const userData = getUserData(guildId, targetUser.id);
      userData.point = (userData.point || 0) + amount;
      updateUserData(guildId, targetUser.id, userData);
      await interaction.editReply(
        `${targetUser.tag} に ${amount} の信頼度を付与しました。現在の信頼度: ${userData.point}`
      );
    }
  } catch (error) {
    console.error('Error in add_money:', error);
    await interaction.editReply({
      content: '信頼度の付与中にエラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    });
  }
}
