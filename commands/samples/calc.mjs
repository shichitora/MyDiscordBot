import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { create, all } from 'mathjs';
const math = create(all);

export const data = new SlashCommandBuilder()
    .setName('calc')
    .setDescription('数式を計算します')
    .addStringOption(option =>
        option
            .setName('expression')
            .setDescription('計算したい数式（例: 2 + 2 * 3 や sin(45 deg) ^ 2）')
            .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const expression = interaction.options.getString('expression');
    try {
        const result = math.evaluate(expression);
        const formattedResult = typeof result === 'number' 
            ? Number.isInteger(result) 
                ? result.toString()
                : result.toFixed(6).replace(/\.?0+$/, '')
            : result.toString();
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('計算結果')
            .addFields(
                { name: '入力', value: `\`\`\`${expression}\`\`\`` },
                { name: '結果', value: `\`\`\`${formattedResult}\`\`\`` }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('エラー')
            .setDescription('無効な数式です。以下の点を確認してください：\n' +
                '- 正しい数式形式を使用しているか\n' +
                '- サポートされている関数を使用しているか\n' +
                '- 括弧が正しく閉じているか')
            .addFields(
                { name: '入力された数式', value: `\`\`\`${expression}\`\`\`` },
                { name: 'エラーメッセージ', value: `\`\`\`${error.message}\`\`\`` }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
}
