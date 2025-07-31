import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('tempchannel')
  .setDescription('期限付きの臨時チャンネルを作成します')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('チャンネルの名前')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('days')
      .setDescription('チャンネルの有効期限（1～7日）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(7)
  )
  .addStringOption((option) =>
    option
      .setName('type')
      .setDescription('チャンネルの種類')
      .setRequired(true)
      .addChoices(
        { name: 'テキスト', value: 'text' },
        { name: 'ボイス', value: 'voice' }
      )
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const channelName = interaction.options.getString('name');
  const days = interaction.options.getInteger('days');
  const channelType = interaction.options.getString('type');
  const type = channelType === 'text' ? 'TEXT' : 'VOICE';
  try {
    const tempChannel = await interaction.guild.channels.create({
      name: channelName,
      type: type,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ManageChannels],
        },
      ],
    });
    const duration = days * 86400000;
    setTimeout(async () => {
      try {
        await tempChannel.delete('臨時チャンネルの有効期限が終了しました');
      } catch (error) {
        console.error('チャンネル削除エラー:', error);
      }
    }, duration);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('臨時チャンネル作成')
          .setDescription(
            `チャンネル **${channelName}** を作成しました！\n` +
            `種類: ${channelType === 'text' ? 'テキスト' : 'ボイス'}\n` +
            `有効期限: ${days}日後\n` +
            `チャンネルは自動的に削除されます。`
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  } catch (error) {
    console.error('チャンネル作成エラー:', error);
    await interaction.editReply({
      content: 'エラー: チャンネルの作成に失敗しました。ボットの権限を確認してください。',
      ephemeral: true,
    });
  }
}
