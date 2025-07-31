import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clearmessages')
    .setDescription('指定したユーザーのメッセージを削除します')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('メッセージを削除するユーザー')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('削除するメッセージの数（1-100）')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
    )
    .addStringOption(option =>
        option.setName('regex')
            .setDescription('メッセージをフィルタする正規表現（オプション）')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const regexPattern = interaction.options.getString('regex');
    const channel = interaction.channel;
    let messages = await channel.messages.fetch({ limit: amount });
    let filteredMessages = messages.filter(msg => msg.author.id === targetUser.id);
    if (regexPattern) {
        try {
            const regex = new RegExp(regexPattern, 'i');
            filteredMessages = filteredMessages.filter(msg => regex.test(msg.content));
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('無効な正規表現です。正しい形式で入力してください。');
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
    const deletedMessages = await channel.bulkDelete(filteredMessages, true).catch(error => {
        console.error(error);
        return null;
    });
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('メッセージ削除')
        .setTimestamp();
    if (!deletedMessages || deletedMessages.size === 0) {
        embed.setDescription(`${targetUser.tag} のメッセージは見つかりませんでした${regexPattern ? '（指定された正規表現に一致する）' : ''}。`);
    } else {
        embed.setDescription(`${targetUser.tag} のメッセージを ${deletedMessages.size} 件削除しました${regexPattern ? '（正規表現: ${regexPattern}）' : ''}。`);
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true });
}
