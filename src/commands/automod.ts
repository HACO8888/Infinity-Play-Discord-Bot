import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { BRAND_COLOR, FOOTER } from "../brand.ts";
import type { DetectionAction } from "../config.ts";
import { getScamDomains, scamDomainsAge } from "../moderation/scamDomains.ts";
import { config } from "../runtime.ts";
import type { Command } from "../types.ts";

const ACTION_LABEL: Record<DetectionAction, string> = { delete: "刪除並通報", alert: "只通報", off: "關閉" };

export default {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("查看自動管理的設定與狀態")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(0),
  async execute(interaction) {
    const guildConfig = interaction.guildId ? config.guilds.get(interaction.guildId) : undefined;
    if (!guildConfig) {
      await interaction.reply({ content: "這個伺服器沒有啟用自動管理", flags: MessageFlags.Ephemeral });
      return;
    }
    const { automod } = guildConfig;
    const age = scamDomainsAge();
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("自動管理設定")
      .addFields(
        {
          name: "偵測項目",
          value: [
            `外部邀請連結：${ACTION_LABEL[automod.invites]}`,
            `詐騙／釣魚網址：${ACTION_LABEL[automod.scamLinks]}`,
            `疑似詐騙訊息：${ACTION_LABEL[automod.scamText]}`,
            `大量提及（≥ ${automod.maxMentions}）：${ACTION_LABEL[automod.mentionSpam]}`,
            `洗版（${automod.floodWindowSeconds} 秒 ${automod.floodMessages} 則／重複 ${automod.duplicateMessages} 次）：${ACTION_LABEL[automod.flood]}`,
          ].join("\n"),
        },
        {
          name: "通報頻道",
          value: guildConfig.alertChannelId ? `<#${guildConfig.alertChannelId}>` : "原頻道",
          inline: true,
        },
        {
          name: "紀錄頻道",
          value: guildConfig.logChannelId ? `<#${guildConfig.logChannelId}>` : "未設定",
          inline: true,
        },
        {
          name: "詐騙網域清單",
          value: `${getScamDomains().size.toLocaleString()} 筆${age === null ? "（尚未載入）" : `，${Math.round(age / 60000)} 分鐘前更新`}`,
          inline: true,
        },
      )
      .setFooter(FOOTER);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
} satisfies Command;
