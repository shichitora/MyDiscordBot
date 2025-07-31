import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('指定した数のメッセージを削除します。')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('削除するメッセージの数')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    try {
        await interaction.deferReply({ ephemeral: true });
        const deletedMessages = await interaction.channel.bulkDelete(amount, true);
        await interaction.editReply({
            content: `${deletedMessages.size}件のメッセージを削除しました。`
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'メッセージの削除中にエラーが発生しました。2週間以上前のメッセージは削除できません。',
            ephemeral: true
        });
    }
}
