import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('指定したロールの情報を表示します')
    .addRoleOption(option =>
        option
            .setName('role')
            .setDescription('情報を表示したいロール')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export async function execute(interaction) {
    await interaction.deferReply();

    const role = interaction.options.getRole('role');

    try {
        if (!role) {
            throw new Error('ロールが見つかりませんでした。');
        }
        const permissions = role.permissions.toArray().join(', ') || 'なし';
        const embed = new EmbedBuilder()
            .setTitle(`ロール情報: ${role.name}`)
            .setColor(role.hexColor || '#00ff00')
            .addFields(
                { name: 'ロール名', value: role.name, inline: true },
                { name: 'ロールID', value: role.id, inline: true },
                { name: '作成日', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'カラー', value: role.hexColor || 'デフォルト', inline: true },
                { name: 'メンション可能', value: role.mentionable ? 'はい' : 'いいえ', inline: true },
                { name: '表示順位', value: `${role.position}`, inline: true },
                { name: '権限', value: permissions.length > 1024 ? '多数（詳細は省略）' : permissions, inline: false }
            )
            .setTimestamp();
        if (role.iconURL()) {
            embed.setThumbnail(role.iconURL({ dynamic: true }));
        }
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('ロール情報取得エラー:', error);
        await interaction.editReply({
            content: 'ロール情報の取得中にエラーが発生しました。ロールが存在するか確認してください。',
            ephemeral: true
        });
    }
}
