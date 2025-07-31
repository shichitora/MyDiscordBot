import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('beta')
  .setDescription('ボットの設定を行います')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName('setup-anti-troll')
      .setDescription('荒らし対策設定(Beta版)')
      .addStringOption(option =>
        option
          .setName('rule')
          .setDescription('設定するルール')
          .setRequired(true)
          .addChoices(
            { name: 'Steamスパム/SteamSpam', value: 'steam' },
            { name: 'Glitchリンク/GlitchLink', value: 'glitch' },
            { name: '画像スパム/ImageSpam', value: 'image_spam' },
            { name: '画像サイト/ImageSite', value: 'image_site' },
            { name: 'UUID/Universally Unique Identifier', value: 'uuid' }
          )
      )
      .addBooleanOption(option =>
        option
          .setName('enabled')
          .setDescription('ルールを有効/無効にする')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    const supportGuildId = 'YOUR_SERVER_ID';
    const betaRoleId = 'YOUR_ROLE_ID';
    if (guildId === supportGuildId) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(betaRoleId)) {
            return interaction.editReply({ content: 'このコマンドはBeta版登録済みユーザーのみ実行できます。', ephemeral: true });
        }
    }
    else {
        const supportGuild = interaction.client.guilds.cache.get(supportGuildId);
        if (!supportGuild) {
          return interaction.editReply({ content: 'サポートサーバーが見つかりません。', ephemeral: true });
        }
        const supportMember = await supportGuild.members.fetch(interaction.user.id).catch(() => null);
        if (!supportMember || !supportMember.roles.cache.has(betaRoleId)) {
            return interaction.editReply({ content: 'このコマンドはBeta版登録済みユーザーのみ実行できます。', ephemeral: true });
        }
    }
  if (!interaction.guild.members.me.permissions.has(['SendMessages', 'ManageRoles', 'ManageChannels', 'ModerateMembers'])) {
    await interaction.editReply({
      content: 'ボットに必要な権限（メッセージ送信、ロール管理、チャンネル管理、メンバー管理）がありません！',
      ephemeral: true,
    });
    return;
  }
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
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'setup-anti-troll') {
    const rule = interaction.options.getString('rule');
    const enabled = interaction.options.getBoolean('enabled');
    settings.guilds[guildId].antiTroll.rules[rule] = enabled;
    settings.guilds[guildId].antiTroll.enabled = Object.values(settings.guilds[guildId].antiTroll.rules).some(v => v);
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.editReply({
      content: `ルール ${rule} を ${enabled ? '有効' : '無効'} にしました`,
      ephemeral: true,
    });
  }
}
