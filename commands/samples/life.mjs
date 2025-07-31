import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('life')
  .setDescription('2時間に1回の人生ゲーム！運試しをしよう！');

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  try {
    const userData = getUserData(guildId, userId);
    if (userData.lastLife && now - userData.lastLife < twoHoursMs) {
      const resetTime = new Date(userData.lastLife + twoHoursMs).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      return interaction.editReply({
        content: `次の人生ゲームは ${resetTime} にプレイできます！`,
        ephemeral:true,
      });
    }
    const events = [
      { type: 'good', chance: 0.15, message: '💼 就職成功！', amount: 100 },
      { type: 'good', chance: 0.05, message: '🎉 宝くじ当選！', amount: 500 },
      { type: 'good', chance: 0.10, message: '💒 結婚祝い！', amount: 200 },
      { type: 'good', chance: 0.10, message: '👶 子供ができた！', amount: 300 },
      { type: 'good', chance: 0.10, message: '🍀 四つ葉のクローバーを見つけた！', amount: 750 },
      { type: 'good', chance: 0.10, message: '♥️ 彼女/彼氏ができた！', amount: 400 },
      { type: 'bad', chance: 0.10, message: '💸 借金返済…', amount: -350 },
      { type: 'bad', chance: 0.05, message: '🏥 病気で入院…', amount: -100 },
      { type: 'bad', chance: 0.05, message: '🚓 罰金支払い…', amount: -400 },
      { type: 'bad', chance: 0.05, message: '🖥️ 機材の故障…', amount: -200 },
      { type: 'neutral', chance: 0.25, message: '🌳 何も起こらず', amount: 0 },
      { type: 'neutral', chance: 0.25, message: '✈️ 旅行したが楽しかっただけ', amount: 0 },
      { type: 'neutral', chance: 0.25, message: '👣 散歩をしてもなにもなかった', amount: 0 },
    ];
    const rand = Math.random();
    let cumulativeChance = 0;
    let selectedEvent = events[events.length - 1];
    for (const event of events) {
      cumulativeChance += event.chance;
      if (rand <= cumulativeChance) {
        selectedEvent = event;
        break;
      }
    }
    let amount = selectedEvent.amount;
    if (amount < 0 && userData.balance < Math.abs(amount)) {
      amount = -userData.balance;
    }
    userData.balance = (userData.balance || 0) + amount;
    userData.lastLife = now;
    updateUserData(guildId, userId, userData);
    const embed = new EmbedBuilder()
      .setTitle('🎲 人生ゲーム')
      .setDescription(`${selectedEvent.message}`)
      .addFields(
        { name: '結果', value: `${amount >= 0 ? '+' : ''}${amount} コイン`, inline: true },
        { name: '現在の残高', value: `${userData.balance} コイン`, inline: true }
      )
      .setColor(amount > 0 ? 0x00FF00 : amount < 0 ? 0xFF0000 : 0x808080)
      .setFooter({ text: '2時間後にまた挑戦！' })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in life:', error);
    await interaction.editReply({
      content: '人生ゲームの実行中にエラーが発生しました。管理者にお問い合わせください。',
      Ephemeral:true,
    });
  }
}
