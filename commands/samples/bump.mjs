import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { writeFile } from 'fs/promises';
import { bumpNotifySettings, BUMP_SETTINGS_PATH } from '../../server.js';
import { join } from 'path';

export const data = new SlashCommandBuilder()
  .setName('notify')
  .setDescription('Bump/Up/Vote/Advertise通知機能をオンまたはオフにします。')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guildId;
  const currentStatus = bumpNotifySettings.get(guildId) || false;
  const newStatus = !currentStatus;
  bumpNotifySettings.set(guildId, newStatus);
  try {
    await writeFile(BUMP_SETTINGS_PATH, JSON.stringify(Object.fromEntries(bumpNotifySettings), null, 2));
  } catch (error) {
    console.error('Error saving bump settings:', error);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('エラー')
          .setDescription('設定の保存に失敗しました。管理者に連絡してください。')
          .setColor('#ff0000'),
      ],
      ephemeral: true,
    });
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle('Bump/Up/Vote/Advertise通知設定')
    .setDescription(
      newStatus
        ? 'Bump/Up/Vote/Advertise通知が有効になりました！'
        : 'Bump/Up/Vote/Advertise通知が無効になりました。'
    )
    .setColor(newStatus ? '#00ff00' : '#ff0000');
  await interaction.editReply({ embeds: [embed] });
}
