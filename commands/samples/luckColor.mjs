import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('luck_color')
  .setDMPermission(true)
  .setDescription('ラッキーカラーを占う');

export async function execute(interaction){
  await interaction.deferReply();
  const arr = ["赤色", "橙色", "肌色", "黄色", "黄緑", "緑色", "水色", "空色", "青色", "紫色", "桃色", "白色", "灰色", "黒色"]
  const random = Math.floor( Math.random() * arr.length);
  const color = arr[random];
	await interaction.editReply(`ラッキーカラーは \`${color}\` です！`);
}
