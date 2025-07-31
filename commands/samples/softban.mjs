import { SlashCommandBuilder } from 'discord.js';

const premiumRoleId = '1368131371939401728';

export const data = new SlashCommandBuilder()
    .setName('softban')
    .setDescription('指定したユーザーをbanし、即banを解除する（メッセージ削除とkickをしたい場合）')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('kickするユーザー')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('kickの理由')
            .setRequired(false));

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';
    try {
        await interaction.guild.members.ban(user, { reason: reason });
        await interaction.guild.members.unban(user);
        await interaction.editReply(`${user.tag} をkickしました。理由: ${reason}`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
