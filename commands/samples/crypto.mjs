import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('crypto')
    .setDescription('文字列を暗号化または復号化します')
    .addStringOption(option =>
        option
            .setName('mode')
            .setDescription('暗号化または復号化を選択')
            .setRequired(true)
            .addChoices(
                { name: 'Encrypt', value: 'encrypt' },
                { name: 'Decrypt', value: 'decrypt' }
            )
    )
    .addStringOption(option =>
        option
            .setName('text')
            .setDescription('暗号化/復号化する文字列')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName('shift')
            .setDescription('シフト数（1-25、デフォルト: 3）')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(25)
    );

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const mode = interaction.options.getString('mode');
    const text = interaction.options.getString('text');
    const shift = interaction.options.getInteger('shift') || 3;
    try {
        if (text.length > 100) {
            throw new Error('入力文字列は100文字以内にしてください。');
        }
        if (!/^[a-zA-Z\s]+$/.test(text)) {
            throw new Error('英字とスペースのみ使用可能です。');
        }
        const result = mode === 'encrypt' 
            ? caesarCipher(text, shift) 
            : caesarCipher(text, -shift);
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(mode === 'encrypt' ? '暗号化結果' : '復号化結果')
            .addFields(
                { name: '入力', value: `\`\`\`${text}\`\`\``, inline: true },
                { name: 'シフト数', value: `\`\`\`${shift}\`\`\``, inline: true },
                { name: '結果', value: `\`\`\`${result}\`\`\``, inline: false }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('エラー')
            .setDescription('処理中にエラーが発生しました。以下の点を確認してください：\n' +
                '- 英字とスペースのみを使用\n' +
                '- 文字列は100文字以内\n' +
                '- シフト数は1～25の範囲')
            .addFields(
                { name: '入力された文字列', value: `\`\`\`${text}\`\`\`` },
                { name: 'エラーメッセージ', value: `\`\`\`${error.message}\`\`\`` }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
}

function caesarCipher(text, shift) {
    shift = ((shift % 26) + 26) % 26;
    return text
        .split('')
        .map(char => {
            if (char === ' ') return char;
            const isUpperCase = char === char.toUpperCase();
            const code = char.toLowerCase().charCodeAt(0) - 97;
            const shiftedCode = (code + shift) % 26;
            const newChar = String.fromCharCode(shiftedCode + 97);
            return isUpperCase ? newChar.toUpperCase() : newChar;
        })
        .join('');
}
