import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('remove_role')
    .setDescription('指定したユーザーからロールを剥奪します')
    .addUserOption(option =>
        option
            .setName('target')
            .setDescription('ロールを剥奪するユーザー')
            .setRequired(true))
    .addRoleOption(option =>
        option
            .setName('role')
            .setDescription('剥奪するロール')
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
        return await interaction.editReply({ content: '私のロールより上位または同等のロールは剥奪できません。', ephemeral: true });
    }
    if (!target.roles.cache.has(role.id)) {
        return await interaction.editReply({ content: `${target.user.tag} は ${role.name} ロールを持っていません。`, ephemeral: true });
    }
    try {
        await target.roles.remove(role);
        await interaction.reply({ content: `${target.user.tag} から ${role.name} ロールを剥奪しました。` });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'ロールの剥奪中にエラーが発生しました。', ephemeral: true });
    }
};
