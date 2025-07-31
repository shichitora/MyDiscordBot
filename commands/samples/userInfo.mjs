import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
const badgeMap = {
    'hypesquad-bravery': { flags: ['HypeSquadBravery', 'HypeSquadOnlineHouse1'], type: 'userFlag', name: 'HypeSquad Bravery' },
    'hypesquad-brilliance': { flags: ['HypeSquadBrilliance', 'HypeSquadOnlineHouse2'], type: 'userFlag', name: 'HypeSquad Brilliance' },
    'hypesquad-balance': { flags: ['HypeSquadBalance', 'HypeSquadOnlineHouse3'], type: 'userFlag', name: 'HypeSquad Balance' }
    // Athor Flags
};
const badgeEmojiMap = {
    'hypesquad-bravery': '<:hypesquadbravery:1399917855364878356>',
    'hypesquad-brilliance': '<:hypesquadbrilliance:1399917875740803172>',
    'hypesquad-balance': '<:hypesquadbalance:1399917839028060270>',
    'active-developer': '<:activedeveloper:1399917592763957248>',
    'discord-staff': '<:discordstaff:1399917818622906418>',
    'bug-hunter': '<:discordbughunter1:1399917667049144510>',
    'bug-hunter-gold': '<:discordbughunter2:1399917684346327203>',
    'partner-server': '<:discordpartner:1399917784129077359>',
    'early-supporter': '<:discordearlysupporter:1399917650095898725>',
    'early-bot-developer': '<:discordbotdev:1399917569519128696>',
    'moderator-program': '<:discordmod:1399917766873583799>'
};

export const data = new SlashCommandBuilder()
    .setName('userinfo')
    .setDMPermission(true)
    .setDescription('指定したユーザーの情報を表示します')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('情報を表示するユーザー')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('id')
            .setDescription('ユーザーIDを直接指定（サーバーにいない場合用）')
            .setRequired(false));

export const execute = async (interaction) => {
    await interaction.deferReply();
    let target = interaction.options.getUser('target');
    const userIdInput = interaction.options.getString('id');
    if (!target && userIdInput) {
        try {
            target = await interaction.client.users.fetch(userIdInput, { force: true });
        } catch (error) {
            console.error('ユーザー取得エラー:', error);
            await interaction.editReply({ content: '指定されたIDのユーザーが見つかりませんでした。' });
            return;
        }
    } else if (!target) {
        target = interaction.user;
    }
    let member;
    let isInGuild = true;
    try {
        member = await interaction.guild.members.fetch(target.id);
    } catch (error) {
        isInGuild = false;
    }
    const userId = target.id;
    const displayName = isInGuild ? member.displayName : target.username;
    const nickname = isInGuild ? (member.nickname || '設定なし') : '利用不可';
    const createdAt = target.createdAt.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const joinedAt = isInGuild ? member.joinedAt.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '利用不可';
    const roleCount = isInGuild ? member.roles.cache.size - 1 : '利用不可';
    const userType = target.bot ? 'ボット' : 'ユーザー';
    const roles = isInGuild
        ? member.roles.cache
              .filter(role => role.name !== '@everyone')
              .map(role => role.name)
              .join(', ') || 'なし'
        : '利用不可';
    let lastActivity = '不明';
    if (isInGuild && member.presence) {
        const status = member.presence.status === 'online' ? 'オンライン' :
                       member.presence.status === 'idle' ? '退席中' :
                       member.presence.status === 'dnd' ? '取り込み中' : 'オフライン';
        const activities = member.presence.activities;
        const activityDetails = activities.length > 0
            ? activities.map(a => `${a.name}${a.details ? `: ${a.details}` : ''}`).join(', ')
            : 'なし';
        lastActivity = `${status} (${activityDetails})`;
    } else {
        lastActivity = 'オフラインまたは利用不可';
    }
    let lastMessage = '不明';
    try {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => m.author.id === target.id);
        if (userMessages.size > 0) {
            const lastMsg = userMessages.first();
            lastMessage = `${lastMsg.content.slice(0, 50)}${lastMsg.content.length > 50 ? '...' : ''} (${lastMsg.createdAt.toLocaleDateString('ja-JP')})`;
        }
    } catch (error) {
        console.error('最後のメッセージ取得エラー:', error);
    }
    const user = await interaction.client.users.fetch(target.id, { force: true });
    const userFlags = user.flags.toArray();
    const detectedBadges = [];
    const notDetectedBadges = [];
    for (const [badge, { flags, type, name }] of Object.entries(badgeMap)) {
        let hasBadge = false;
        if (type === 'userFlag' && flags) {
            hasBadge = flags.some(flag => userFlags.includes(flag));
        } else if (type === 'premium' && isInGuild) {
            if (badge === 'nitro' || badge === 'server-booster') {
                hasBadge = !!member.premiumSince;
            }
        }
        if (hasBadge) {
            detectedBadges.push(`${badgeEmojiMap[badge]} ${name}`);
        } else {
            notDetectedBadges.push(`${badgeEmojiMap[badge]} ${name}`); // デバッグ用
        }
    }
    console.log(`ユーザー ${target.tag} の検知されたバッジ: ${detectedBadges.map(b => b.split(' ')[1]).join(', ') || 'なし'}`);
    console.log(`ユーザー ${target.tag} の検知されなかったバッジ: ${notDetectedBadges.map(b => b.split(' ')[1]).join(', ') || 'なし'}`);
    console.log(`ユーザー ${target.tag} のUserFlags: ${userFlags.join(', ') || 'なし'}`);
    const bannerURL = user.banner ? user.bannerURL({ dynamic: true, size: 4096 }) : 'なし';
    const accentColor = user.accentColor ? `#${user.accentColor.toString(16).padStart(6, '0')}` : '設定なし';
    const avatarDecoration = user.avatarDecoration ? 'あり' : 'なし'; // Discord.js v14では詳細なデコレーション情報が制限されている
    const embed = new EmbedBuilder()
        .setTitle(`${target.tag} の情報`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setColor(user.accentColor || '#00AAFF') // ユーザーのアクセントカラーを使用、なければデフォルト
        .addFields(
            { name: 'ユーザーID', value: userId, inline: true },
            { name: '表示名', value: displayName, inline: true },
            { name: 'ニックネーム', value: nickname, inline: true },
            { name: 'アカウント作成日', value: createdAt, inline: true },
            { name: 'サーバー参加日', value: joinedAt, inline: true },
            { name: 'ロール数', value: typeof roleCount === 'number' ? `${roleCount}個` : roleCount, inline: true },
            { name: 'ユーザータイプ', value: userType, inline: true },
            { name: '最後のアクティビティ', value: lastActivity, inline: true },
            { name: '最後のメッセージ', value: lastMessage, inline: true },
            { name: 'プロフィールカラー', value: accentColor, inline: true },
            { name: 'アバターデコレーション', value: avatarDecoration, inline: true },
            { name: '所有ロール', value: roles, inline: false },
            { 
                name: '所有バッジ', 
                value: detectedBadges.length > 0 ? detectedBadges.join(', ') : 'なし',
                inline: false 
            }
        )
        .setTimestamp()
        .setFooter({ text: `リクエスト: ${interaction.user.tag}` });
    if (bannerURL !== 'なし') {
        embed.setImage(bannerURL);
    }
    if (!isInGuild) {
        embed.setDescription('※このユーザーはサーバーにいません。一部の情報は利用できません。');
    }
    await interaction.editReply({ embeds: [embed] });
};
