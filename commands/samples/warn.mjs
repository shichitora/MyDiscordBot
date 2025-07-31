import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('指定したユーザーに警告を送信します。')
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('警告するユーザー')
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('reason')
            .setDescription('警告の理由')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由が指定されていません。';
    const guild = interaction.guild;
    try {
        await targetUser.send({
            content: `**${guild.name}** から警告を受けました。\n**理由**: ${reason}`,
        });
        await interaction.editReply({
            content: `${targetUser.tag} に警告を送信しました。\n**理由**: ${reason}`,
            ephemeral: true,
        });
    } catch (error) {
        await interaction.editReply({
            content: `${targetUser.tag} にDMを送信できませんでした。ユーザーがDMをブロックしている可能性があります。`,
            ephemeral: true,
        });
        console.error('DM送信エラー:', error);
    }
}
