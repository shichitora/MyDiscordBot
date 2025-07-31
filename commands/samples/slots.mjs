import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('スロットをプレイします！')
  .addIntegerOption(option =>
    option
      .setName('bet')
      .setDescription('賭けるコイン数')
      .setRequired(true)
      .setMinValue(5)
      .setMaxValue(10000)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const bet = interaction.options.getInteger('bet');
  try {
    const userData = getUserData(guildId, userId);
    if (userData.balance < bet) {
      return interaction.editReply({
        content: `残高不足！必要: ${bet} コイン, 現在の残高: ${userData.balance} コイン`,
        Ephemeral:true,
      });
    }
    const symbols = ['🍒', '7️⃣', '🔔', '🪙', '⭐', '💎'];
    const reel = Array(3)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    let multiplier = 0;
    let resultMessage = '';
    if (reel[0] === reel[1] && reel[1] === reel[2]) {
      switch (reel[0]) {
        case '7️⃣':
          multiplier = 50;
          resultMessage = '🔥 大当たり！セブン揃い！';
          break;
        case '🪙':
          multiplier = 30;
          resultMessage = '🪙 当たり！コイン揃い！';
          break;
        case '💎':
          multiplier = 20;
          resultMessage = '💎 ダイヤ揃い！';
          break;
        case '🔔':
          multiplier = 10;
          resultMessage = '🔔 ベル揃い！';
          break;
        case '🍒':
          multiplier = 5;
          resultMessage = '🍒 チェリー揃い！';
          break;
        case '⭐':
          multiplier = 3;
          resultMessage = '⭐ スター揃い！';
          break;
      }
    } else if (reel[0] === '🍒' && reel[1] === '🍒') {
      multiplier = 2;
      resultMessage = '🍒 チェリー2つで小当たり！';
    } else {
      resultMessage = '😔 ハズレ…次に期待！';
    }
    const payout = bet * multiplier;
    userData.balance = userData.balance - bet + payout;
    updateUserData(guildId, userId, userData);
    const embed = new EmbedBuilder()
      .setTitle('🎰 スロットをプレイ')
      .setColor(0xffd700)
      .setDescription('リールが回転中...');
    const message = await interaction.editReply({ embeds: [embed] });
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      embed.setDescription(`[ ${reel.slice(0, i + 1).join(' | ')}${' | ⬛'.repeat(2 - i)} ]`);
      await message.edit({ embeds: [embed] });
    }
    embed
      .setDescription(`[ ${reel.join(' | ')} ]\n${resultMessage}`)
      .addFields(
        { name: '賭け金', value: `${bet} コイン`, inline: true },
        { name: '配当', value: `${payout} コイン`, inline: true },
        { name: '残高', value: `${userData.balance} コイン`, inline: true }
      );
    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error in slots:', error);
    await interaction.editReply({
      content: 'スロットの実行中にエラーが発生しました。管理者にお問い合わせください。',
      Ephemeral:true,
    });
  }
}
