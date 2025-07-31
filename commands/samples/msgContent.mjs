import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('message_contents')
  .setDescription('指定したメッセージURLの内容を表示します。')
  .setDMPermission(true)
  .addStringOption(option =>
    option.setName('url')
      .setDescription('メッセージのURL')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const url = interaction.options.getString('url');
  const client = interaction.client;
  try {
    const urlPattern = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const match = url.match(urlPattern);
    if (!match) {
      return await interaction.editReply('無効なメッセージURLです。正しい形式のURLを入力してください。');
    }
    const [, guildId, channelId, messageId] = match;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      return await interaction.editReply('指定されたチャンネルにアクセスできません。');
    }
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) {
      return await interaction.editReply('指定されたメッセージが見つかりません。');
    }
    let response = `**メッセージ内容**:\n${message.content || '(内容なし)'}\n`;
    response += `**送信者**: ${message.author.tag}\n`;
    response += `**送信日時**: ${message.createdAt.toLocaleString('ja-JP')}\n`;
    if (message.attachments.size > 0) {
      response += '**添付ファイル**:\n';
      message.attachments.forEach(attachment => {
        response += `- ${attachment.url}\n`;
      });
    }
    await interaction.editReply(response);
  } catch (error) {
    console.error('メッセージ取得エラー:', error);
    await interaction.editReply('メッセージの取得中にエラーが発生しました。');
  }
}
