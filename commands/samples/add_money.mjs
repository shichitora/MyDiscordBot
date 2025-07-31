import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('add_money')
  .setDescription('ユーザーまたはロールに通貨を付与します')
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('付与する通貨量')
      .setRequired(true)
      .setMinValue(1))
  .addUserOption(option =>
    option.setName('user')
      .setDescription('対象ユーザー')
      .setRequired(false))
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('対象ロール')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const targetUser = interaction.options.getUser('user');
  const targetRole = interaction.options.getRole('role');
  const amount = interaction.options.getInteger('amount');
  const guildId = interaction.guild.id;
  if (targetUser && targetRole) {
    return interaction.editReply({
      content: 'ユーザーとロールの両方を指定することはできません！どちらか一方を選んでください。',
      ephemeral: true,
    });
  }
  if (!targetUser && !targetRole) {
    return interaction.editReply({
      content: 'ユーザーまたはロールのどちらかを指定してください！',
      ephemeral: true,
    });
  }
  try {
    const guild = interaction.guild;
    await guild.members.fetch()
    if (targetUser) {
      const userData = getUserData(guildId, targetUser.id);
      userData.balance = (userData.balance || 0) + amount;
      updateUserData(guildId, targetUser.id, userData);
      await interaction.editReply(
        `${targetUser.tag} に ${amount} コインを付与しました。現在の残高: ${userData.balance} コイン`
      );
    } else {
      const roleMembers = interaction.guild.members.cache.filter(member =>
        member.roles.cache.has(targetRole.id)
      );
      if (roleMembers.size === 0) {
        return interaction.editReply({
          content: `ロール ${targetRole.name} を持つメンバーがいません！`,
          ephemeral: true,
        });
      }
      let updatedCount = 0;
      roleMembers.forEach(member => {
        const userData = getUserData(guildId, member.id);
        userData.balance = (userData.balance || 0) + amount;
        updateUserData(guildId, member.id, userData);
        updatedCount++;
      });
      await interaction.editReply(
        `ロール ${targetRole.name} の ${updatedCount} 人に ${amount} コインを付与しました。`
      );
    }
  } catch (error) {
    console.error('Error in add_money:', error);
    await interaction.editReply({
      content: '通貨の付与中にエラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    });
  }
}
