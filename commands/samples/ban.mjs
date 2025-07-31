import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('指定したユーザーをBANします。')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('BANするユーザー')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('BANの理由')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.ban({ reason });
        await interaction.editReply(`${user.tag} をBANしました。理由: ${reason}`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
