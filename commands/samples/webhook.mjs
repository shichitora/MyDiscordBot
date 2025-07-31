import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('delete_webhook')
  .setDescription('指定したWebhookを削除します')
  .setDMPermission(true)
  .addStringOption(option =>
    option
      .setName('webhook_id')
      .setDescription('削除するWebhookのID')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const webhookId = interaction.options.getString('webhook_id');
  try {
    const webhook = await interaction.guild.fetchWebhooks();
    const targetWebhook = webhook.get(webhookId);
    if (!targetWebhook) {
      await interaction.editReply({
        content: '指定されたWebhookが見つかりません。',
        ephemeral: true,
      });
      return;
    }
    await targetWebhook.delete();
    await interaction.editReply(`Webhook (ID: ${webhookId}) を削除しました。`);
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: 'Webhookの削除に失敗しました。権限またはIDを確認してください。',
      ephemeral: true,
    });
  }
}
