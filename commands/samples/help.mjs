import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('ヘルプ | Help')
  .addStringOption(option =>
    option.setName('lang')
      .setDescription('言語')
      .setRequired(true) // 必須オプション
      .addChoices(
        { name: 'ja_JP', value: 'jp' },
        { name: 'en_US', value: 'us' }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const messageType = interaction.options.getString('lang');
  let response;
  switch (messageType) {
    case 'jp':
      response = '<:picture_emoji:1359395245372084224> 当ボットはサーバーを便利にするために制作されています\n\nサポートサーバー\nhttps://discord.gg/KfEGntx2jA\n\n機能\n・全ての特殊な方法対応の招待リンク検知\n・Anti-Nuke , Anti-Raid , Anti-Spam\n・トークンブロック\n・便利な管理コマンド\n・ミニゲームコマンド\n・通貨機能\n・その他いろいろな便利機能\n\nサーバーに導入したら </setup anti-troll:1366577035396513794>  , </setup permission:1366577035396513794> コマンドを使用してください。\n\nサーバーでの荒らし対策機能で管理者も制限を受けるため、</setup whitelist:1366577035396513794>でホワイトリストに入れてください\n\nボットのロールを一番上にすることを推奨します。';
      break;
    case 'us':
      response = '<:picture_emoji:1359395245372084224> This bot is made to make your server more convenient\n\nSupport server\nhttps://discord.gg/KfEGntx2jA\n\nFeatures\n・Invite link detection for special methods\n・Anti-Nuke, Anti-Raid, Anti-Spam\n・Token block\n・Useful management commands\n・Minigame commands\n・Currency function\n・Various other useful functions\n\nAfter installing it on your server, please use the commands </setup anti-troll:1366577035396513794> , </setup permission:1366577035396513794>. \n\nAdministrators are also restricted by the anti-troll function on the server, so please add them to the whitelist with </setup whitelist:1366577035396513794>\n\nWe recommend putting the bot role at the top.';
      break;
    default:
      response = 'Unknown';
  }
  await interaction.editReply(response);
}
