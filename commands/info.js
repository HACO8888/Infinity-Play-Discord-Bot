const { SlashCommandBuilder, EmbedBuilder, version } = require("discord.js");
const os = require("node:os");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("查看機器人資訊！"),
  async execute(interaction) {
    // 每次執行時才計算，避免顯示啟動當下的舊數值
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();
    const percentage = ((usedMemory / totalMemory) * 100).toFixed(2) + "%";
    const core = os.cpus()[0];

    const Embed = new EmbedBuilder()
      .setTitle("機器人資訊")
      .addFields(
        { name: "機器人名稱", value: `${interaction.client.user.username}` },
        { name: "機器人ID", value: `${interaction.client.user.id}` },
        { name: "Node.js 版本", value: `${process.version}` },
        { name: "Discord.js 版本", value: `v${version}` },
        { name: "硬體設備", value: `作業系統 \`${process.platform}\`\n主機開機時間 \`${ms(os.uptime() * 1000, { long: true })}\`\nCPU 核心 \`${os.cpus().length}\`\nCPU規格 \`${core.model}\`\n記憶體使用量百分比 \`${percentage}\`\n記憶體使用量 \`${(usedMemory / Math.pow(1024, 3)).toFixed(2)} GB\`` },
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
