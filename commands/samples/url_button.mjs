import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('url_button')
  .setDescription('URL付きボタンとカスタムメッセージを作成します')
  .addStringOption(option =>
    option
      .setName('label')
      .setDescription('ボタンのラベル')
      .setRequired(true)
      .setMaxLength(80)
  )
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('リンク先URL')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('ボタンと一緒に送信するメッセージ')
      .setRequired(false)
      .setMaxLength(2000)
  )
  .addStringOption(option =>
    option
      .setName('embed')
      .setDescription('メッセージを埋め込み形式にする？')
      .setRequired(false)
      .addChoices(
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' }
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply();
  const label = interaction.options.getString('label');
  const url = interaction.options.getString('url');
  const message = interaction.options.getString('message');
  const embedOption = interaction.options.getString('embed') || 'no';
  try {
    if (!url.match(/^https?:\/\//)) {
      return interaction.editReply({
        content: '有効なURL（http:// または https:// で始まる）を指定してください。',
        Ephemeral:true,
      });
    }
    const button = new ButtonBuilder()
      .setLabel(label)
      .setURL(url)
      .setStyle(ButtonStyle.Link);
    const row = new ActionRowBuilder().addComponents(button);
    let replyOptions = { components: [row] };
    if (embedOption === 'yes') {
      const embed = new EmbedBuilder()
        .setTitle(message || '以下のボタンをクリック！')
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: `作成者: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
      replyOptions.embeds = [embed];
    } else {
      replyOptions.content = message || '以下のボタンをクリック！';
    }
    await interaction.editReply(replyOptions);
  } catch (error) {
    console.error('Error in url_button:', error);
    await interaction.editReply({
      content: 'ボタンの作成中にエラーが発生しました。URLまたはメッセージを確認してください。',
      Ephemeral:true,
    });
  }
}
