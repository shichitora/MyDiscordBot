import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('addresponser')
  .setDescription('キーワードに反応する応答を追加')
  .addStringOption(option =>
    option.setName('keyword')
      .setDescription('反応するキーワード')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('response1')
      .setDescription('返す内容1')
      .setRequired(true))
  .addStringOption(option => option.setName('response2').setDescription('返す内容2'))
  .addStringOption(option => option.setName('response3').setDescription('返す内容3'))
  .addStringOption(option => option.setName('response4').setDescription('返す内容4'))
  .addStringOption(option => option.setName('response5').setDescription('返す内容5'))
  .addStringOption(option => option.setName('response6').setDescription('返す内容6'))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const responses = JSON.parse(fs.readFileSync('./new/responses.json', 'utf8'));
  const keyword = interaction.options.getString('keyword');
  const responseList = [
    interaction.options.getString('response1'),
    interaction.options.getString('response2'),
    interaction.options.getString('response3'),
    interaction.options.getString('response4'),
    interaction.options.getString('response5'),
    interaction.options.getString('response6'),
  ].filter(Boolean);
  await interaction.deferReply({ ephemeral: true });
  if (!responses[guildId]) responses[guildId] = {};
  responses[guildId][keyword] = responseList;
  fs.writeFileSync('./new/responses.json', JSON.stringify(responses, null, 2));
  await interaction.editReply(`キーワード「${keyword}」に${responseList.length}件の応答を追加しました。`);
}
