import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('dice')
  .setDescription('ダイスゲームで運試し！')
  .setDMPermission(true)
  .addIntegerOption(option =>
    option
      .setName('bet')
      .setDescription('賭けるコイン数')
      .setRequired(true)
      .setMinValue(1)
  )
  .addIntegerOption(option =>
    option
      .setName('roll_over')
      .setDescription('ロールオーバーの基準値（1～99）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(99)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const bet = interaction.options.getInteger('bet');
  const rollOver = interaction.options.getInteger('roll_over');
  try {
    const userData = getUserData(guildId, userId);
    if (userData.balance < bet) {
      return interaction.editReply({
        content: `残高不足！必要: ${bet} コイン, 現在の残高: ${userData.balance} コイン`,
        Ephemeral:true,
      });
    }
    const roll = Math.floor(Math.random() * 100) + 1;
    const win = roll > rollOver;
    const multiplier = 100 / (100 - rollOver);
    const payout = win ? Math.floor(bet * multiplier) : 0;
    userData.balance = userData.balance - bet + payout;
    updateUserData(guildId, userId, userData);
    const embed = new EmbedBuilder()
      .setTitle('🎲 ダイスゲーム')
      .setDescription('ダイスを振っています…')
      .setColor(0xFFD700);
    const message = await interaction.editReply({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    embed
      .setDescription(`🎲 結果: **${roll}** (${win ? '勝利！' : '敗北…'})`)
      .addFields(
        { name: '賭け金', value: `${bet} コイン`, inline: true },
        { name: 'ロールオーバー', value: `${rollOver}`, inline: true },
        { name: '配当', value: `${payout} コイン`, inline: true },
        { name: '残高', value: `${userData.balance} コイン`, inline: true }
      )
      .setColor(win ? 0x00FF00 : 0xFF0000);
    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error in dice:', error);
    await interaction.editReply({
      content: 'ダイスゲームの実行中にエラーが発生しました。管理者にお問い合わせください。',
      Ephemeral:true,
    });
  }
}
