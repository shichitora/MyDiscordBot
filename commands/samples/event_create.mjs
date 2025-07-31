import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('event_create')
    .setDescription('新しいイベントを作成します')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('イベントの名前')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('description')
            .setDescription('イベントの説明')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('start')
            .setDescription('開始日時 (例: 2025-04-25 18:00)')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const startTime = new Date(interaction.options.getString('start'));
    if (isNaN(startTime)) {
        return interaction.editReply({ content: '無効な日時形式です。例: 2025-04-25 18:00', ephemeral: true });
    }
    try {
        const event = await interaction.guild.scheduledEvents.create({
            name,
            description,
            scheduledStartTime: startTime,
            privacyLevel: 2,
            entityType: 3,
            entityMetadata: { location: 'Discord' },
            reason: `${interaction.user.tag} によるイベント作成`,
        });
        await interaction.editReply(`イベント **${event.name}** を作成しました！`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'イベントの作成に失敗しました。', ephemeral: true });
    }
}
