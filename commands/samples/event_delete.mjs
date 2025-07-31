import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('event_delete')
    .setDescription('指定したイベントを削除します')
    .addStringOption(option =>
        option.setName('event')
            .setDescription('削除するイベントのID')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const eventId = interaction.options.getString('event');
    try {
        const event = await interaction.guild.scheduledEvents.fetch(eventId);
        if (!event) {
            return interaction.editReply({ content: '指定したイベントが見つかりません。', ephemeral: true });
        }
        await event.delete(`${interaction.user.tag} によるイベント削除`);
        await interaction.editReply(`イベント **${event.name}** を削除しました！`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'イベントの削除に失敗しました。', ephemeral: true });
    }
}
