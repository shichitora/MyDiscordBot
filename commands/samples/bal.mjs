import { SlashCommandBuilder } from 'discord.js';
import { getUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('現在の通貨残高を表示します');

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const userData = getUserData(guildId, userId);
  const balance = userData.balance || 0;
  await interaction.editReply(`${interaction.user.tag} の残高: ${balance} コイン`);
}
