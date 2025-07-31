import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('autokick')
  .setDescription('自動キックを設定します')
  .addStringOption(option =>
    option.setName('condition')
      .setDescription('キックの条件（avatarless, newaccount）')
      .setRequired(true)
      .addChoices(
        { name: 'アバターなし', value: 'avatarless' },
        { name: '新アカウント', value: 'newaccount' }
      ))
  .addBooleanOption(option =>
    option.setName('enabled')
      .setDescription('有効/無効')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply();
  const condition = interaction.options.getString('condition');
  const enabled = interaction.options.getBoolean('enabled');
  const guildId = interaction.guild.id;
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  if (!config[guildId]) config[guildId] = {};
  config[guildId].autokick = { condition, enabled };
  fs.writeFileSync('./new/config.json', JSON.stringify(config, null, 2));
  await interaction.editReply(`自動キック（${condition}）を${enabled ? '有効' : '無効'}にしました。`);
}
