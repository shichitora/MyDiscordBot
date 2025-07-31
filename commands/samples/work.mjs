import { SlashCommandBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('work')
  .setDescription('労働して通貨を獲得します（1時間に1回）');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const now = Date.now();
  const COOLDOWN = 60 * 60 * 1000; 
  const MIN_REWARD = 50; 
  const MAX_REWARD = 100; 
  const userData = getUserData(guildId, userId);
  const lastWork = userData.lastWork || 0;
  if (now - lastWork < COOLDOWN) {
    const timeLeft = Math.ceil((COOLDOWN - (now - lastWork)) / 1000 / 60);
    return interaction.reply({
      content: `まだ労働できません！${timeLeft}分後に再試行してください。`,
      ephemeral: true,
    });
  }
  const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
  userData.balance = (userData.balance || 0) + reward;
  userData.lastWork = now;
  updateUserData(guildId, userId, userData);
  await interaction.editReply(`お疲れ様！${reward} コインを獲得しました！現在の残高: ${userData.balance} コイン`);
}
