// 悪用厳禁
import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import fs from 'fs';
import axios from 'axios';
const sendMessages = async (interaction, count, mode, interval, customMessages, embeds, buttons) => {
  try {
    let currentIndex = 0;
    for (let i = 0; i < count; i++) {
      let messageIndex;
      if (mode === 'default') {
        messageIndex = 0;
      } else if (mode === 'random') {
        messageIndex = Math.floor(Math.random() * customMessages.length);
      } else {
        messageIndex = currentIndex;
        currentIndex = (currentIndex + 1) % customMessages.length;
      }

      const messageText = customMessages[messageIndex];
      const embedData = embeds[messageIndex];
      const buttonData = buttons[messageIndex];

      let embed = null;
      if (embedData && (embedData.title || embedData.description)) {
        embed = new EmbedBuilder();
        if (embedData.title) embed.setTitle(embedData.title);
        if (embedData.description) {
          embed.setDescription(embedData.description);
        }
      }

      let row = null;
      if (buttonData && (buttonData.label || buttonData.color)) {
        const button = new ButtonBuilder()
          .setCustomId(`button_${messageIndex}_${i}_${Date.now()}`)
          .setLabel(buttonData.label || `ボタン${messageIndex + 1}`)
          .setStyle(ButtonStyle[buttonData.color || 'Primary']);
        row = new ActionRowBuilder().addComponents(button);
      }

      const sendOptions = {};
      if (messageText) sendOptions.content = messageText;
      if (embed) sendOptions.embeds = [embed];
      if (row) sendOptions.components = [row];

      await interaction.followUp(sendOptions);

      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
      }
    }
  } catch (error) {
    console.error('メッセージ送信中にエラーが発生しました:', error);
    await interaction.followUp({
      content: 'エラーが発生しました。詳細はログを確認してください。',
      ephemeral: true,
    });
  }
};

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('管理者専用コマンド')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('実行する操作の種類')
      .setRequired(true)
      .addChoices(
        { name: 'タイムアウト', value: 'timeOut' },
        { name: 'タイムアウト解除', value: 'unTimeOut' },
        { name: 'キック', value: 'kick' },
        { name: 'BAN', value: 'ban' },
        { name: 'BAN解除', value: 'unBan' },
        { name: 'ロール譲渡', value: 'addRole' },
        { name: 'ロール剥奪', value: 'removeRole' },
        { name: 'ロール作成', value: 'createRole' },
        { name: 'ロール編集', value: 'editRole' },
        { name: 'ロール削除', value: 'deleteRole' },
        { name: 'チャンネル作成', value: 'createChannel' },
        { name: 'チャンネル編集', value: 'editChannel' },
        { name: 'チャンネル削除', value: 'deleteChannel' },
        { name: 'ボットBAN', value: 'botBan' },
        { name: 'アップデートログ', value: 'updateLog' },
        { name: 'サーバー退出', value: 'serverLeave' },
        { name: 'カスタムメッセージ', value: 'customMessage' },
        { name: 'サーバー確認', value: 'checkServer' },
        { name: 'サーバーリスト', value: 'serverList' },
        { name: 'メッセージクリア', value: 'messageClear' },
        { name: 'メッセージ削除', value: 'messageDelete' },
        { name: 'イベント作成', value: 'createEvent' },
        { name: 'イベント削除', value: 'deleteEvent' },
        { name: 'ニックネーム設定', value: 'setNick' }
      )
  );

