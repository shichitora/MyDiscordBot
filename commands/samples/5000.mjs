import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('5000兆円')
  .setDescription('5000兆円ジェネレーター')
  .addStringOption(option =>
    option
      .setName('top')
      .setDescription('上部に表示する文字')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('bottom')
      .setDescription('下部に表示する文字')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const topmoji = interaction.options.getString('top');
  const bottommoji = interaction.options.getString('bottom');
  if (!topmoji || !bottommoji) {
    return interaction.editReply({
      content: '文字を正しく指定してください。',
    });
  }
  const forbiddenPattern = /((discord)|(https?:\/\/)|(\/)|(\.)|(\\)|(．))/i;
  if (forbiddenPattern.test(topmoji) || forbiddenPattern.test(bottommoji)) {
    return interaction.editReply({
      content: '入力に禁止された内容が含まれています。別の文字を指定してください。',
    });
  }
  try {
    const apiUrl = `https://gsapi.cbrx.io/image?top=${encodeURIComponent(topmoji)}&bottom=${encodeURIComponent(bottommoji)}&q=100&type=png&rainbow=false&noalpha=false`;
    const embed = new EmbedBuilder()
      .setTitle('結果：')
      .setImage(apiUrl)
      .setColor('#0099ff');
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: '画像の生成中にエラーが発生しました。文字が正しいか確認してください。',
    });
  }
}
