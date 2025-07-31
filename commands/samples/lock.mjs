import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('lock')
    .setDescription('現在のチャンネルをロックします（指定ロールのメッセージ送信を禁止）。')
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('ロック対象のロール（指定しない場合は@everyone）')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;
        const channel = interaction.channel;
        const currentPermissions = channel.permissionsFor(role);
        await channel.permissionOverwrites.edit(role, {
            SendMessages: false
        });
        await interaction.editReply({
            content: `${role.name} ロールに対してチャンネルをロックしました。このロールを持つユーザーはメッセージを送信できません。`,
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'チャンネルのロック中にエラーが発生しました。',
            ephemeral: true
        });
    }
}
