const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("查看使用者資訊！"),
  async execute(interaction) {
    await interaction.reply("這個指令目前為非公開功能！");
    // await interaction.reply(
    //   `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`
    // );
  },
};
