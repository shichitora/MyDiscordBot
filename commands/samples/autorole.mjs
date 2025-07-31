import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('autorole')
  .setDescription('自動ロールを設定')
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('付与するロール')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply();
  const role = interaction.options.getRole('role');
  const guildId = interaction.guild.id;
  const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
  if (!config[guildId]) config[guildId] = {};
  config[guildId].autorole = role.id;
  fs.writeFileSync('./new/config.json', JSON.stringify(config, null, 2));
  await interaction.editReply(`自動ロールを${role.name}に設定しました。`);
}
