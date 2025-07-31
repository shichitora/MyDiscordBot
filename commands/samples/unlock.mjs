import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('現在のチャンネルのロックを解除します（指定ロールのメッセージ送信を許可）。')
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('ロック解除対象のロール（指定しない場合は@everyone）')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(role, {
            SendMessages: null
        });
        await interaction.editReply({
            content: `${role.name} ロールに対してチャンネルのロックを解除しました。このロールを持つユーザーはメッセージを送信できるようになりました。`,
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'チャンネルのロック解除中にエラーが発生しました。',
            ephemeral: true
        });
    }
}
