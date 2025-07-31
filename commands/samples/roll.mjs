import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDMPermission(true)
  .setDescription('サイコロを振る')
  .addStringOption(option =>
    option
      .setName('ndn')
      .setDescription('「1d100」形式でダイスロールを指定')
      .setRequired(true)
  );

export async function execute(interaction){
  await interaction.deferReply();
  const input = interaction.options.getString('ndn');
  if (!input.match(/^\d+d\d+$/)) {
    await interaction.editReply('入力が正しくありません。');
    return;  
  }
	await interaction.editReply(ndnDice(input));
}

export function ndnDice(ndn){
  const ndnArr = ndn.split('d');
  const number = ndnArr[0];
  const sides = ndnArr[1];
  const result = [];
  let sum = 0;
  for (let i = 0; i < number; i++) {
    const dice = Math.floor(Math.random() * sides) + 1;
    sum += dice;
    result.push(dice);
  }
	return `${number}d${sides} >> ${result}\n合計:${sum}`;
}
