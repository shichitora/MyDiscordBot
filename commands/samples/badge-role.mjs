import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
const BADGE_FILE = './new/badge.json';
const badgeMap = {
    'hypesquad-bravery': { flags: ['HypeSquadBravery', 'HypeSquadOnlineHouse1'], type: 'userFlag', name: 'HypeSquad Bravery' },
    'hypesquad-brilliance': { flags: ['HypeSquadBrilliance', 'HypeSquadOnlineHouse2'], type: 'userFlag', name: 'HypeSquad Brilliance' },
    'hypesquad-balance': { flags: ['HypeSquadBalance', 'HypeSquadOnlineHouse3'], type: 'userFlag', name: 'HypeSquad Balance' },
    'active-developer': { flags: ['ActiveDeveloper'], type: 'userFlag', name: 'Active Developer' },
    // Other Badges Deta
};

export const data = new SlashCommandBuilder()
    .setName('badge-role')
    .setDescription('バッジに基づくロールの設定、付与、削除、確認')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('バッジに対応するロールを設定または削除')
            .addStringOption(option =>
                option
                    .setName('action')
                    .setDescription('アクションを選択')
                    .setRequired(true)
                    .addChoices(
                        { name: '追加/更新', value: 'add' },
                        { name: '削除', value: 'remove' }
                    )
            )
            .addStringOption(option =>
                option
                    .setName('badge')
                    .setDescription('設定するバッジ')
                    .setRequired(true)
                    .addChoices(
                        { name: 'HypeSquad Bravery', value: 'hypesquad-bravery' },
                        { name: 'HypeSquad Brilliance', value: 'hypesquad-brilliance' },
                        { name: 'HypeSquad Balance', value: 'hypesquad-balance' },
                        { name: 'Nitro', value: 'nitro' },
                        { name: 'Server Booster', value: 'server-booster' },
                        { name: 'Active Developer', value: 'active-developer' },
                        { name: 'Quest', value: 'quest' },
                        { name: 'Orb', value: 'orb' },
                        { name: 'Discord Staff', value: 'discord-staff' },
                        { name: 'Legacy Username', value: 'legacy-username' },
                        { name: 'Bug Hunter', value: 'bug-hunter' },
                        { name: 'Bug Hunter Gold', value: 'bug-hunter-gold' },
                        { name: 'Partner Server', value: 'partner-server' },
                        { name: 'Early Supporter', value: 'early-supporter' },
                        { name: 'Early Bot Developer', value: 'early-bot-developer' },
                        { name: 'Moderator Program', value: 'moderator-program' },
                        { name: 'HypeSquad Event', value: 'hypesquad-event' },
                        { name: 'Support Commands', value: 'support-commands' },
                        { name: 'AutoMod', value: 'automod' }
                    )
            )
            .addRoleOption(option =>
                option
                    .setName('role')
                    .setDescription('付与するロール（削除の場合は不要）')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('get')
            .setDescription('バッジに基づくロールを取得')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('バッジに基づくロールを剥奪')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('show')
            .setDescription('ユーザーのバッジとフラグを確認')
    );

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    const supportGuildId = '1352086635998613596';
    const betaRoleId = '1393158339386409010';
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
    const subcommand = interaction.options.getSubcommand();
    let badgeConfig = {};
    if (existsSync(BADGE_FILE)) {
        badgeConfig = JSON.parse(readFileSync(BADGE_FILE));
    }
    if (!badgeConfig[guildId]) {
        badgeConfig[guildId] = {};
    }
    try {
        if (subcommand === 'setup') {
            if (!interaction.member.permissions.has('ManageRoles')) {
                throw new Error('このコマンドを使用するにはロール管理権限が必要です。');
            }
            const action = interaction.options.getString('action');
            const badge = interaction.options.getString('badge');
            const role = interaction.options.getRole('role');
            if (action === 'add' && !role) {
                throw new Error('ロールの追加にはロールの指定が必要です。');
            }
            if (action === 'add') {
                badgeConfig[guildId][badge] = role.id;
                writeFileSync(BADGE_FILE, JSON.stringify(badgeConfig, null, 2));
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('バッジロール設定')
                    .setDescription(`バッジ **${badgeMap[badge].name}** にロール <@&${role.id}> を設定しました。`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else if (action === 'remove') {
                if (badgeConfig[guildId][badge]) {
                    delete badgeConfig[guildId][badge];
                    writeFileSync(BADGE_FILE, JSON.stringify(badgeConfig, null, 2));
                    const embed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('バッジロール設定削除')
                        .setDescription(`バッジ **${badgeMap[badge].name}** のロール設定を削除しました。`)
                        .setTimestamp();
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    throw new Error(`バッジ **${badgeMap[badge].name}** の設定が見つかりませんでした。`);
                }
            }
        } else if (subcommand === 'get') {
            const member = interaction.member;
            const user = await interaction.client.users.fetch(member.id, { force: true });
            const userFlags = user.flags.toArray();
            const assignedRoles = [];
            const detectedBadges = [];
            const notDetectedBadges = [];
            for (const [badge, { flags, type, name, warning }] of Object.entries(badgeMap)) {
    let hasBadge = false;
    if (type === 'userFlag' && flags) {
        hasBadge = flags.some(flag => userFlags.includes(flag));
    } else if (type === 'premium') {
        if (badge === 'nitro') {
            hasBadge = user.premiumType === 2 || user.premiumType === 1;
        } else if (badge === 'server-booster') {
            hasBadge = !!member.premiumSince;
        }
    }
    if (hasBadge) {
        detectedBadges.push(name);
        if (badgeConfig[guildId][badge]) {
            const roleId = badgeConfig[guildId][badge];
            const role = interaction.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(roleId)) {
                await member.roles.add(role);
                assignedRoles.push(role.name);
            }
        }
    } else if (warning) {
        notDetectedBadges.push(name);
    }
}
const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('バッジロール付与')
                .setDescription(
                    assignedRoles.length > 0
                        ? `以下のロールを付与しました：\n${assignedRoles.map(r => `- ${r}`).join('\n')}`
                        : '付与できるロールがありませんでした。'
                )
                .addFields(
                    { name: '検知されたバッジ', value: detectedBadges.length > 0 ? detectedBadges.join(', ') : 'なし' },
                    {
                        name: '検知されなかったバッジ',
                        value: notDetectedBadges.length > 0
                            ? `${notDetectedBadges.join(', ')}\n\n**注意**: クエスト、オーブ、レガシーユーザー名バッジが検知されない場合、以下のいずれかを試してください：\n` +
                              '- Discord.jsを最新バージョンに更新（`npm update discord.js`）\n' +
                              '- クエスト完了がプロフィールに反映されているか確認（数時間待つ場合あり）\n' +
                              '- レガシーユーザー名（#0000形式）が適用されているか確認\n' +
                              '- 管理者に手動検証（例: スクリーンショット提出）を依頼\n' +
                              '- Discordサポートにバッジの反映状況を確認'
                            : 'なし'
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'remove') {
            if (!interaction.member.permissions.has('ManageRoles')) {
                throw new Error('このコマンドを使用するにはロール管理権限が必要です。');
            }
            const member = interaction.member;
            const removedRoles = [];
            for (const [badge, roleId] of Object.entries(badgeConfig[guildId])) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role && member.roles.cache.has(roleId)) {
                    await member.roles.remove(role);
                    removedRoles.push(role.name);
                }
            }
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('バッジロール剥奪')
                .setDescription(
                    removedRoles.length > 0
                        ? `以下のロールを剥奪しました：\n${removedRoles.map(r => `- ${r}`).join('\n')}`
                        : '剥奪できるロールがありませんでした。'
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'show') {
            const member = interaction.member;
            const user = await interaction.client.users.fetch(member.id, { force: true });
            const userFlags = user.flags.toArray();
            const detectedBadges = [];
            const notDetectedBadges = [];
            for (const [badge, { flags, type, name }] of Object.entries(badgeMap)) {
                let hasBadge = false;

                if (type === 'userFlag' && flags) {
                    hasBadge = flags.some(flag => userFlags.includes(flag));
                } else if (type === 'premium') {
                    if (badge === 'nitro' || badge === 'server-booster') {
                        hasBadge = !!member.premiumSince;
                    }
                }
                if (hasBadge) {
                    detectedBadges.push(name);
                } else {
                    notDetectedBadges.push(name);
                }
            }
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('バッジ確認')
                .setDescription(`ユーザー **${member.user.tag}** のバッジとフラグ情報です。`)
                .addFields(
                    { name: '検知されたバッジ', value: detectedBadges.length > 0 ? detectedBadges.join(', ') : 'なし' },
                    { name: 'UserFlags', value: userFlags.length > 0 ? userFlags.join(', ') : 'なし' },
                    {
                        name: '検知されなかったバッジ',
                        value: notDetectedBadges.length > 0
                            ? `${notDetectedBadges.join(', ')}\n\n**注意**: クエスト、オーブ、レガシーユーザー名バッジが検知されない場合、以下のいずれかを試してください：\n` +
                              '- Discord.jsを最新バージョンに更新（`npm update discord.js`）\n' +
                              '- クエスト完了がプロフィールに反映されているか確認（数時間待つ場合あり）\n' +
                              '- レガシーユーザー名（#0000形式）が適用されているか確認\n' +
                              '- 管理者に手動検証（例: スクリーンショット提出）を依頼\n' +
                              '- Discordサポートにバッジの反映状況を確認'
                            : 'なし'
                    }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('エラー')
            .setDescription('処理中にエラーが発生しました。以下の点を確認してください：\n' +
                '- ボットにロール管理権限があるか\n' +
                '- 正しいバッジを選択しているか\n' +
                '- ロールが存在するか\n' +
                '- Discord.jsが最新バージョンか（例: 14.16.x）\n' +
                '- クエスト、オーブ、レガシーユーザー名がAPIでサポートされているか')
            .addFields({ name: 'エラーメッセージ', value: `\`\`\`${error.message}\`\`\`` })
            .setTimestamp();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
