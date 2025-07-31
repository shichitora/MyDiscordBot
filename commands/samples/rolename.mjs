import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('rolename')
  .setDescription('ユーザーの最上位のロールをニックネームに追加します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
  .setDMPermission(false);

export async function execute(interaction) {
await interaction.deferReply({ ephemeral: true });
  try {
    const member = interaction.member;
    const roles = member.roles.cache
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position);
    const topRole = roles.first();
    if (!topRole) {
      return await interaction.editReply({
        content: 'あなたに付与されているロールがありません！',
        ephemeral: true,
      });
    }
    const baseName = member.displayName || member.user.username;
    const newNickname = `${baseName} [${topRole.name}]`;
    if (newNickname.length > 32) {
      return await interaction.editReply({
        content: 'ニックネームが長すぎます！32文字以内にしてください。',
        ephemeral: true,
      });
    }
    await member.setNickname(newNickname);
    await interaction.editReply({
      content: `ロールネームを設定しました`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('エラー:', error);
    await interaction.editReply({
      content: 'ニックネームの変更中にエラーが発生しました。ボットの権限を確認してください。',
      ephemeral: true,
    });
  }
}
