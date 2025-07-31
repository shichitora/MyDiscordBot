import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('race')
  .setDescription('競馬レースにベット！')
  .addIntegerOption(option =>
    option
      .setName('horse')
      .setDescription('ベットする馬（1～4）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(4)
  )
  .addIntegerOption(option =>
    option
      .setName('bet')
      .setDescription('賭けるコイン数')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const horse = interaction.options.getInteger('horse');
  const bet = interaction.options.getInteger('bet');
  try {
    const userData = getUserData(guildId, userId);
    if (userData.balance < bet) {
      return interaction.editReply({
        content: `残高不足！必要: ${bet} コイン, 現在の残高: ${userData.balance} コイン`
      });
    }
    const horses = [
      { id: 1, name: '🐎 馬1', chance: 0.4, multiplier: 1.5 },
      { id: 2, name: '🐎 馬2', chance: 0.3, multiplier: 2.0 },
      { id: 3, name: '🐎 馬3', chance: 0.2, multiplier: 3.0 },
      { id: 4, name: '🐎 馬4', chance: 0.1, multiplier: 5.0 },
    ];
    const rand = Math.random();
    let cumulativeChance = 0;
    let winner = horses[0];
    for (const h of horses) {
      cumulativeChance += h.chance;
      if (rand <= cumulativeChance) {
        winner = h;
        break;
      }
    }
    const payout = horse === winner.id ? Math.floor(bet * winner.multiplier) : 0;
    userData.balance = userData.balance - bet + payout;
    updateUserData(guildId, userId, userData);
    const embed = new EmbedBuilder()
      .setTitle('🏇 競馬レース')
      .setDescription('レース開始！🏁')
      .setColor(0xFFD700);
    const message = await interaction.editReply({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 2000));
    embed
      .setDescription(`🏁 ${winner.name} が勝利！\nあなたのベット: ${horses[horse - 1].name}`)
      .addFields(
        { name: '賭け金', value: `${bet} コイン`, inline: true },
        { name: '配当', value: `${payout} コイン`, inline: true },
        { name: '残高', value: `${userData.balance} コイン`, inline: true }
      )
      .setColor(payout > 0 ? 0x00FF00 : 0xFF0000);
    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error in race:', error);
    await interaction.editReply({
      content: 'レースの実行中にエラーが発生しました。管理者にお問い合わせください。',
      ephemeral:true,
    });
  }
}
