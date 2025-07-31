import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('指定したユーザーをタイムアウトします。')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('タイムアウトするユーザー')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('duration')
            .setDescription('タイムアウトの時間（分）')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('タイムアウトの理由')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || '理由なし';
    try {
        const member = await interaction.guild.members.fetch(user.id);
        const durationMs = duration * 60 * 1000; // 分をミリ秒に変換
        await member.timeout(durationMs, reason);
        await interaction.editReply(`${user.tag} を ${duration}分間タイムアウトしました。理由: ${reason}`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'エラーが発生しました。', ephemeral: true });
    }
}
