import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('give_role')
    .setDescription('指定したユーザーにロールを付与します')
    .addUserOption(option =>
        option
            .setName('target')
            .setDescription('ロールを付与するユーザー')
            .setRequired(true))
    .addRoleOption(option =>
        option
            .setName('role')
            .setDescription('付与するロール')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export const execute = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const target = interaction.options.getMember('target');
    const role = interaction.options.getRole('role');
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply({ content: 'あなたにはロールを管理する権限がありません。', ephemeral: true });
    }
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply({ content: '私にはロールを管理する権限がありません。', ephemeral: true });
    }
    const botHighestRole = guild.members.me.roles.highest;
    if (role.position >= botHighestRole.position) {
        return await interaction.editReply({ content: '私のロールより上位または同等のロールは付与できません。', ephemeral: true });
    }
    if (target.roles.cache.has(role.id)) {
        return await interaction.editReply({ content: `${target.user.tag} はすでに ${role.name} ロールを持っています。`, ephemeral: true });
    }
    try {
        await target.roles.add(role);
        await interaction.editReply({ content: `${target.user.tag} に ${role.name} ロールを付与しました。` });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'ロールの付与中にエラーが発生しました。', ephemeral: true });
    }
};