export async function execute(interaction) {
  const adminId = 'YOUR_USER_ID';
  if (interaction.user.id !== adminId) {
    return await interaction.reply({
      content: 'このコマンドはボット管理者専用です。',
      ephemeral: true,
    });
  }
  const type = interaction.options.getString('type');
  const modal = new ModalBuilder()
    .setCustomId(`admin_${type}`)
    .setTitle(`${type} 操作`);
  const inputs = [];
  switch (type) {
    case 'timeOut':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('userId')
          .setLabel('ユーザーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('duration')
          .setLabel('タイムアウト時間（秒）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'unTimeOut':
    case 'kick':
    case 'ban':
    case 'unBan':
    case 'addRole':
    case 'removeRole':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('userId')
          .setLabel('ユーザーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('理由（任意）')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      );
      if (['addRole', 'removeRole'].includes(type)) {
        inputs.push(
          new TextInputBuilder()
            .setCustomId('roleId')
            .setLabel('ロールID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        );
      }
      break;
    case 'createRole':
    case 'editRole':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('roleId')
          .setLabel('ロールID（編集時のみ）')
          .setStyle(TextInputStyle.Short)
          .setRequired(type === 'editRole'),
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('ロール名')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('color')
          .setLabel('カラーコード（例: #FF0000）')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      );
      break;
    case 'deleteRole':
    case 'deleteChannel':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('targetId')
          .setLabel(`${type === 'deleteRole' ? 'ロールID' : 'チャンネルID'}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'createChannel':
    case 'editChannel':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('channelId')
          .setLabel('チャンネルID（編集時のみ）')
          .setStyle(TextInputStyle.Short)
          .setRequired(type === 'editChannel'),
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('チャンネル名')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'botBan':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('enabled')
          .setLabel('有効/無効（true/false）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('target')
          .setLabel('対象（ユーザーIDまたはサーバーID）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('type')
          .setLabel('対象の種類（user/server）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'updateLog':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('message')
          .setLabel('送信するメッセージ')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      );
      break;
    case 'serverLeave':
    case 'checkServer':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'serverList':
      break;
    case 'messageClear':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('channelId')
          .setLabel('チャンネルID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('count')
          .setLabel('削除するメッセージ数')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('regex')
          .setLabel('正規表現（任意）')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      );
      break;
    case 'messageDelete':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('channelId')
          .setLabel('チャンネルID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('messageId')
          .setLabel('メッセージID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'createEvent':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('channelId')
          .setLabel('チャンネルID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('イベント名')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel('イベントの説明')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('time')
          .setLabel('時間（ISO形式: YYYY-MM-DDTHH:MM:SSZ）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'deleteEvent':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('eventId')
          .setLabel('イベントID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'setNick':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('serverId')
          .setLabel('サーバーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('userId')
          .setLabel('ユーザーID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('nickname')
          .setLabel('ニックネーム')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      );
      break;
    case 'customMessage':
      inputs.push(
        new TextInputBuilder()
          .setCustomId('count')
          .setLabel('メッセージ数')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('mode')
          .setLabel('送信モード')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('interval')
          .setLabel('メッセージ間隔')
          .setStyle(TextInputStyle.Short)
          .setRequired(false),
        new TextInputBuilder()
          .setCustomId('message1')
          .setLabel('メッセージ')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false),
        new TextInputBuilder()
          .setCustomId('embed_title_1')
          .setLabel('埋め込みタイトル')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      );
      break;
  }
  if (inputs.length > 0) {
    inputs.slice(0, 5).forEach(input => {
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });
    await interaction.showModal(modal);
  } else {
    await handleOperation(interaction, type, {});
  }
}

export async function modalSubmit(interaction) {
  const type = interaction.customId.split('_')[1];
  const fields = Object.fromEntries(
    interaction.fields.fields.map(field => [field.customId, field.value])
  );
  await handleOperation(interaction, type, fields);
}

async function handleOperation(interaction, type, fields) {
  try {
    await interaction.deferReply({ ephemeral: true });
    const client = interaction.client;
    let guild, member, role, channel;
    switch (type) {
      case 'timeOut':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        await member.timeout(parseInt(fields.duration) * 1000, fields.reason || '理由なし');
        await interaction.editReply({ content: `ユーザー ${member.user.tag} をタイムアウトしました。` });
        break;
      case 'unTimeOut':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        await member.timeout(null, fields.reason || '理由なし');
        await interaction.editReply({ content: `ユーザー ${member.user.tag} のタイムアウトを解除しました。` });
        break;
      case 'kick':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        await member.kick(fields.reason || '理由なし');
        await interaction.editReply({ content: `ユーザー ${member.user.tag} をキックしました。` });
        break;
      case 'ban':
        guild = await client.guilds.fetch(fields.serverId);
        await guild.bans.create(fields.userId, { reason: fields.reason || '理由なし' });
        await interaction.editReply({ content: `ユーザーID ${fields.userId} をBANしました。` });
        break;
      case 'unBan':
        guild = await client.guilds.fetch(fields.serverId);
        await guild.bans.remove(fields.userId, fields.reason || '理由なし');
        await interaction.editReply({ content: `ユーザーID ${fields.userId} のBANを解除しました。` });
        break;
      case 'addRole':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        role = await guild.roles.fetch(fields.roleId);
        await member.roles.add(role);
        await interaction.editReply({ content: `ユーザー ${member.user.tag} にロール ${role.name} を追加しました。` });
        break;
      case 'removeRole':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        role = await guild.roles.fetch(fields.roleId);
        await member.roles.remove(role);
        await interaction.editReply({ content: `ユーザー ${member.user.tag} からロール ${role.name} を削除しました。` });
        break;
      case 'createRole':
        guild = await client.guilds.fetch(fields.serverId);
        role = await guild.roles.create({
          name: fields.name,
          color: fields.color || undefined,
        });
        await interaction.editReply({ content: `ロール ${role.name} を作成しました。` });
        break;
      case 'editRole':
        guild = await client.guilds.fetch(fields.serverId);
        role = await guild.roles.fetch(fields.roleId);
        await role.edit({
          name: fields.name,
          color: fields.color || undefined,
        });
        await interaction.editReply({ content: `ロール ${role.name} を編集しました。` });
        break;
      case 'deleteRole':
        guild = await client.guilds.fetch(fields.serverId);
        role = await guild.roles.fetch(fields.targetId);
        await role.delete();
        await interaction.editReply({ content: `ロール ${role.name} を削除しました。` });
        break;
      case 'createChannel':
        guild = await client.guilds.fetch(fields.serverId);
        channel = await guild.channels.create({
          name: fields.name,
          type: 0,
        });
        await interaction.editReply({ content: `チャンネル ${channel.name} を作成しました。` });
        break;
      case 'editChannel':
        guild = await client.guilds.fetch(fields.serverId);
        channel = await guild.channels.fetch(fields.channelId);
        await channel.edit({ name: fields.name });
        await interaction.editReply({ content: `チャンネル ${channel.name} を編集しました。` });
        break;
      case 'deleteChannel':
        guild = await client.guilds.fetch(fields.serverId);
        channel = await guild.channels.fetch(fields.targetId);
        await channel.delete();
        await interaction.editReply({ content: `チャンネル ${channel.name} を削除しました。` });
        break;
      case 'botBan':
        const config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
        if (!config.botban) config.botban = { users: {}, servers: {} };
        if (fields.type === 'user') {
          config.botban.users[fields.target] = fields.enabled === 'true';
        } else if (fields.type === 'server') {
          config.botban.servers[fields.target] = fields.enabled === 'true';
        }
        fs.writeFileSync('./new/config.json', JSON.stringify(config, null, 2));
        await interaction.editReply({
          content: `ボットBAN（${fields.type}: ${fields.target}）を${fields.enabled === 'true' ? '有効' : '無効'}にしました。`,
        });
        break;
      case 'updateLog':
        const webhookUrl = 'https://discord.com/api/webhooks/1393142638626078820/SOJgI3xCLyUqXVdGRfspxNPa6cgruO9KsHMxlfQb-Sy0z9q9LZSx12Y3HbqcLWa8Lv9n';
        await axios.post(webhookUrl, {
          content: fields.message,
          username: 'Bot Announce',
          avatar_url: '',
        });
        await interaction.editReply({ content: 'メッセージをWebhookで送信しました！' });
        break;
      case 'serverLeave':
        guild = await client.guilds.fetch(fields.serverId);
        await guild.leave();
        await interaction.editReply({ content: `サーバー ${guild.name} から退出しました。` });
        break;
      case 'customMessage':
        const customMessages = [fields.message1].filter(Boolean);
        const embeds = [{ title: fields.embed_title_1, description: undefined }];
        const buttons = [];
        const interval = parseFloat(fields.interval) || 0.1;
        const count = parseInt(fields.count);
        const mode = fields.mode;

        if (customMessages.length === 0) {
          await interaction.editReply({ content: '少なくとも1つのメッセージを指定してください。', ephemeral: true });
          return;
        }
        await interaction.editReply({
          content: `送信を開始します。\nDEV｜メッセージ間隔: ${interval}秒`,
          ephemeral: true,
        });
        await sendMessages(interaction, count, mode, interval, customMessages, embeds, buttons);
        break;
      case 'checkServer':
        guild = await client.guilds.fetch(fields.serverId).catch(() => null);
        if (guild) {
          await interaction.editReply({ content: `ボットはサーバー ${guild.name} に参加しています！` });
        } else {
          await interaction.editReply({ content: `ボットはサーバーID ${fields.serverId} に参加していません。` });
        }
        break;
      case 'serverList':
        const guilds = client.guilds.cache
          .filter(guild => guild.memberCount > 30)
          .sort((a, b) => b.memberCount - a.memberCount);
        const guildList = await Promise.all(
          guilds.map(async guild => {
            let inviteLink = '招待リンク生成不可';
            try {
              if (guild.members.me.permissions.has(PermissionFlagsBits.CreateInstantInvite)) {
                const invite = await guild.channels.cache
                  .find(channel => channel.isTextBased())
                  ?.createInvite({ maxAge: 0, maxUses: 0 });
                inviteLink = invite ? invite.url : '招待リンク生成不可';
              }
            } catch (error) {
              console.error(`招待リンク生成エラー (${guild.name}):`, error);
            }
            return `**${guild.name}** (ID: ${guild.id})\nメンバー数: ${guild.memberCount}\n招待リンク: ${inviteLink}`;
          })
        );
        const embed = {
          title: 'ボットが参加しているサーバー',
          description: guildList.join('\n\n').slice(0, 4096) || '100人を超えるサーバーはありません。',
          color: 0x00ff00,
          timestamp: new Date(),
        };
        await interaction.editReply({ embeds: [embed] });
        break;
      case 'messageClear':
        guild = await client.guilds.fetch(fields.serverId);
        channel = await guild.channels.fetch(fields.channelId);
        const messages = await channel.messages.fetch({ limit: parseInt(fields.count) });
        if (fields.regex) {
          const regex = new RegExp(fields.regex);
          const filtered = messages.filter(msg => regex.test(msg.content));
          await channel.bulkDelete(filtered);
        } else {
          await channel.bulkDelete(messages);
        }
        await interaction.editReply({ content: `メッセージをクリアしました。` });
        break;
      case 'messageDelete':
        guild = await client.guilds.fetch(fields.serverId);
        channel = await guild.channels.fetch(fields.channelId);
        await channel.messages.delete(fields.messageId);
        await interaction.editReply({ content: `メッセージID ${fields.messageId} を削除しました。` });
        break;
      case 'createEvent':
        guild = await client.guilds.fetch(fields.serverId);
        await guild.scheduledEvents.create({
          name: fields.name,
          scheduledStartTime: new Date(fields.time),
          privacyLevel: 2,
          entityType: 3,
          description: fields.description,
          entityMetadata: { location: 'External' },
        });
        await interaction.editReply({ content: `イベント ${fields.name} を作成しました。` });
        break;
      case 'deleteEvent':
        guild = await client.guilds.fetch(fields.serverId);
        await guild.scheduledEvents.delete(fields.eventId);
        await interaction.editReply({ content: `イベントID ${fields.eventId} を削除しました。` });
        break;
      case 'setNick':
        guild = await client.guilds.fetch(fields.serverId);
        member = await guild.members.fetch(fields.userId);
        await member.setNickname(fields.nickname);
        await interaction.editReply({ content: `ユーザー ${member.user.tag} のニックネームを ${fields.nickname} に設定しました。` });
        break;
    }
  } catch (error) {
    console.error(`${type} 操作エラー:`, error);
    await interaction.editReply({ content: `エラーが発生しました: ${error.message}`, ephemeral: true });
  }
}
