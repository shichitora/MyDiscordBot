import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('サーバーの情報を表示します');

export const execute = async (interaction) => {
    await interaction.deferReply();
    const guild = interaction.guild;
    const serverName = guild.name;
    const serverId = guild.id;
    const createdAt = guild.createdAt.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const memberCount = guild.memberCount;
    const channels = guild.channels.cache.size; 
    const owner = await guild.fetchOwner();
    const roleCount = guild.roles.cache.size;
    const boostLevel = guild.premiumTier;
    const customEmojis = guild.emojis.cache.size;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
    const embed = new EmbedBuilder()
        .setTitle(`${serverName} の情報`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setColor('#00AAFF')
        .addFields(
            { name: 'サーバー名', value: serverName, inline: true },
            { name: 'サーバーID', value: serverId, inline: true },
            { name: '作成日', value: createdAt, inline: true },
            { name: 'メンバー数', value: `${memberCount}人`, inline: true },
            { name: 'オンラインメンバー数', value: `${onlineMembers}人`, inline: true },
            { name: 'チャンネル数', value: `${channels}個`, inline: true }, 
            { name: 'サーバー所有者', value: owner.user.tag, inline: true },
            { name: 'ロール数', value: `${roleCount}個`, inline: true },
            { name: 'ブーストレベル', value: `レベル ${boostLevel}`, inline: true },
            { name: 'カスタム絵文字数', value: `${customEmojis}個`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `リクエスト: ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed] });
};
