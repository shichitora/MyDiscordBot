import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('role_list')
    .setDescription('サーバーのロール一覧を表示します');

export const execute = async (interaction) => {
    await interaction.deferReply();
    const guild = interaction.guild;
    const roles = guild.roles.cache
        .filter(role => role.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(role => `${role.name} (ID: ${role.id})`)
        .join('\n') || 'ロールがありません。';
    const embed = new EmbedBuilder()
        .setTitle(`${guild.name} のロール一覧`)
        .setDescription(roles)
        .setColor('#00AAFF')
        .setTimestamp()
        .setFooter({ text: `リクエスト: ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed] });
};
