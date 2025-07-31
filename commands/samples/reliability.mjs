import { SlashCommandBuilder } from 'discord.js';
import { getUserData } from '../../utils/wdb.js';

export const data = new SlashCommandBuilder()
  .setName('reliability')
  .setDescription('現在の自分の信頼度を表示します');

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const userData = getUserData(guildId, userId);
  const point = userData.point || 0;
  await interaction.editReply(`${interaction.user.tag} の信頼度: ${point}`);
}
