import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getShopPanels, addShopPanel, getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('create_shop_panel')
  .setDescription('ロール購入パネルを作成します')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('パネルを作成するチャンネル')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('role1')
      .setDescription('ロール1')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('price1')
      .setDescription('ロール1の価格（コイン）')
      .setRequired(false)
      .setMinValue(1))
  .addRoleOption(option =>
    option.setName('role2')
      .setDescription('ロール2')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('price2')
      .setDescription('ロール2の価格（コイン）')
      .setRequired(false)
      .setMinValue(1))
  .addRoleOption(option =>
    option.setName('role3')
      .setDescription('ロール3')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('price3')
      .setDescription('ロール3の価格（コイン）')
      .setRequired(false)
      .setMinValue(1))
  .addRoleOption(option =>
    option.setName('role4')
      .setDescription('ロール4')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('price4')
      .setDescription('ロール4の価格（コイン）')
      .setRequired(false)
      .setMinValue(1))
  .addRoleOption(option =>
    option.setName('role5')
      .setDescription('ロール5')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('price5')
      .setDescription('ロール5の価格（コイン）')
      .setRequired(false)
      .setMinValue(1))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const channel = interaction.options.getChannel('channel');
  const guildId = interaction.guild.id;
  const channelId = channel.id;
  const roles = [];
  for (let i = 1; i <= 5; i++) {
    const role = interaction.options.getRole(`role${i}`);
    const price = interaction.options.getInteger(`price${i}`);
    if (role && price) {
      roles.push({ roleId: role.id, price, name: role.name });
    } else if (role && !price) {
      return interaction.editReply({
        content: `ロール${i}の価格を指定してください！`,
        ephemeral: true,
      });
    } else if (!role && price) {
      return interaction.editReply({
        content: `価格${i}に対応するロールを指定してください！`,
        ephemeral: true,
      });
    }
  }
  if (roles.length === 0) {
    return interaction.editReply({
      content: '少なくとも1つのロールと価格を指定してください！',
      ephemeral: true,
    });
  }
  const panels = getShopPanels(guildId, channelId);
  if (panels.length >= 15) {
    return interaction.editReply({
      content: `このチャンネルにはすでに15個のパネルがあります！これ以上作成できません。`,
      ephemeral: true,
    });
  }
  try {
    const embed = {
      title: 'ロールショップ',
      description: roles.map(r => `<@&${r.roleId}> - ${r.price} コイン`).join('\n'),
      color: 0x00ff00,
    };
    const components = [
      new ActionRowBuilder().addComponents(
        roles.map(r =>
          new ButtonBuilder()
            .setCustomId(`shop_buy_${r.roleId}`)
            .setLabel(r.name) 
            .setStyle(ButtonStyle.Primary)
        )
      ),
    ];
    const message = await channel.send({ embeds: [embed], components });
    const panelData = {
      messageId: message.id,
      roles,
    };
    addShopPanel(guildId, channelId, panelData);
    await interaction.editReply({
      content: `ロールショップパネルを ${channel} に作成しました！`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error creating role shop:', error);
    await interaction.editReply({
      content: 'パネルの作成中にエラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    });
  }
}
