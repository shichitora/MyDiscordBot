import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('removestickymessage')
  .setDescription('固定メッセージを削除')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('対象チャンネル')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guild.id;
  const stickies = JSON.parse(fs.readFileSync('./new/stickymessages.json', 'utf8'));
  const channel = interaction.options.getChannel('channel');
  if (stickies[guildId]?.[channel.id]) {
    delete stickies[guildId][channel.id];
    fs.writeFileSync('./new/stickymessages.json', JSON.stringify(stickies, null, 2));
    await interaction.editReply(`チャンネル${channel.name}の固定メッセージを削除しました。`);
  } else {
    await interaction.editReply('そのチャンネルに固定メッセージはありません。');
  }
}
