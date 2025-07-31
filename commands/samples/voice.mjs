import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';

export const data = new SlashCommandBuilder()
  .setName('voice')
  .setDescription('ボイスチャンネル関連のコマンド')
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers | PermissionFlagsBits.MuteMembers)
  .addSubcommand(subcommand =>
    subcommand
      .setName('kick')
      .setDescription('指定したユーザーをボイスチャンネルから退出させる')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('退出させるユーザー')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('allkick')
      .setDescription('指定したボイスチャンネルの全員を退出させる')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('対象のボイスチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('move')
      .setDescription('指定したユーザーを別のボイスチャンネルに移動させる')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('移動させるユーザー')
          .setRequired(true)
      )
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('移動先のボイスチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('in')
      .setDescription('ボットを指定したボイスチャンネルに参加させる')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('参加するボイスチャンネル')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leave')
      .setDescription('ボットをボイスチャンネルから退出させる')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('mute')
      .setDescription('指定したユーザーをボイスチャンネルでミュート/ミュート解除する')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('ミュート/ミュート解除するユーザー')
          .setRequired(true)
      )
      .addBooleanOption(option =>
        option
          .setName('mute')
          .setDescription('ミュートする（true）か解除する（false）')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const subcommand = interaction.options.getSubcommand();
  const embed = new EmbedBuilder().setColor('#0099ff');
  try {
    switch (subcommand) {
      case 'kick': {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          embed.setDescription('指定したユーザーがサーバーにいません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        if (!member.voice.channel) {
          embed.setDescription(`${user.tag} はボイスチャンネルに参加していません。`).setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        await member.voice.disconnect('Kicked by voice command').catch(error => {
          if (error.code === 40032) {
            throw new Error('Target user is not connected to voice.');
          }
          throw error;
        });
        embed.setDescription(`${user.tag} をボイスチャンネルから退出させました。`);
        break;
      }
      case 'allkick': {
        const channel = interaction.options.getChannel('channel');
        if (!channel.isVoiceBased()) {
          embed.setDescription('指定したチャンネルはボイスチャンネルではありません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        const members = channel.members;
        if (members.size === 0) {
          embed.setDescription('指定したボイスチャンネルに誰もいません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        for (const [, member] of members) {
          await member.voice.disconnect('Kicked by voice allkick command').catch(error => {
            if (error.code === 40032) {
              console.warn(`${member.user.tag} is not connected to voice. Skipping.`);
            } else {
              throw error;
            }
          });
        }
        embed.setDescription(`${channel.name} の全員を退出させました。`);
        break;
      }
      case 'move': {
        const user = interaction.options.getUser('user');
        const channel = interaction.options.getChannel('channel');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          embed.setDescription('指定したユーザーがサーバーにいません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        if (!channel.isVoiceBased()) {
          embed.setDescription('指定したチャンネルはボイスチャンネルではありません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        if (!member.voice.channel) {
          embed.setDescription(`${user.tag} はボイスチャンネルに参加していません。`).setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        await member.voice.setChannel(channel, 'Moved by voice command').catch(error => {
          if (error.code === 40032) {
            throw new Error('Target user is not connected to voice.');
          }
          throw error;
        });
        embed.setDescription(`${user.tag} を ${channel.name} に移動しました。`);
        break;
      }
      case 'in': {
        const channel = interaction.options.getChannel('channel');
        if (!channel.isVoiceBased()) {
          embed.setDescription('指定したチャンネルはボイスチャンネルではありません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember) {
          embed.setDescription('ボットのメンバー情報が取得できませんでした。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        if (botMember.voice.channel?.id === channel.id) {
          embed.setDescription(`ボットはすでに ${channel.name} に参加しています。`).setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        try {
          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          });
          connection.on(VoiceConnectionStatus.Ready, () => {
            embed.setDescription(`${channel.name} に参加しました。`);
            interaction.editReply({ embeds: [embed] });
          });
          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            embed.setDescription('ボイスチャンネルから切断されました。').setColor('#ff0000');
            await interaction.followUp({ embeds: [embed], ephemeral: true });
          });
          connection.on('error', error => {
            console.error('Voice connection error:', error);
            embed.setDescription('ボイスチャンネルへの接続中にエラーが発生しました。').setColor('#ff0000');
            interaction.editReply({ embeds: [embed], ephemeral: true });
          });
          return;
        } catch (error) {
          console.error('Voice connection error:', error);
          throw new Error('Failed to join voice channel.');
        }
      }
      case 'leave': {
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember) {
          embed.setDescription('ボットのメンバー情報が取得できませんでした。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection || !botMember.voice.channel) {
          embed.setDescription('ボットはボイスチャンネルに参加していません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        try {
          connection.destroy();
          embed.setDescription('ボイスチャンネルから退出しました。');
        } catch (error) {
          console.error('Error disconnecting from voice channel:', error);
          throw new Error('Failed to disconnect from voice channel.');
        }
        break;
      }
      case 'mute': {
        const user = interaction.options.getUser('user');
        const mute = interaction.options.getBoolean('mute');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          embed.setDescription('指定したユーザーがサーバーにいません。').setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        if (!member.voice.channel) {
          embed.setDescription(`${user.tag} はボイスチャンネルに参加していません。`).setColor('#ff0000');
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        await member.voice.setMute(mute, `Muted by voice command: ${mute ? 'mute' : 'unmute'}`).catch(error => {
          if (error.code === 40032) {
            throw new Error('Target user is not connected to voice.');
          }
          throw error;
        });
        embed.setDescription(`${user.tag} を${mute ? 'ミュート' : 'ミュート解除'}しました。`);
        break;
      }
    }
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in voice command:', error);
    if (error.message.includes('Target user is not connected to voice')) {
      embed.setDescription('指定したユーザーはボイスチャンネルに接続していません。').setColor('#ff0000');
    } else if (error.code === 50013) {
      embed.setDescription('ボットに必要な権限がありません。以下の権限を確認してください：\n- メンバーを移動\n- メンバーをミュート').setColor('#ff0000');
    } else if (error.message.includes('Failed to join voice channel')) {
      embed.setDescription('ボイスチャンネルに参加できませんでした。ボットの権限（接続、発言）を確認してください。').setColor('#ff0000');
    } else if (error.message.includes('Failed to disconnect from voice channel')) {
      embed.setDescription('ボイスチャンネルから退出できませんでした。ボットの状態を確認してください。').setColor('#ff0000');
    } else {
      embed.setDescription('エラーが発生しました。後でもう一度お試しください。').setColor('#ff0000');
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}
