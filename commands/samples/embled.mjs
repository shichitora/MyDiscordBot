import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('カスタム埋め込みメッセージを作成します')
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('埋め込みのタイトル')
      .setRequired(true)
      .setMaxLength(256)
  )
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('埋め込みの説明')
      .setRequired(true)
      .setMaxLength(4096)
  )
  .addStringOption(option =>
    option
      .setName('color')
      .setDescription('カラーコード（例: #FF0000）')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply();
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  let color = interaction.options.getString('color') || '#00FF00';
  try {
    if (color.startsWith('#')) color = color.slice(1);
    const colorInt = parseInt(color, 16);
    if (isNaN(colorInt) || color.length !== 6) {
      colorInt = 0x00FF00;
    }
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(colorInt)
      .setTimestamp()
      .setFooter({ text: `作成者: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in embed:', error);
    await interaction.editReply({
      content: '埋め込みの作成中にエラーが発生しました。カラーコードを確認してください。',
      ephemeral:true,
    });
  }
}
