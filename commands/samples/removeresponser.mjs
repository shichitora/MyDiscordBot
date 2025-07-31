import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('removeresponser')
  .setDescription('キーワードを削除')
  .addStringOption(option =>
    option.setName('keyword')
      .setDescription('削除するキーワード')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guild.id;
  const responses = JSON.parse(fs.readFileSync('./new/responses.json', 'utf8'));
  const keyword = interaction.options.getString('keyword');
  if (responses[guildId]?.[keyword]) {
    delete responses[guildId][keyword];
    fs.writeFileSync('./new/responses.json', JSON.stringify(responses, null, 2));
    await interaction.editReply(`キーワード「${keyword}」を削除しました。`);
  } else {
    await interaction.editReply('そのキーワードは登録されていません。');
  }
}
