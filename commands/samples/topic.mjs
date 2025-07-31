import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('edit_topic')
  .setDescription('チャンネルのトピックを編集します')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('トピックを編集するチャンネル')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('topic')
      .setDescription('新しいトピック')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const channel = interaction.options.getChannel('channel');
  const topic = interaction.options.getString('topic');
  try {
    await channel.setTopic(topic);
    await interaction.editReply(`チャンネル ${channel.name} のトピックを "${topic}" に変更しました。`);
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: 'トピックの編集に失敗しました。権限を確認してください。',
      ephemeral: true,
    });
  }
}
