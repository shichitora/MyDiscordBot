import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("gacha")
  .setDMPermission(true)
  .setDescription("ガチャを引く");

export async function execute(interaction) {
  await interaction.deferReply();
  const arr = ["CUSTOM MESSAGE", "TEST MESSAGE"];
  const weight = [1, 2];
  let result = "";
  let totalWeight = 0;
  for (let i = 0; i < weight.length; i++) {
    totalWeight += weight[i];
  }
  let random = Math.floor(Math.random() * totalWeight);
  for (let i = 0; i < weight.length; i++) {
    if (random < weight[i]) {
      result = arr[i];
      break;
    } else {
      random -= weight[i];
    }
  }
  await interaction.editReply(`${result} が当選しました！`);
}
