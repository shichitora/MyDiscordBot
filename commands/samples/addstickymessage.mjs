import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('addstickymessage')
  .setDescription('固定メッセージを追加')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('固定メッセージの内容')
      .setRequired(true))
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('対象チャンネル')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply();
  const guildId = interaction.guild.id;
  const stickies = JSON.parse(fs.readFileSync('./new/stickymessages.json', 'utf8'));
  const messageContent = interaction.options.getString('message');
  const channel = interaction.options.getChannel('channel');
  if (!stickies[guildId]) stickies[guildId] = {};
  stickies[guildId][channel.id] = { content: messageContent, lastMessageId: null };
  fs.writeFileSync('./new/stickymessages.json', JSON.stringify(stickies, null, 2));
  const message = await channel.send(messageContent);
  stickies[guildId][channel.id].lastMessageId = message.id;
  fs.writeFileSync('./new/stickymessages.json', JSON.stringify(stickies, null, 2));
  await interaction.editReply(`チャンネル${channel.name}に固定メッセージを設定しました。`);
}
