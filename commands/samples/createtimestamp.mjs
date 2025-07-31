import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('timestamp')
    .setDescription('指定した日時からDiscordタイムスタンプを作成します')
    .addStringOption(option =>
        option
            .setName('datetime')
            .setDescription('日時 (例: 2025-05-21 15:30)')
            .setRequired(true)
    )
    .setDMPermission(true)
    .addStringOption(option =>
        option
            .setName('format')
            .setDescription('タイムスタンプの形式')
            .setRequired(false)
            .addChoices(
                { name: '短い時刻', value: 't' },
                { name: '長い時刻', value: 'T' },
                { name: '短い日付', value: 'd' },
                { name: '長い日付', value: 'D' },
                { name: '日付と時刻', value: 'f' },
                { name: '長い日付と時刻', value: 'F' },
                { name: '相対時間', value: 'R' }
            )
    );

export async function execute(interaction) {
    await interaction.deferReply({ephemeral: true});
    const datetimeString = interaction.options.getString('datetime');
    const format = interaction.options.getString('format') || 'f';
    try {
        const date = new Date(datetimeString);
        if (isNaN(date.getTime())) {
            throw new Error('無効な日時形式です。例: 2025-05-21 15:30');
        }
        const timestamp = Math.floor(date.getTime() / 1000);
        const timestampString = `<t:${timestamp}:${format}>`;
        const timestampCopy = `\`\`\`<t:${timestamp}:${format}>\`\`\``;
        const embed = new EmbedBuilder()
            .setTitle('タイムスタンプ生成')
            .addFields(
                { name: '入力された日時', value: datetimeString, inline: true },
                { name: 'プレビュー', value: timestampString, inline: true },
                { name: 'コピー', value: timestampCopy, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('タイムスタンプ生成エラー:', error);
        await interaction.editReply({
            content: `エラーが発生しました: ${error.message}\n正しい形式（例: 2025-05-21 15:30）で入力してください。`,
            ephemeral: true
        });
    }
}
