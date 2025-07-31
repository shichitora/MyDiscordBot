import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('automod_msg_block')
  .setDescription('AutoModルールを作成します')
  .addStringOption(option =>
    option
      .setName('keyword')
      .setDescription('フィルタリングするキーワード')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.editReply({
        content: 'このコマンドを使用するにはサーバー管理権限が必要です。',
        ephemeral: true,
      });
      return;
    }
    const keyword = interaction.options.getString('keyword');
    await interaction.guild.autoModerationRules.create({
      name: `キーワードフィルター: ${keyword}`,
      eventType: 1,
      triggerType: 1,
      triggerMetadata: {
        keywordFilter: [keyword],
      },
      actions: [
        {
          type: 1,
          metadata: {
            customMessage: `${keyword} を含むメッセージは許可されていません。`,
          },
        },
        {
          type: 2,
          metadata: {
            channel: interaction.channel.id,
          },
        },
      ],
      enabled: true,
    });
    await interaction.editReply({
      content: `AutoModルールが作成されました！キーワード: ${keyword}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('AutoModルール作成エラー:', error);
    await interaction.editReply({
      content: 'AutoModルールの作成中にエラーが発生しました。',
      ephemeral: true,
    });
  }
}
