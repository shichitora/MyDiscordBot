import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setnick')
    .setDescription('指定したユーザーのニックネームを変更します')
    .addUserOption(option =>
        option
            .setName('target')
            .setDescription('ニックネームを変更するユーザー')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('nickname')
            .setDescription('新しいニックネーム（空欄でリセット）')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageNicknames);

export const execute = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return await interaction.editReply({ content: 'あなたにはニックネームを管理する権限がありません。', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return await interaction.editReply({ content: 'ニックネームを変更する権限がありません。', ephemeral: true });
    }
    const target = interaction.options.getMember('target');
    const newNickname = interaction.options.getString('nickname') || null;
    const botHighestRole = interaction.guild.members.me.roles.highest;
    const targetHighestRole = target.roles.highest;
    if (targetHighestRole.comparePositionTo(botHighestRole) >= 0) {
        return await interaction.editReply({ content: '私のロールがターゲットのロールより下位のため、ニックネームを変更できません。', ephemeral: true });
    }
    const executorHighestRole = interaction.member.roles.highest;
    if (targetHighestRole.comparePositionTo(executorHighestRole) >= 0 && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return await interaction.editReply({ content: 'あなたのロールがターゲットのロールより下位または同等なため、ニックネームを変更できません。', ephemeral: true });
    }
    try {
        const oldNickname = target.nickname || target.user.username;
        await target.setNickname(newNickname);
        const response = newNickname
            ? `${target.user.tag} のニックネームを "${oldNickname}" から "${newNickname}" に変更しました。`
            : `${target.user.tag} のニックネームを "${oldNickname}" からリセットしました。`;
        await interaction.reply({ content: response });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'ニックネームの変更中にエラーが発生しました。', ephemeral: true });
    }
};
