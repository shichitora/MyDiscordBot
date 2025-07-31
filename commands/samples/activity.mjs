import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('activity')
    .setDescription('同じアクティビティ中のメンバーを検索します(カスタムは"Custom Status")')
    .addStringOption(option =>
        option.setName('activity')
            .setDescription('検索するアクティビティ名')
            .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const activityName = interaction.options.getString('activity').toLowerCase();
    const guild = interaction.guild;
    await guild.members.fetch();
    const matchingMembers = guild.members.cache
        .filter(member => {
            if (member.presence?.status === 'offline') return false;
            return member.presence?.activities.some(activity => 
                activity.name.toLowerCase().includes(activityName)
            );
        })
        .first(100);
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`「${activityName}」をプレイ中のメンバー`)
        .setTimestamp();
    if (matchingMembers.length === 0) {
        embed.setDescription('該当するメンバーは見つかりませんでした。');
    } else {
        const memberList = matchingMembers.map(member => {
            const activity = member.presence.activities.find(act => 
                act.name.toLowerCase().includes(activityName)
            );
            return `${member.user.tag} - ${activity.name} ${activity.details ? `(${activity.details})` : ''}`;
        }).join('\n');
        embed.setDescription(memberList);
        embed.setFooter({ text: `合計: ${matchingMembers.length}人${matchingMembers.length === 100 ? ' (上限100人に達しました)' : ''}` });
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true });
}
