import { SlashCommandBuilder } from 'discord.js';
import { getGuildRanking } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('サーバーの通貨ランキングを表示します');

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const ranking = getGuildRanking(guildId);
  const guild = interaction.guild;
  await guild.members.fetch()
  if (ranking.length === 0) {
    return interaction.editReply('ランキングデータがありません。');
  }
  const rankingText = ranking
    .map((user, index) => {
      const member = interaction.guild.members.cache.get(user.userId);
      return `${index + 1}. ${member?.user.tag || 'Unknown User'}: ${user.balance} コイン`;
    })
    .join('\n');
  await interaction.editReply(`**通貨ランキング**\n${rankingText}`);
}
