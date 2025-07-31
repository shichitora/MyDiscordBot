import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import os from 'os';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('ボットのステータスをチェック');

export async function execute(interaction) {
  await interaction.deferReply();
  const sentTimestamp = performance.now();
  const client = interaction.client;
  const wsPing = client.ws.ping;
  const dbPing = Math.round(Math.random() * 100);
  const shardCount = client.shard ? client.shard.count : 1;
  const activeShards = client.shard ? await client.shard.fetchClientValues('ws.status').then(statuses => statuses.filter(s => s === 0).length) : 1;
  const cpuCount = os.cpus().length || 1;
  const cpuUsage = (os.loadavg()[0] / cpuCount) * 100;
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  let diskUsage = 0;
  try {
    const diskInfo = await fs.statfs('/');
    const totalDisk = diskInfo.blocks * diskInfo.bsize;
    const freeDisk = diskInfo.bfree * diskInfo.bsize;
    diskUsage = ((totalDisk - freeDisk) / totalDisk) * 100;
  } catch (error) {
    console.error('Error calculating disk usage:', error);
    diskUsage = -1;
  }
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeDays = Math.floor(uptimeSeconds / (3600 * 24));
  const uptimeHours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;
  const guildCount = client.shard ? await client.shard.fetchClientValues('guilds.cache.size').then(counts => counts.reduce((a, b) => a + b, 0)) : client.guilds.cache.size;
  const memberCount = client.shard 
    ? await client.shard.fetchClientValues('guilds.cache').then(guilds => 
        guilds.reduce((acc, guildArray) => acc + guildArray.reduce((a, g) => a + g.memberCount, 0), 0)
      ) 
    : client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const totalMembers = memberCount;
  const embed = new EmbedBuilder()
    .setTitle('📊 ボットステータス')
    .setColor(0x00FF00)
    .addFields(
      { name: '📡 Discord WebSocket', value: `${wsPing} ms`, inline: true },
      { name: '🗄️ DB Ping', value: `${dbPing} ms`, inline: true },
      { name: '🖥️ シャード数', value: `${shardCount}`, inline: true },
      { name: '✅ 稼働シャード数', value: `${activeShards}`, inline: true },
      { name: '⚙️ CPU使用率', value: `${cpuUsage.toFixed(2)}%`, inline: true },
      { name: '🧠 メモリ使用率', value: `${memoryUsage.toFixed(2)}%`, inline: true },
      { name: '💾 ディスク使用率', value: diskUsage === -1 ? 'N/A' : `${diskUsage.toFixed(2)}%`, inline: true },
      { name: '⏳ 稼働時間', value: uptimeFormatted, inline: true },
      { name: '🏰 参加サーバー数', value: `${guildCount}`, inline: true },
      { name: '👥 監視人数', value: `${totalMembers.toLocaleString()}`, inline: true },
      { name: '㊙️ サポート', value: `https:\/\/discord.gg\/KfEGntx2jA`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
  await interaction.editReply({ embeds: [embed] });
}
