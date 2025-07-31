import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('指定したユーザーのタイムアウトを解除します。')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('タイムアウトを解除するユーザー')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('user');
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(null);
        await interaction.editReply(`${user.tag} のタイムアウトを解除しました。`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
