import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('ユーザーのバナーを表示します')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('情報を表示するユーザー（省略時は自分）')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const user = await interaction.client.users.fetch(targetUser.id, { force: true });
    const bannerUrl = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=512` : null;
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${user.tag} のバナー`)
      .setThumbnail(bannerUrl || user.displayAvatarURL({ dynamic: true, size: 128 }))
      .setTimestamp();
    if (bannerUrl) {
      embed.addFields({ name: 'バナー', value: `[バナーのリンク](${bannerUrl})`, inline: false });
    } else {
      embed.addFields({ name: 'バナー', value: 'このユーザーはバナーを設定していません。', inline: false });
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('アバター/バナー表示エラー:', error);
    await interaction.editReply({
      content: 'ユーザー情報の取得中にエラーが発生しました。',
      ephemeral: true,
    });
  }
}
