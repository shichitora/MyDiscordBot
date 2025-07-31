import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('role_create')
    .setDescription('新しいロールを作成します')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('作成するロールの名前')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const roleName = interaction.options.getString('name');
    try {
        const role = await interaction.guild.roles.create({
            name: roleName,
            color: 'Random',
            reason: `${interaction.user.tag} によるロール作成`,
        });
        await interaction.reply(`ロール **${role.name}** を作成しました！`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'ロールの作成に失敗しました。', ephemeral: true });
    }
}
