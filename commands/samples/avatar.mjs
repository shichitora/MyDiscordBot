import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('ユーザーのアバターを表示します')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('情報を表示するユーザー（省略時は自分）')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const user = await interaction.client.users.fetch(targetUser.id, { force: true });
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${user.tag} のアバター`)
      .setImage(avatarUrl)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('アバター表示エラー:', error);
    await interaction.reply({
      content: 'ユーザー情報の取得中にエラーが発生しました。',
      ephemeral: true,
    });
  }
}
