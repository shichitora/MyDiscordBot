import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('delete_all_threads')
  .setDescription('選択されたチャンネル内のすべてのスレッドを削除します')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('スレッドを削除するチャンネル')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.editReply({ content: 'このコマンドを実行するには管理者権限が必要です！', ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    if (!channel.isTextBased()) {
      return await interaction.editReply({ content: '指定されたチャンネルは有効なテキストチャンネルではありません！', ephemeral: true });
    }
    const activeThreads = channel.threads.cache.filter(thread => thread.archived === false);
    const archivedThreads = await channel.threads.fetchArchived({ cache: true });
    let deletedCount = 0;
    await Promise.all(activeThreads.map(async (thread) => {
      await thread.delete();
      deletedCount++;
    }));
    await Promise.all(archivedThreads.threads.map(async (thread) => {
      await thread.delete();
      deletedCount++;
    }));
    await interaction.editReply({
      content: `${deletedCount} 個のスレッドが ${channel.name} から削除されました！`,
      ephemeral: true
    });
  } catch (error) {
    console.error('スレッド削除中にエラーが発生しました:', error);
    await interaction.editReply({
      content: 'スレッドの削除中にエラーが発生しました。再度お試しください。',
      ephemeral: true
    });
  }
}
