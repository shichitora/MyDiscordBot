import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unban')
    .setDescription('指定したユーザーIDのBANを解除します。')
    .addStringOption(option =>
        option.setName('userid')
            .setDescription('BAN解除するユーザーのID')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.options.getString('userid');
    try {
        await interaction.guild.members.unban(userId);
        await interaction.editReply(`ID: ${userId} のBANを解除しました。`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
