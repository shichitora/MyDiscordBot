import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('チャンネルのスローモードを設定します。')
    .addIntegerOption(option =>
        option.setName('seconds')
            .setDescription('スローモードの間隔（秒）。0で解除。最大21600秒（6時間）')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const seconds = interaction.options.getInteger('seconds');
    try {
        await interaction.channel.setRateLimitPerUser(seconds);
        if (seconds === 0) {
            await interaction.editReply({
                content: 'スローモードを解除しました。',
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: `スローモードを設定しました。メッセージ送信間隔: ${seconds}秒`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'スローモードの設定中にエラーが発生しました。',
            ephemeral: true
        });
    }
}
