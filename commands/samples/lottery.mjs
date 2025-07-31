import { SlashCommandBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('lottery')
  .setDescription('1日1回の宝くじを引きます！');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  try {
    const userData = getUserData(guildId, userId);
    if (userData.lastLottery && now - userData.lastLottery < oneDayMs) {
      const resetTime = new Date(userData.lastLottery + oneDayMs).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      return interaction.editReply({
        content: `今日の宝くじはすでに引きました！次は ${resetTime} に挑戦できます。`,
      });
    }
    const rewards = [
      { amount: 0, chance: 0.3 },
      { amount: 50, chance: 0.4 },
      { amount: 200, chance: 0.2 },
      { amount: 500, chance: 0.09 },
      { amount: 1000, chance: 0.01 },
    ];
    const rand = Math.random();
    let cumulativeChance = 0;
    let reward = 0;
    for (const r of rewards) {
      cumulativeChance += r.chance;
      if (rand <= cumulativeChance) {
        reward = r.amount;
        break;
      }
    }
    userData.balance = (userData.balance || 0) + reward;
    userData.lastLottery = now;
    updateUserData(guildId, userId, userData);
    const message = reward > 0
      ? `🎉 おめでとう！${reward} コインを獲得しました！現在の残高: ${userData.balance} コイン`
      : `😔 ハズレ…また明日挑戦してね！現在の残高: ${userData.balance} コイン`;
    await interaction.editReply({ content: message });
  } catch (error) {
    console.error('Error in lottery:', error);
    await interaction.editReply({
      content: '宝くじの実行中にエラーが発生しました。管理者にお問い合わせください。',
    });
  }
}
