import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('messageopen')
  .setDescription('メッセージリンク展開を設定')
  .addBooleanOption(option =>
    option.setName('enabled')
      .setDescription('有効/無効')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply();
  const enabled = interaction.options.getBoolean('enabled');
  const guildId = interaction.guild.id;
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  if (!config[guildId]) config[guildId] = {};
  config[guildId].messageopen = enabled;
  fs.writeFileSync('./new/config.json', JSON.stringify(config, null, 2));
  await interaction.editReply(`メッセージリンク展開を${enabled ? '有効' : '無効'}にしました。`);
}
