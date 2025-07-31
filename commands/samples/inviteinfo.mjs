import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('inviteinfo')
    .setDescription('招待リンクからサーバー情報を表示します')
    .addStringOption(option =>
        option
            .setName('invite')
            .setDescription('サーバーの招待リンク')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const inviteLink = interaction.options.getString('invite');
    try {
        const invite = await interaction.client.fetchInvite(inviteLink);
        const guild = invite.guild;
        if (!guild) {
            throw new Error('サーバー情報を取得できませんでした。');
        }
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} のサーバー情報`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'サーバーID', value: guild.id, inline: true },
                { name: '作成日', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'メンバー数', value: `${invite.approximateMemberCount || '不明'}`, inline: true },
                { name: 'オンラインメンバー', value: `${invite.approximatePresenceCount || '不明'}`, inline: true },
                { name: 'チャンネル数', value: `${guild.channels?.channelCountWithoutThreads || '不明'}`, inline: true },
                { name: '招待リンクの作成者', value: invite.inviter ? `${invite.inviter.tag}` : '不明', inline: true },
                { name: '招待リンクの有効期限', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : '無期限', inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();
        if (guild.description) {
            embed.setDescription(guild.description);
        }
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true }));
        }
        if (invite.channel) {
            embed.addFields({
                name: '招待先チャンネル',
                value: `${invite.channel.name} (${invite.channel.type})`,
                inline: true
            });
        }
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('サーバー情報取得エラー:', error);
        await interaction.editReply({
            content: '招待リンクからサーバー情報を取得できませんでした。リンクが有効か、ボットに必要な権限があるか確認してください。',
            ephemeral: true
        });
    }
}
