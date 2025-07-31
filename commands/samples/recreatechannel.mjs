import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('recreate_channel')
    .setDescription('現在のチャンネルを再作成します')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.channel;
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.editReply({
            content: 'チャンネルを管理する権限がありません！',
            ephemeral: true,
        });
    }
    try {
        const channelData = {
            name: channel.name,
            type: channel.type,
            parent: channel.parentId,
            topic: channel.topic,
            nsfw: channel.nsfw,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            rateLimitPerUser: channel.rateLimitPerUser,
            permissionOverwrites: channel.permissionOverwrites.cache.map((perm) => ({
                id: perm.id,
                type: perm.type,
                allow: perm.allow.bitfield,
                deny: perm.deny.bitfield,
            })),
        };
        await interaction.editReply({
            content: 'チャンネルを再作成中...',
            ephemeral: true,
        });
        await channel.delete();
        const newChannel = await interaction.guild.channels.create({
            ...channelData,
            reason: `チャンネル再作成コマンドによる再作成 (${interaction.user.tag})`,
        });
        await newChannel.send({
            content: `このチャンネルは <@${interaction.user.id}> によって再作成されました！`,
        });
    } catch (error) {
        console.error('チャンネル再作成中にエラーが発生:', error);
        await interaction.followUp({
            content: 'チャンネルの再作成中にエラーが発生しました。',
            ephemeral: true,
        });
    }
}
