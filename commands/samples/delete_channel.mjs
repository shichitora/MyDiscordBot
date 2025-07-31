import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('channeldelete')
    .setDescription('指定したチャンネルを削除します')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('削除するチャンネル')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    try {
        await channel.delete(`${interaction.user.tag} によるチャンネル削除`);
        await interaction.editReply(`チャンネル **${channel.name}** を削除しました！`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'チャンネルの削除に失敗しました。', ephemeral: true });
    }
}
