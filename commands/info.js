const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const os = require("os");
const ms = require("ms")

var usedMemory = os.totalmem() - os.freemem(), totalMemory = os.totalmem();
var getpercentage = ((usedMemory / totalMemory) * 100).toFixed(2) + '%';

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("查看機器人資訊！"),
  async execute(interaction) {
    const core = os.cpus()[0];
    let Embed = new EmbedBuilder()
      .setTitle(`機器人資訊`)
      .addFields(
        { name: `機器人名稱`, value: `${interaction.client.user.username}` },
        { name: `機器人ID`, value: `${interaction.client.user.id}` },
        { name: `Node.js 版本`, value: `${process.version}` },
        { name: `Discord.js 版本`, value: `v${require("discord.js").version}` },
        { name: '硬體設備', value: `作業系統 \`${process.platform}\`\n主機開機時間 \`${ms(os.uptime() * 1000, { long: true })}\`\nCPU 核心 \`${os.cpus().length}\`\nCPU規格 \`${core.model}\`\n記憶體使用量百分比 \`${getpercentage}\`\n記憶體使用量 \`${(usedMemory / Math.pow(1024, 3)).toFixed(2)} GB\`` }
      )
      .setColor("#1cd3aa")
      .setTimestamp()
      .setFooter({
        text: "無限遊玩服務",
        iconURL: "https://cdn.lazco.dev/play-logo.png",
      });
    await interaction.reply({
      embeds: [Embed],
    });
  },
};
