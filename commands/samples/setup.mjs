import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('ボットの設定を行います')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName('anti-troll')
      .setDescription('荒らし対策設定')
      .addStringOption(option =>
        option
          .setName('rule')
          .setDescription('設定するルール')
          .setRequired(true)
          .addChoices(
            { name: '招待リンク/InviteLink', value: 'invite_link' },
            { name: '特殊文字リンク/SpecialWordLink', value: 'special_word_link' },
            { name: '超特殊文字リンク/SuperSpecialWordLink', value: 'super_special_word_link' },
            { name: 'リダイレクトリンク/RedirectLink', value: 'redirect_link' },
            { name: 'チャットコマンド/ChatCommand', value: 'bot_chat_cmd' },
            { name: '改行リンク/LineLink', value: 'line_link' },
            { name: 'エンコードリンク/EncodeLink', value: 'encode_link' },
            { name: '短縮リンクと掲示板リンク/ShortAndBoardLink', value: 'short_and_board_link' },
            { name: 'テンプレリンク/TemplateLink', value: 'template_link' },
            { name: 'トークン/Token', value: 'token' },
            { name: 'メンション制限/MentionRule', value: 'mention' },
            { name: 'ボットの招待/BotInviteLink', value: 'bot_invite_link' },
            { name: 'リアクションスパムと絵文字制限/ReactionSpamAndEmojiRule', value: 'emoji_limit' },
            { name: '危険なサイト/DangerSiteLink', value: 'danger_site' },
            { name: 'スポイラースパム/SpoilerSpam', value: 'spoiler_spam' },
            { name: 'コマンドリンク/CommandLink', value: 'command_link' },
            { name: '迷惑行為(改行制限など)/AnnoyingBehavior', value: 'anti_sb' },
            { name: '合字リンク/LigatureLink', value: 'ligature_link' },
            { name: 'マークダウン形式リンク/MarkdownLink', value: 'markdown' },
            { name: 'スパム/Spam', value: 'spam' },
            { name: 'ニューク/Nuke', value: 'nuke' },
            { name: 'レイド/Raid', value: 'raid' },
            { name: '重複メッセージ/Duplicate', value: 'duplicate' },
            { name: 'スレッド作成制限/ThreadSpam', value: 'thread_limit' }
          )
      )
      .addBooleanOption(option =>
        option
          .setName('enabled')
          .setDescription('ルールを有効/無効にする')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('limit')
          .setDescription('スレッドスパムとリアクションスパムのみ(5秒間の回数指定)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(10)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('log')
      .setDescription('ログチャンネルを設定')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('ログを送信するチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('whitelist')
      .setDescription('ホワイトリストの管理')
      .addStringOption(option =>
        option
          .setName('action')
          .setDescription('追加または削除')
          .setRequired(true)
          .addChoices(
            { name: '追加', value: 'add' },
            { name: '削除', value: 'remove' }
          )
      )
      .addChannelOption(option =>
        option.setName('channel').setDescription('ホワイトリストに追加/削除するチャンネル').setRequired(false)
      )
      .addRoleOption(option =>
        option.setName('role').setDescription('ホワイトリストに追加/削除するロール').setRequired(false)
      )
      .addUserOption(option =>
        option.setName('member').setDescription('ホワイトリストに追加/削除するメンバー').setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('block')
      .setDescription('ブロック設定')
      .addBooleanOption(option => option.setName('enabled').setDescription('ブロックを有効/無効にする').setRequired(true))
      .addIntegerOption(option => option.setName('timeout').setDescription('タイムアウト時間（秒）').setRequired(false))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('point')
      .setDescription('違反ポイントの設定')
      .addStringOption(option =>
        option
          .setName('rule')
          .setDescription('ポイントを設定するルール')
          .setRequired(true)
          .addChoices(
            { name: '招待リンク/InviteLink', value: 'invite_link' },
            { name: '特殊文字リンク/SpecialWordLink', value: 'special_word_link' },
            { name: '超特殊文字リンク/SuperSpecialWordLink', value: 'super_special_word_link' },
            { name: 'リダイレクトリンク/RedirectLink', value: 'redirect_link' },
            { name: 'チャットコマンド/ChatCommand', value: 'bot_chat_cmd' },
            { name: '改行リンク/LineLink', value: 'line_link' },
            { name: 'エンコードリンク/EncodeLink', value: 'encode_link' },
            { name: '短縮リンクと掲示板リンク/ShortAndBoardLink', value: 'short_and_board_link' },
            { name: 'テンプレリンク/TemplateLink', value: 'template_link' },
            { name: 'トークン/Token', value: 'token' },
            { name: 'メンション制限/MentionRule', value: 'mention' },
            { name: 'ボットの招待/BotInviteLink', value: 'bot_invite_link' },
            { name: 'リアクションスパムと絵文字制限/ReactionSpamAndEmojiRule', value: 'emoji_limit' },
            { name: '危険なサイト/DangerSiteLink', value: 'danger_site' },
            { name: 'スポイラースパム/SpoilerSpam', value: 'spoiler_spam' },
            { name: 'コマンドリンク/CommandLink', value: 'command_link' },
            { name: '迷惑行為(改行制限など)/AnnoyingBehavior', value: 'anti_sb' },
            { name: '合字リンク/LigatureLink', value: 'ligature_link' },
            { name: 'マークダウン形式リンク/MarkdownLink', value: 'markdown' },
            { name: 'スパム/Spam', value: 'spam' },
            { name: 'ニューク/Nuke', value: 'nuke' },
            { name: 'レイド/Raid', value: 'raid' },
            { name: '重複メッセージ/Duplicate', value: 'duplicate' },
            { name: 'スレッド作成制限/ThreadSpam', value: 'thread_limit' }
          )
      )
      .addIntegerOption(option =>
        option
          .setName('points')
          .setDescription('割り当てるポイント')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('thresholds')
      .setDescription('違反ポイント閾値と処罰の設定')
      .addIntegerOption(option =>
        option
          .setName('points')
          .setDescription('閾値となる違反ポイント数')
          .setRequired(true)
          .setMinValue(1)
      )
      .addStringOption(option =>
        option
          .setName('action')
          .setDescription('閾値到達時の処罰')
          .setRequired(true)
          .addChoices(
            { name: 'タイムアウト', value: 'timeout' },
            { name: 'キック', value: 'kick' },
            { name: 'BAN', value: 'ban' },
            { name: 'なし（削除）', value: 'none' }
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('duplicate')
      .setDescription('重複メッセージブロック設定')
      .addBooleanOption(option =>
        option
          .setName('enabled')
          .setDescription('重複メッセージブロックを有効/無効にする')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option
          .setName('similarity')
          .setDescription('メッセージの類似度閾値（0.5～1.0）')
          .setRequired(false)
          .setMinValue(0.5)
          .setMaxValue(1.0)
      )
      .addIntegerOption(option =>
        option
          .setName('timeframe')
          .setDescription('検知する時間枠（秒、5～60）')
          .setRequired(false)
          .setMinValue(5)
          .setMaxValue(60)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('permission')
      .setDescription('荒らし対策のためのロールおよびチャンネルの権限を更新')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('ticket')
      .setDescription('チケットパネルの設定')
      .addChannelOption(option => option.setName('category').setDescription('チケットチャンネルのカテゴリ').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('パネルの説明').setRequired(true))
      .addStringOption(option => option.setName('custom_id').setDescription('パネルのカスタムID').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('verify')
      .setDescription('認証パネルの設定')
      .addRoleOption(option => option.setName('role').setDescription('割り当てるロール').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('パネルの説明').setRequired(true))
      .addStringOption(option => option.setName('custom_id').setDescription('パネルのカスタムID').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('rolepanel')
      .setDescription('ロールパネルの設定')
      .addStringOption(option => option.setName('roles').setDescription('カンマ区切りのロールID').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('パネルの説明').setRequired(true))
      .addStringOption(option => option.setName('custom_id').setDescription('パネルのカスタムID').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('welcome')
      .setDescription('入退室通知チャンネルを設定')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('入退室通知を送信するチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('mute')
      .setDescription('ミュートロールの設定または解除')
      .addStringOption(option =>
        option
          .setName('action')
          .setDescription('設定または解除')
          .setRequired(true)
          .addChoices(
            { name: '設定', value: 'set' },
            { name: '解除', value: 'unset' }
          )
      )
      .addRoleOption(option =>
        option
          .setName('role')
          .setDescription('ミュートロール（設定時のみ必要）')
          .setRequired(false)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild.members.me.permissions.has(['SendMessages', 'ManageRoles', 'ManageChannels', 'ModerateMembers'])) {
    await interaction.editReply({
      content: 'ボットに必要な権限（メッセージ送信、ロール管理、チャンネル管理、メンバー管理）がありません！',
      ephemeral: true,
    });
    return;
  }
  const guildId = interaction.guildId;
  const settingsPath = path.join(process.cwd(), 'settings.json');
  let settings;
  try {
    const data = await readFile(settingsPath);
    settings = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      settings = { guilds: {} };
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    } else {
      console.error('Error reading settings.json:', err);
      await interaction.editReply({
        content: '設定の読み込みに失敗しました。',
        ephemeral: true,
      });
      return;
    }
  }
  if (!settings.guilds[guildId]) {
    settings.guilds[guildId] = {
      antiTroll: { enabled: false, rules: {} },
      logChannel: null,
      whitelist: { channels: [], roles: [], members: [] },
      block: { enabled: true, timeout: 600000 },
      points: { thresholds: { '10': 'timeout', '20': 'kick', '30': 'ban' } },
      duplicate: { enabled: false, similarity: 0.75, timeframe: 10000 },
      welcomeChannel: null,
      muteRoleId: null,
    };
  }
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'anti-troll') {
    const rule = interaction.options.getString('rule');
    const enabled = interaction.options.getBoolean('enabled');
    const limit = interaction.options.getInteger('limit');
    if (['thread_limit', 'emoji_limit'].includes(rule)) {
      if (enabled && !limit) {
        await interaction.editReply({
          content: `${rule} を有効にする場合は上限数を指定してください。`,
          ephemeral: true,
        });
        return;
      }
      settings.guilds[guildId].antiTroll.rules[rule] = { enabled, limit: limit || 2 };
    } else {
      settings.guilds[guildId].antiTroll.rules[rule] = enabled;
    }
    settings.guilds[guildId].antiTroll.enabled = Object.values(settings.guilds[guildId].antiTroll.rules).some(
      v => typeof v === 'object' ? v.enabled : v
    );
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `ルール ${rule} を ${enabled ? '有効' : '無効'} にしました${limit ? `（上限: ${limit}回/5秒)` : ''}`,
      ephemeral: true,
    });
  } else if (subcommand === 'log') {
    const channel = interaction.options.getChannel('channel');
    settings.guilds[guildId].logChannel = channel.id;
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `ログチャンネルを ${channel} に設定しました`,
      ephemeral: true,
    });
  } else if (subcommand === 'whitelist') {
    const action = interaction.options.getString('action');
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const member = interaction.options.getUser('member');
    if (!channel && !role && !member) {
      await interaction.editReply({
        content: '少なくともチャンネル、ロール、メンバーのいずれかを指定してください。',
        ephemeral: true,
      });
      return;
    }
    let response = '';
    if (action === 'add') {
      if (channel && !settings.guilds[guildId].whitelist.channels.includes(channel.id)) {
        settings.guilds[guildId].whitelist.channels.push(channel.id);
        response += `チャンネル ${channel} をホワイトリストに追加しました。\n`;
      }
      if (role && !settings.guilds[guildId].whitelist.roles.includes(role.id)) {
        settings.guilds[guildId].whitelist.roles.push(role.id);
        response += `ロール ${role} をホワイトリストに追加しました。\n`;
      }
      if (member && !settings.guilds[guildId].whitelist.members.includes(member.id)) {
        settings.guilds[guildId].whitelist.members.push(member.id);
        response += `メンバー ${member} をホワイトリストに追加しました。\n`;
      }
      if (!response) {
        response = '指定された項目はすでにホワイトリストに含まれています。';
      }
    } else if (action === 'remove') {
      if (channel) {
        const index = settings.guilds[guildId].whitelist.channels.indexOf(channel.id);
        if (index !== -1) {
          settings.guilds[guildId].whitelist.channels.splice(index, 1);
          response += `チャンネル ${channel} をホワイトリストから削除しました。\n`;
        } else {
          response += `チャンネル ${channel} はホワイトリストにありません。\n`;
        }
      }
      if (role) {
        const index = settings.guilds[guildId].whitelist.roles.indexOf(role.id);
        if (index !== -1) {
          settings.guilds[guildId].whitelist.roles.splice(index, 1);
          response += `ロール ${role} をホワイトリストから削除しました。\n`;
        } else {
          response += `ロール ${role} はホワイトリストにありません。\n`;
        }
      }
      if (member) {
        const index = settings.guilds[guildId].whitelist.members.indexOf(member.id);
        if (index !== -1) {
          settings.guilds[guildId].whitelist.members.splice(index, 1);
          response += `メンバー ${member} をホワイトリストから削除しました。\n`;
        } else {
          response += `メンバー ${member} はホワイトリストにありません。\n`;
        }
      }
    }
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: response || 'ホワイトリストに変更はありませんでした。',
      ephemeral: true,
    });
  } else if (subcommand === 'block') {
    const enabled = interaction.options.getBoolean('enabled');
    const timeout = interaction.options.getInteger('timeout') * 1000 || 600000;
    settings.guilds[guildId].block.enabled = enabled;
    settings.guilds[guildId].block.timeout = timeout;
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `ブロック設定を更新: 有効=${enabled}, タイムアウト=${timeout / 1000}秒`,
      ephemeral: true,
    });
  } else if (subcommand === 'point') {
    const rule = interaction.options.getString('rule');
    const points = interaction.options.getInteger('points');
    settings.guilds[guildId].points[rule] = points;
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `${rule} に ${points} ポイントを設定しました`,
      ephemeral: true,
    });
  } else if (subcommand === 'thresholds') {
    const points = interaction.options.getInteger('points');
    const action = interaction.options.getString('action');
    if (action === 'none') {
      delete settings.guilds[guildId].points.thresholds[points];
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.editReply({
        content: `ポイント閾値 ${points} を削除しました`,
        ephemeral: true,
      });
    } else {
      settings.guilds[guildId].points.thresholds[points] = action;
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.editReply({
        content: `ポイント閾値 ${points} に処罰 ${action} を設定しました`,
        ephemeral: true,
      });
    }
  } else if (subcommand === 'duplicate') {
    const enabled = interaction.options.getBoolean('enabled');
    const similarity = interaction.options.getNumber('similarity') || 0.75;
    const timeframe = (interaction.options.getInteger('timeframe') || 10) * 1000;
    settings.guilds[guildId].duplicate = {
      enabled,
      similarity,
      timeframe,
    };
    settings.guilds[guildId].antiTroll.rules.duplicate = enabled;
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `重複メッセージブロックを ${enabled ? '有効' : '無効'} にしました（類似度: ${similarity}, 時間枠: ${timeframe / 1000}秒）`,
      ephemeral: true,
    });
  } else if (subcommand === 'permission') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.editReply({
        content: '管理者権限が必要です！',
        ephemeral: true,
      });
      return;
    }
    const guild = interaction.guild;
    let response = '権限更新結果:\n';
    let roleCount = 0,
      channelCount = 0;
    const MAX_UPDATES = 300;
    try {
      const permissionsToDeny = new PermissionsBitField([
        PermissionsBitField.Flags.UseApplicationCommands,
        PermissionsBitField.Flags.MentionEveryone,
        PermissionsBitField.Flags.UseExternalApps,
        PermissionsBitField.Flags.ManageWebhooks,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.CreatePrivateThreads,
      ]);
      for (const role of guild.roles.cache.values()) {
        if (roleCount >= MAX_UPDATES) {
          response += `- ロールの更新が上限(${MAX_UPDATES}件)に達しました\n`;
          break;
        }
        if (
          role.managed ||
          role.id === guild.id ||
          role.position >= guild.members.me.roles.highest.position
        )
          continue;
        try {
          const currentPermissions = new PermissionsBitField(role.permissions);
          const newPermissions = currentPermissions.remove(permissionsToDeny);
          if (!currentPermissions.equals(newPermissions)) {
            await role.setPermissions(newPermissions, '荒らし対策コマンドによる権限変更');
            roleCount++;
            response += `- ロール ${role.name} の権限を更新\n`;
          }
        } catch (error) {
          console.error(`ロール ${role.name} の権限変更に失敗:`, error);
          response += `- ロール ${role.name} の権限変更に失敗\n`;
        }
      }
      const channels = guild.channels.cache;
      const manageChannelsFlag = PermissionsBitField.Flags.ManageChannels;
      for (const channel of channels.values()) {
        if (channelCount >= MAX_UPDATES) {
          response += `- チャンネルの更新が上限(${MAX_UPDATES}件)に達しました\n`;
          break;
        }
        if (!channel.permissionsFor(guild.members.me).has(manageChannelsFlag)) continue;
        if (!channel.permissionOverwrites) {
          console.warn(`チャンネル ${channel.name} のpermissionOverwritesがありません`);
          continue;
        }
        try {
          await channel.permissionOverwrites.edit(
            guild.id,
            {
              [PermissionsBitField.Flags.UseApplicationCommands]: false,
              [PermissionsBitField.Flags.MentionEveryone]: false,
              [PermissionsBitField.Flags.UseExternalApps]: false,
              [PermissionsBitField.Flags.ManageWebhooks]: false,
              [PermissionsBitField.Flags.CreatePublicThreads]: false,
              [PermissionsBitField.Flags.CreatePrivateThreads]: false,
            },
            { reason: '荒らし対策コマンドによる権限変更' }
          );
          channelCount++;
          response += `- チャンネル ${channel.name} の権限を更新\n`;
        } catch (error) {
          console.error(`チャンネル ${channel.name} の権限変更に失敗:`, error);
          response += `- チャンネル ${channel.name} の権限変更に失敗\n`;
        }
      }
      response +=
        `\n合計: ${roleCount}個のロール、${channelCount}個のチャンネルの権限を更新\n` +
        `禁止した権限: コマンド使用、外部アプリ、メンション、ウェブフック、スレッド作成`;
      await interaction.editReply(response);
    } catch (error) {
      console.error('処理中にエラーが発生:', error);
      await interaction.editReply({
        content: 'エラーが発生しました。権限やロールの階層を確認してください。',
        ephemeral: true,
      });
    }
  } else if (subcommand === 'ticket') {
    const category = interaction.options.getChannel('category');
    const description = interaction.options.getString('description');
    const customId = interaction.options.getString('custom_id');
    if (category.type !== ChannelType.GuildCategory) {
      await interaction.editReply({
        content: 'カテゴリーチャンネルを選択してください。',
        ephemeral: true,
      });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('チケットシステム')
      .setDescription(description)
      .setColor('#00ff00');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_${customId}`).setLabel('チケット作成').setStyle(ButtonStyle.Primary)
    );
    try {
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.editReply({
        content: `チケットパネルを作成しました（カスタムID: ticket_${customId}）`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating ticket panel:', error);
      await interaction.editReply({
        content: 'チケットパネルの作成に失敗しました。',
        ephemeral: true,
      });
    }
  } else if (subcommand === 'verify') {
    const role = interaction.options.getRole('role');
    const description = interaction.options.getString('description');
    const customId = interaction.options.getString('custom_id');

    const embed = new EmbedBuilder()
      .setTitle('認証パネル')
      .setDescription(description)
      .setColor('#00ff00');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`verify_${customId}_${role.id}`).setLabel('認証').setStyle(ButtonStyle.Success)
    );
    try {
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.editReply({
        content: `認証パネルを作成しました（カスタムID: verify_${customId}_${role.id}）`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating verify panel:', error);
      await interaction.editReply({
        content: '認証パネルの作成に失敗しました。',
        ephemeral: true,
      });
    }
  } else if (subcommand === 'rolepanel') {
    const roleIds = interaction.options.getString('roles').split(',').map(id => id.trim());
    const description = interaction.options.getString('description');
    const customId = interaction.options.getString('custom_id');
    for (const roleId of roleIds) {
      if (!interaction.guild.roles.cache.has(roleId)) {
        await interaction.editReply({
          content: `ロールID ${roleId} が見つかりません。`,
          ephemeral: true,
        });
        return;
      }
    }
    const embed = new EmbedBuilder()
      .setTitle('ロールパネル')
      .setDescription(description)
      .setColor('#00ff00');
    const row = new ActionRowBuilder();
    roleIds.slice(0, 5).forEach(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`role_${customId}_${roleId}`)
          .setLabel(role.name)
          .setStyle(ButtonStyle.Primary)
      );
    });
    try {
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.editReply({
        content: `ロールパネルを作成しました（カスタムID: role_${customId}_*）`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating role panel:', error);
      await interaction.editReply({
        content: 'ロールパネルの作成に失敗しました。',
        ephemeral: true,
      });
    }
  } else if (subcommand === 'welcome') {
    const channel = interaction.options.getChannel('channel');
    if (channel.type !== ChannelType.GuildText) {
      await interaction.editReply({
        content: 'テキストチャンネルを選択してください。',
        ephemeral: true,
      });
      return;
    }
    settings.guilds[guildId].welcomeChannel = channel.id;
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `入退室通知チャンネルを ${channel} に設定しました`,
      ephemeral: true,
    });
  } else if (subcommand === 'mute') {
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    if (action === 'set') {
      if (!role) {
        await interaction.editReply({
          content: 'ミュートロールを設定する場合はロールを指定してください。',
          ephemeral: true,
        });
        return;
      }
      settings.guilds[guildId].muteRoleId = role.id;
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.editReply({
        content: `ミュートロールを ${role} に設定しました`,
        ephemeral: true,
      });
    } else if (action === 'unset') {
      if (settings.guilds[guildId].muteRoleId) {
        settings.guilds[guildId].muteRoleId = null;
        await writeFile(settingsPath, JSON.stringify(settings, null, 2));
        await interaction.editReply({
          content: 'ミュートロールを解除しました。',
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: 'ミュートロールは設定されていません。',
          ephemeral: true,
        });
      }
    }
  }
}
