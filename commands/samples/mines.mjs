import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('mines')
  .setDescription('Minesゲームをプレイします。爆弾を避けて報酬を獲得！')
  .addIntegerOption(option =>
    option.setName('bet')
      .setDescription('掛け金（コイン）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(9999999))
  .addIntegerOption(option =>
    option.setName('bombs')
      .setDescription('爆弾の数（1～19）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(19));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const bet = interaction.options.getInteger('bet');
  const bombs = interaction.options.getInteger('bombs');
  const userData = getUserData(guildId, userId);
  if (userData.balance < bet) {
    return interaction.editReply({
      content: `残高不足！現在の残高: ${userData.balance} コイン`,
      ephemeral: true,
    });
  }
  const grid = Array(20).fill('safe');
  const bombIndices = [];
  while (bombIndices.length < bombs) {
    const index = Math.floor(Math.random() * 20);
    if (!bombIndices.includes(index)) bombIndices.push(index);
  }
  bombIndices.forEach(index => (grid[index] = 'bomb'));
  const state = {
    selected: [],
    safeCount: 0,
    gameOver: false,
    bet,
    bombs,
  };
  await interaction.editReply({
    content: `**Minesゲーム開始！**\n掛け金: ${bet} コイン\n爆弾: ${bombs} 個\nマスを選択してください（20マス中 ${20 - bombs} 個が安全）。`,
    components: createGridButtons(state, userId),
    ephemeral: true,
  });
  const filter = i => i.user.id === userId && i.customId.startsWith(`mines_${userId}_`);
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000 });
  collector.on('collect', async i => {
    if (state.gameOver) return;
    const customId = i.customId;
    if (customId === `mines_${userId}_cashout`) {
      state.gameOver = true;
      const payout = calculatePayout(state);
      userData.balance += Math.floor(payout);
      updateUserData(guildId, userId, userData);
      await i.update({
        content: `**ゲーム終了！**\n安全マス: ${state.safeCount} 個\n報酬: ${Math.floor(payout)} コイン\n現在の残高: ${userData.balance} コイン`,
        components: revealGrid(grid, state, userId),
      });
      collector.stop();
      return;
    }
    if (customId === `mines_${userId}_reset`) {
      state.selected = [];
      state.safeCount = 0;
      state.gameOver = false;
      await i.update({
        content: `**グリッドをリセット！**\n掛け金: ${bet} コイン\n爆弾: ${bombs} 個\nマスを選択してください。`,
        components: createGridButtons(state, userId),
      });
      return;
    }
    const index = parseInt(customId.split('_')[2]);
    if (state.selected.includes(index)) {
      await i.reply({ content: 'そのマスはすでに選択済みです！', ephemeral: true });
      return;
    }
    state.selected.push(index);
    if (grid[index] === 'bomb') {
      state.gameOver = true;
      userData.balance -= bet;
      updateUserData(guildId, userId, userData);
      await i.update({
        content: `**ゲームオーバー！**\n爆弾を引きました！\n掛け金 ${bet} コインを失いました。\n現在の残高: ${userData.balance} コイン`,
        components: revealGrid(grid, state, userId),
      });
      collector.stop();
    } else {
      state.safeCount++;
      const payout = calculatePayout(state);
      await i.update({
        content: `**安全マスを選択！**\n安全マス: ${state.safeCount} 個\n現在の報酬: ${Math.floor(payout)} コイン\n次のマスを選択するか、キャッシュアウトしてください。`,
        components: createGridButtons(state, userId),
      });
    }
  });
  collector.on('end', async () => {
    if (!state.gameOver) {
      await interaction.editReply({
        content: `**ゲーム終了（タイムアウト）**\n安全マス: ${state.safeCount} 個\nキャッシュアウトしなかったため、報酬は0コインです。`,
        components: [],
      });
    }
  });
}

function createGridButtons(state, userId) {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 5; j++) {
      const index = i * 5 + j;
      const isSelected = state.selected.includes(index);
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mines_${userId}_${index}`)
          .setLabel(isSelected ? '✅' : '⬜')
          .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(state.gameOver || isSelected)
      );
    }
    rows.push(row);
  }
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mines_${userId}_cashout`)
        .setLabel('キャッシュアウト')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(state.gameOver || state.safeCount === 0),
      new ButtonBuilder()
        .setCustomId(`mines_${userId}_reset`)
        .setLabel('リセット')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(state.gameOver)
    )
  );
  return rows;
}

function revealGrid(grid, state, userId) {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 5; j++) {
      const index = i * 5 + j;
      const isSelected = state.selected.includes(index);
      const isBomb = grid[index] === 'bomb';
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mines_${userId}_${index}`)
          .setLabel(isBomb ? '💣' : isSelected ? '✅' : '⬜')
          .setStyle(isBomb ? ButtonStyle.Danger : isSelected ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(true) // ゲーム終了時は全て無効化
      );
    }
    rows.push(row);
  }
  return rows;
}

function calculatePayout(state) {
  const { bet, safeCount, bombs } = state;
  if (safeCount === 0) return 0;
  const multiplier = 1 + (safeCount * bombs / 4) / (20 - bombs);
  return bet * multiplier;
}
