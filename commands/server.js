const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("查看伺服器資訊！"),
  async execute(interaction) {
    await interaction.reply("這個指令目前為非公開功能！");
    // await interaction.reply(
    //   `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`
    // );
  },
};
