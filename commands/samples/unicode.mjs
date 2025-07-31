import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unicode')
    .setDescription('Unicode文字とコードポイントを変換します')
    .addStringOption(option =>
        option
            .setName('input')
            .setDescription('変換したいUnicode文字またはコードポイント (例: A または \\u0041)')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export async function execute(interaction) {
    await interaction.deferReply({ephemeral: true});
    const input = interaction.options.getString('input');
    try {
        let result;
        let description;
        if (input.match(/^\\u[0-9a-fA-F]{4}$/)) {
            const codePoint = parseInt(input.slice(2), 16);
            if (codePoint < 0 || codePoint > 0x10FFFF) {
                throw new Error('無効なUnicodeコードポイントです（範囲: \\u0000 から \\u10FFFF）。');
            }
            result = String.fromCodePoint(codePoint);
            description = `コードポイント \`${input}\` を文字に変換しました。`;
        }
        else if (input.length === 1) {
            const codePoint = input.codePointAt(0);
            result = `\\u${codePoint.toString(16).padStart(4, '0').toUpperCase()}`;
            description = `文字 \`${input}\` をコードポイントに変換しました。`;
        } else {
            throw new Error('入力は1文字または \\uXXXX 形式（例: \\u0041）のいずれかにしてください。');
        }
        const embed = new EmbedBuilder()
            .setTitle('Unicode変換')
            .setDescription(description)
            .addFields(
                { name: '入力', value: `\`\`\`${input}\`\`\``, inline: true },
                { name: '変換結果', value: `\`\`\`${result}\`\`\``, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();
        await interaction.editReply({ embeds: [embed],ephemeral: true });
    } catch (error) {
        console.error('Unicode変換エラー:', error);
        await interaction.editReply({
            content: `エラーが発生しました: ${error.message}\n例: A または \\u0041`,
            ephemeral: true
        });
    }
}
