import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserData, updateUserData } from '../../utils/db.js';
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  return suits.flatMap(suit => values.map(value => ({ suit, value })));
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 'A') {
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }

  for (let i = 0; i < aces; i++) {
    if (value + 11 <= 21) {
      value += 11;
    } else {
      value += 1;
    }
  }

  return value;
}

function formatHand(hand) {
  return hand.map(card => `${card.value}${card.suit}`).join(' ');
}

export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription('ブラックジャックをプレイします')
  .addIntegerOption(option =>
    option.setName('bet')
      .setDescription('賭けるコイン数')
      .setRequired(true)
      .setMinValue(1));

export async function execute(interaction) {
  const bet = interaction.options.getInteger('bet');
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const userData = getUserData(guildId, userId);
  if (userData.balance < bet) {
    return interaction.reply('エラー: 残高が不足しています。');
  }
  await interaction.deferReply();
  let deck = shuffleDeck(createDeck());
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];
  let playerValue = calculateHandValue(playerHand);
  let dealerValue = calculateHandValue(dealerHand);
  let messageContent = `**ブラックジャック**\nあなたのハンド: ${formatHand(playerHand)} (合計: ${playerValue})\nディーラーのハンド: ${dealerHand[0].value}${dealerHand[0].suit} ??\n\nヒットしますか？`;
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('hit')
        .setLabel('ヒット')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('stand')
        .setLabel('スタンド')
        .setStyle(ButtonStyle.Secondary)
    );
  await interaction.editReply({ content: messageContent, components: [row] });
  const filter = i => i.user.id === interaction.user.id && ['hit', 'stand'].includes(i.customId);
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
  collector.on('collect', async i => {
    if (i.customId === 'hit') {
      playerHand.push(deck.pop());
      playerValue = calculateHandValue(playerHand);
      if (playerValue > 21) {
        userData.balance -= bet;
        updateUserData(guildId, userId, userData);
        await i.update({
          content: `**ブラックジャック**\nあなたのハンド: ${formatHand(playerHand)} (合計: ${playerValue})\nディーラーのハンド: ${formatHand(dealerHand)} (合計: ${dealerValue})\n\nバースト！あなたは ${bet} コインを失いました。\n現在の残高: ${userData.balance} コイン`,
          components: []
        });
        collector.stop();
        return;
      }
      await i.update({
        content: `**ブラックジャック**\nあなたのハンド: ${formatHand(playerHand)} (合計: ${playerValue})\nディーラーのハンド: ${dealerHand[0].value}${dealerHand[0].suit} ??\n\nヒットしますか？`,
        components: [row]
      });
    } else if (i.customId === 'stand') {
      while (dealerValue < 17) {
        dealerHand.push(deck.pop());
        dealerValue = calculateHandValue(dealerHand);
      }
      let result = '';
      let payout = 0;
      if (dealerValue > 21 || playerValue > dealerValue) {
        payout = bet * 2;
        userData.balance += payout;
        result = `あなたの勝ち！${payout} コイン獲得！`;
      } else if (playerValue < dealerValue) {
        userData.balance -= bet;
        result = `ディーラーの勝ち。${bet} コインを失いました。`;
      } else {
        result = `引き分け！コインは返却されます。`;
      }
      updateUserData(guildId, userId, userData);
      await i.update({
        content: `**ブラックジャック**\nあなたのハンド: ${formatHand(playerHand)} (合計: ${playerValue})\nディーラーのハンド: ${formatHand(dealerHand)} (合計: ${dealerValue})\n\n${result}\n現在の残高: ${userData.balance} コイン`,
        components: []
      });
      collector.stop();
    }
  });
  collector.on('end', async () => {
    if (interaction.components?.length) {
      await interaction.editReply({ components: [] });
    }
  });
}
