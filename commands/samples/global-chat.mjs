import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
const jsonPath = path.join(process.cwd(), 'new', 'globalchat.json');

async function initializeGlobalChatData() {
  try {
    await mkdir(path.dirname(jsonPath), { recursive: true });
    try {
      await readFile(jsonPath);
      console.log('JSONファイルが存在します:', jsonPath);
    } catch (error) {
      console.log('JSONファイルを作成します:', jsonPath);
      await writeFile(jsonPath, JSON.stringify([], null, 2));
      console.log('JSONファイルを作成しました');
    }
  } catch (error) {
    console.error('JSONファイル初期化エラー:', error);
    throw error;
  }
}

async function readGlobalChatData() {
  try {
    await initializeGlobalChatData();
    const data = await readFile(jsonPath, 'utf8');
    const parsedData = JSON.parse(data);
    console.log('JSON読み込み成功:', parsedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('JSON読み込みエラー:', error);
    return [];
  }
}

async function writeGlobalChatData(data) {
  try {
    await writeFile(jsonPath, JSON.stringify(data, null, 2));
    console.log('JSON書き込み成功:', data);
  } catch (error) {
    console.error('JSON書き込みエラー:', error);
    throw error;
  }
}

export const data = new SlashCommandBuilder()
  .setName('global-chat')
  .setDescription('グローバルチャットを管理します')
  .addSubcommand(subcommand =>
    subcommand
      .setName('in')
      .setDescription('グローバルチャットに参加します')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('グローバルチャットを設定するチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leave')
      .setDescription('グローバルチャットから退出します')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('グローバルチャットを解除するチャンネル')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageWebhooks)) {
    return await interaction.editReply({
      content: 'このコマンドを使用するには「Webhookの管理」権限が必要です。',
    });
  }
  const subcommand = interaction.options.getSubcommand();
  const channel = interaction.options.getChannel('channel');
  const guildId = interaction.guildId;
  if (!channel.isTextBased()) {
    return await interaction.editReply({
      content: '指定されたチャンネルはテキストチャンネルである必要があります。',
    });
  }
  let globalChatData = await readGlobalChatData();
  let guildData = globalChatData.find(data => data.guildId === guildId);
  if (subcommand === 'in') {
    if (!guildData) {
      guildData = { guildId, channels: [] };
      globalChatData.push(guildData);
    }
    if (guildData.channels.some(data => data.channelId === channel.id)) {
      return await interaction.editReply({
        content: 'このチャンネルはすでにグローバルチャットに登録されています。',
      });
    }
    try {
      const webhook = await channel.createWebhook({
        name: 'Global Chat Webhook',
        avatar: interaction.client.user.displayAvatarURL(),
      });
      guildData.channels.push({
        channelId: channel.id,
        webhookUrl: webhook.url,
      });
      await writeGlobalChatData(globalChatData);
      await interaction.editReply({
        content: `${channel} がグローバルチャットに登録されました！`,
      });
    } catch (error) {
      console.error('Webhook作成エラー:', error);
      await interaction.editReply({
        content: 'Webhookの作成に失敗しました。',
      });
    }
  } else if (subcommand === 'leave') {
    if (!guildData || !guildData.channels.some(data => data.channelId === channel.id)) {
      return await interaction.editReply({
        content: 'このチャンネルはグローバルチャットに登録されていません。',
      });
    }
    try {
      const channelData = guildData.channels.find(data => data.channelId === channel.id);
      const webhook = await interaction.client.fetchWebhook(channelData.webhookUrl.split('/').pop());
      await webhook.delete();
      console.log(`Webhookを削除しました: チャンネル ${channel.id}`);
    } catch (error) {
      console.error('Webhook削除エラー:', error);
    }
    guildData.channels = guildData.channels.filter(data => data.channelId !== channel.id);
    globalChatData = globalChatData.filter(data => data.channels.length > 0);
    await writeGlobalChatData(globalChatData);
    await interaction.editReply({
      content: `${channel} がグローバルチャットから解除されました。`,
    });
  }
}
