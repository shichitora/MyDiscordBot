import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('create_invite')
  .setDescription('サーバーの招待リンクを作成します')

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const invite = await interaction.channel.createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: true,
    });
    await interaction.editReply({
      content: `サーバーの招待リンク: ${invite.url}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: '招待リンクの作成中にエラーが発生しました。',
      ephemeral: true,
    });
  }
}
