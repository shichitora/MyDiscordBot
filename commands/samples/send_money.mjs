import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('send_money')
  .setDescription('他のユーザーにコインを譲渡します')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('譲渡するユーザー')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('amount')
      .setDescription('譲渡するコイン数')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const now = Date.now();
  const oneMinuteMs = 60 * 1000;
  try {
    if (targetUser.id === userId) {
      return interaction.editReply({ content: '自分自身にコインを譲渡できません！' });
    }
    if (targetUser.bot) {
      return interaction.editReply({ content: 'ボットにコインを譲渡できません！' });
    }
    const userData = getUserData(guildId, userId);
    if (userData.lastGive && now - userData.lastGive < oneMinuteMs) {
      const resetTime = new Date(userData.lastGive + oneMinuteMs).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      return interaction.editReply({ content: `次の譲渡は ${resetTime} に可能です！` });
    }
    if (userData.balance < amount) {
      return interaction.editReply({
        content: `残高不足！必要: ${amount} コイン, 現在の残高: ${userData.balance} コイン`,
      });
    }
    const targetData = getUserData(guildId, targetUser.id);
    userData.balance -= amount;
    userData.lastGive = now;
    targetData.balance = (targetData.balance || 0) + amount;
    updateUserData(guildId, userId, userData);
    updateUserData(guildId, targetUser.id, targetData);
    const embed = new EmbedBuilder()
      .setTitle('💸 コイン譲渡')
      .setDescription(`<@${userId}> が <@${targetUser.id}> に ${amount} コインを譲渡しました！`)
      .addFields(
        { name: '譲渡者の残高', value: `${userData.balance} コイン`, inline: true },
        { name: '受取人の残高', value: `${targetData.balance} コイン`, inline: true }
      )
      .setColor(0x00FF00)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in give:', error);
    await interaction.editReply({
      content: 'コイン譲渡中にエラーが発生しました。管理者にお問い合わせください。',
    });
  }
}
