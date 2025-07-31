import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo-fortify')
  .setDescription('fortifyAPIを使用したuser検索')
  .addStringOption(option =>
    option
      .setName('id')
      .setDescription('ユーザーID')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const id = interaction.options.getString('id');
  if (!id) {
    return interaction.editReply({
      content: '文字を正しく指定してください。',
    });
  }
  try {
    const apiUrl = `https://api.fortifybot.com/v1/?user_id=${encodeURIComponent(id)}`;
    const embed = new EmbedBuilder()
      .setTitle('検索結果：')
      .setImage(apiUrl)
      .setColor('#0099ff');
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: 'エラーが発生しました。userIDが正しいか確認してください。',
    });
  }
}
