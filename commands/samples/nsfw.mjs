import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('channel_nsfw')
  .setDescription('チャンネルの年齢制限を設定/解除します')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('年齢制限を設定するチャンネル')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('enable')
      .setDescription('年齢制限を有効にするか（trueで有効、falseで解除）')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const channel = interaction.options.getChannel('channel');
  const enable = interaction.options.getBoolean('enable');
  try {
    await channel.setNSFW(enable);
    await interaction.editReply(
      `チャンネル ${channel.name} の年齢制限を${enable ? '有効' : '解除'}しました。`
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: '年齢制限の設定に失敗しました。権限を確認してください。',
      ephemeral: true,
    });
  }
}
