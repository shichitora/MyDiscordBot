import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
    .setName('short')
    .setDMPermission(true)
    .setDescription('指定したURLを短縮リンクに変換します')
    .addStringOption(option =>
        option
            .setName('url')
            .setDescription('短縮したいURL')
            .setRequired(true));

export const execute = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const url = interaction.options.getString('url');
    const urlPattern = /^(https?:\/\/[^\s]+)/;
    if (!urlPattern.test(url)) {
        return await interaction.editReply({ content: '有効なURLを入力してください（例: https://example.com）。', ephemeral: true });
    }
    try {
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        const shortUrl = response.data;
        if (shortUrl === 'Error') {
            return await interaction.editReply({ content: 'URLの短縮に失敗しました。もう一度試してください。', ephemeral: true });
        }
        await interaction.editReply({ content: `短縮リンク: ${shortUrl}`, ephemeral: true });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '短縮リンクの作成中にエラーが発生しました。', ephemeral: true });
    }
};
