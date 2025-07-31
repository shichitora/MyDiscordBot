import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('channel_create')
    .setDescription('新しいテキストチャンネルを作成します')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('作成するチャンネルの名前')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channelName = interaction.options.getString('name');
    try {
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: 0, 
            reason: `${interaction.user.tag} によるチャンネル作成`,
        });
        await interaction.reply(`チャンネル **${channel.name}** を作成しました！`);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'チャンネルの作成に失敗しました。', ephemeral: true });
    }
}
