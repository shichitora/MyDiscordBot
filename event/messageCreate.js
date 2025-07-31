import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

// AutoPublish
async function handleAutopublish(message, config) {
  if (message.channel.type === 5 && config[message.guild.id]?.autopublish) {
    try {
      await message.crosspost();
    } catch (error) {
      if (error.code === 429) {
        console.warn('レートリミットに達しました（autopublish）');
      } else {
        console.error('Autopublishエラー:', error);
      }
    }
  }
}

// Responser
async function handleAutoresponser(message, responses) {
  if (message.author.bot) return;
  const guildResponses = responses[message.guild.id];
  if (!guildResponses) return;
  for (const [keyword, responseList] of Object.entries(guildResponses)) {
    if (message.content.toLowerCase().includes(keyword.toLowerCase())) {
      try {
        const response = responseList[Math.floor(Math.random() * responseList.length)];
        await message.channel.send(response);
      } catch (error) {
        if (error.code === 429) {
          console.warn('レートリミットに達しました（autoresponser）');
        } else {
          console.error('Autoresponserエラー:', error);
        }
      }
    }
  }
}

// MessageOpen
async function handleMessageOpen(message, config, client) {
  if (message.author.bot || !config[message.guild.id]?.messageopen) return;
  const linkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
  const match = message.content.match(linkRegex);
  if (match) {
    const [, guildId, channelId, messageId] = match;
    try {
      const channel = await client.channels.fetch(channelId);
      const linkedMessage = await channel.messages.fetch(messageId);
      await message.channel.send({
        content: `${linkedMessage.author.tag}: ${linkedMessage.content}`,
        embeds: linkedMessage.embeds,
        files: linkedMessage.attachments.map(a => a.url),
      });
    } catch (error) {
      if (error.code === 429) {
        console.warn('レートリミットに達しました（messageopen）');
      } else {
        console.error('MessageOpenエラー:', error);
      }
    }
  }
}

// LevelSystem
async function handleLeveling(message, levels) {
  if (message.author.bot || !message.guild || !levels[message.guild.id]?.enabled) return;
  const guildId = message.guild.id;
  if (!levels[guildId].users[message.author.id]) {
    levels[guildId].users[message.author.id] = { level: 0, xp: 0 };
  }
  const userData = levels[guildId].users[message.author.id];
  userData.xp += 10;
  const xpNeeded = userData.level * 100 + 100;
  if (userData.xp >= xpNeeded) {
    userData.level += 1;
    userData.xp = 0;
    try {
      await message.channel.send(`${message.author}がレベル${userData.level}に到達！`);
      const roleId = levels[guildId].roles[userData.level];
      if (roleId) {
        const role = message.guild.roles.cache.get(roleId);
        if (role) await message.member.roles.add(role);
      }
    } catch (error) {
      if (error.code === 429) {
        console.warn('レートリミットに達しました（leveling）');
      } else {
        console.error('Levelingエラー:', error);
      }
    }
  }
  fs.writeFileSync('./new/levels.json', JSON.stringify(levels, null, 2));
}

// StickyMessages
async function handleStickyMessage(message, stickies) {
  const BOT= 'YOUR_BOT_ID';
  if (message.author.id === BOT) return;
  if (!stickies[message.guild.id]?.[message.channel.id]) return;
  const sticky = stickies[message.guild.id][message.channel.id];
  if (sticky.lastMessageId) {
    try {
      const lastMessage = await message.channel.messages.fetch(sticky.lastMessageId);
      await lastMessage.delete();
    } catch (error) {
      if (error.code === 429) {
        console.warn('レートリミットに達しました（stickymessage）');
      } else {
        console.error('StickyMessage削除エラー:', error);
      }
    }
  }
  try {
    const newMessage = await message.channel.send(sticky.content);
    sticky.lastMessageId = newMessage.id;
    fs.writeFileSync('./new/stickymessages.json', JSON.stringify(stickies, null, 2));
  } catch (error) {
    if (error.code === 429) {
      console.warn('レートリミットに達しました（stickymessage）');
    } else {
      console.error('StickyMessage送信エラー:', error);
    }
  }
}

// MainHandler
export default {
  name: 'messageCreate',
  async execute(message, client) {
    let config, levels, responses, stickies;
    try {
      config = JSON.parse(fs.readFileSync('./new/config.json', 'utf8'));
      levels = JSON.parse(fs.readFileSync('./new/levels.json', 'utf8'));
      responses = JSON.parse(fs.readFileSync('./new/responses.json', 'utf8'));
      stickies = JSON.parse(fs.readFileSync('./new/stickymessages.json', 'utf8'));
    } catch (error) {
      console.error('データファイル読み込みエラー:', error);
      return;
    }
    await handleAutopublish(message, config);
    await handleAutoresponser(message, responses);
    await handleMessageOpen(message, config, client);
    await handleLeveling(message, levels);
    await handleStickyMessage(message, stickies);
  },
};
