import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('role_delete')
    .setDescription('指定したロールを削除します')
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('削除するロール')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    const role = interaction.options.getRole('role');
    try {
        await role.delete(` ${interaction.user.tag} によるロール削除`);
        await interaction.reply(`ロール **${role.name}** を削除しました！`);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'ロールの削除に失敗しました。', ephemeral: true });
    }
}
