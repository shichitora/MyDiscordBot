import { SlashCommandBuilder, PermissionsBitField, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('custom_clear')
  .setDescription('指定された正規表現にマッチする過去のメッセージを削除します')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .addStringOption(option =>
    option.setName('regex')
      .setDescription('削除したいメッセージにマッチする正規表現')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('最大で何件のメッセージをチェックするか（最大100）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('メッセージをチェックするチャンネル（指定しない場合は現在のチャンネル）')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    return await interaction.editReply({ content: 'このコマンドを使用するにはメッセージ管理権限が必要です。', ephemeral: true });
  }
  const regexPattern = interaction.options.getString('regex');
  const limit = interaction.options.getInteger('limit');
  const channel = interaction.options.getChannel('channel') || interaction.channel;
  try {
    let regex;
    try {
      regex = new RegExp(regexPattern, 'i');
    } catch (error) {
      return await interaction.editReply({ content: '無効な正規表現です。', ephemeral: true });
    }
    let messagesDeleted = 0;
    let lastId = null;
    while (messagesDeleted < limit) {
      const messages = await channel.messages.fetch({ limit: 100, before: lastId });
      if (messages.size === 0) break;
      let messagesToDelete = [];
      for (const [id, message] of messages) {
        if (regex.test(message.content)) {
          messagesToDelete.push(id);
          messagesDeleted++;
        }
        if (messagesDeleted >= limit) break;
      }
      if (messagesToDelete.length > 0) {
        await channel.bulkDelete(messagesToDelete);
      }
      lastId = messages.last()?.id;
      if (!lastId) break;
    }
    await interaction.editReply({ content: `正規表現 にマッチする ${messagesDeleted} 件のメッセージを削除しました。` });
  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: 'エラーが発生しました。正常に削除できていない可能性があります。', ephemeral: true });
  }
}
