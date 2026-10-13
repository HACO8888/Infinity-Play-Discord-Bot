import os from "node:os";
import { EmbedBuilder, SlashCommandBuilder, version } from "discord.js";
import { BRAND_COLOR, FOOTER } from "../brand.ts";
import type { Command } from "../types.ts";

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d} 天`, h && `${h} 小時`, `${m} 分鐘`].filter(Boolean).join(" ");
}

export default {
  data: new SlashCommandBuilder().setName("info").setDescription("查看機器人資訊！"),
  async execute(interaction) {
    const total = os.totalmem();
    const used = total - os.freemem();
    const cpus = os.cpus();
    const embed = new EmbedBuilder()
      .setTitle("機器人資訊")
      .addFields(
        { name: "機器人名稱", value: interaction.client.user.username },
        { name: "機器人ID", value: interaction.client.user.id },
        { name: "Node.js 版本", value: process.version },
        { name: "Discord.js 版本", value: `v${version}` },
        {
          name: "硬體設備",
          value: [
            `作業系統 \`${process.platform}\``,
            `機器人運行時間 \`${formatDuration(process.uptime())}\``,
            `CPU 核心 \`${cpus.length}\``,
            `CPU規格 \`${cpus[0]?.model ?? "未知"}\``,
            `記憶體使用量 \`${(used / 1024 ** 3).toFixed(2)} GB（${((used / total) * 100).toFixed(2)}%）\``,
          ].join("\n"),
        },
      )
      .setColor(BRAND_COLOR)
      .setTimestamp()
      .setFooter(FOOTER);
    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
