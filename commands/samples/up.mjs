import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
const cooldowns = new Map();

export const data = new SlashCommandBuilder()
  .setName('advertise')
  .setDescription('RuruServerに宣伝');

export async function execute(interaction) {
  const targetGuildId = 'YOUR_SERVER_ID';
  const targetChannelId = 'YOUR_CHANNEL_ID';
  const cooldownTime = 2 * 60 * 60 * 1000;
  await interaction.deferReply();
  try {
    const targetGuild = await interaction.client.guilds.fetch(targetGuildId);
    const targetChannel = await targetGuild.channels.fetch(targetChannelId);
    if (!targetChannel || !targetChannel.isTextBased()) {
      return await interaction.editReply({
        content: '宣伝を送信するサーバーでエラーが発生しました',
      });
    }
    const sourceGuildId = interaction.guildId;
    const now = Date.now();
    const lastSent = cooldowns.get(sourceGuildId) || 0;
    if (now - lastSent < cooldownTime) {
      const timeLeft = Math.ceil((cooldownTime - (now - lastSent)) / 1000 / 60);
      return await interaction.editReply({
        content: `クールダウン中です。${timeLeft}分後に再度試してください。`,
      });
    }
    const sourceGuild = interaction.guild;
    const sourceChannel = interaction.channel;
    let invite;
    try {
      invite = await sourceChannel.createInvite({
        maxAge: 0,
        maxUses: 0,
        reason: '宣伝用招待リンク',
      });
    } catch (error) {
      console.error('招待リンク作成エラー:', error);
      return await interaction.editReply({
        content: '招待リンクの作成に失敗しました。ボットの権限を確認してください。',
      });
    }
    const description = sourceGuild.description || '素晴らしいコミュニティに参加しましょう！';
    const embed = new EmbedBuilder()
      .setTitle(`${sourceGuild.name}`)
      .setDescription(`${description}\n\n[参加はこちら](${invite.url})`)
      .setColor('#0099ff')
      .setThumbnail(sourceGuild.iconURL())
      .setTimestamp();
    await targetChannel.send({ embeds: [embed] });
    cooldowns.set(sourceGuildId, now);
    await interaction.editReply({
      content: 'サーバーを宣伝しました！',
    });
  } catch (error) {
    console.error('エラー:', error);
    await interaction.editReply({
      content: 'エラーが発生しました。ボットの権限を確認してください。',
    });
  }
}
