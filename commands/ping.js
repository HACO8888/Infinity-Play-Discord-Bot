const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("取得機器人延遲！"),
  async execute(interaction) {
    const PingEmbed = new EmbedBuilder()
      .setColor("#34E718")
      .setTitle("機器人延遲")
      .setDescription(
        `<a:check:1057263917732220980> 延遲 \`${interaction.client.ws.ping}\` (毫秒)`
      )
      .setTimestamp()
      .setFooter({
        text: "無限遊玩服務",
        iconURL: "https://cdn.lazco.dev/play-logo.png",
      });
    await interaction.reply("<a:loading:1057261323735547934>正在讀取...");
    await wait(2000);
    await interaction.editReply({ content: null, embeds: [PingEmbed] });
  },
};
