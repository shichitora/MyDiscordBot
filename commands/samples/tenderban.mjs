import { SlashCommandBuilder } from 'discord.js';

const premiumRoleId = '1368131371939401728';

export const data = new SlashCommandBuilder()
    .setName('tenderban')
    .setDescription('指定したユーザーをBANします（メッセージ削除はしません）')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('BANするユーザー')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('BANの理由')
            .setRequired(false));

export async function execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';
    try {
        await interaction.guild.members.ban(user, { reason: reason, deleteMessageSeconds: 0 });
        await interaction.editReply(`${user.tag} をBANしました。理由: ${reason}`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'BANができません！', ephemeral: true });
    }
}
