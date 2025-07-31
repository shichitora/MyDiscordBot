import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('指定したユーザーをキックします。')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('キックするユーザー')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('キックの理由')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.kick(reason);
        await interaction.editReply(`${user.tag} をキックしました。理由: ${reason}`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
