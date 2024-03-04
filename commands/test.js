const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("開發者測試功能用！"),
  async execute(interaction) {
    if (interaction.user.id !== "508964901415550976")
      return await interaction.reply("您不是開發者無法使用這個指令！");
    await interaction.reply("目前沒有測試中的功能！");
  },
};
