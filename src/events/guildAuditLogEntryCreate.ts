import { AuditLogEvent, Events } from "discord.js";
import { sendModLog } from "../modlog/modlog.ts";
import { config } from "../runtime.ts";
import { defineEvent } from "../types.ts";

// 需要 GuildModeration intent（非特權）與「檢視審核日誌」權限
export default defineEvent({
  name: Events.GuildAuditLogEntryCreate,
  async execute(entry, guild) {
    if (!config.guilds.has(guild.id)) return;

    let title: string | undefined;
    switch (entry.action) {
      case AuditLogEvent.MemberKick:
        title = "👢 成員被踢出";
        break;
      case AuditLogEvent.MemberBanAdd:
        title = "🔨 成員被封鎖";
        break;
      case AuditLogEvent.MemberBanRemove:
        title = "🔓 解除封鎖";
        break;
      case AuditLogEvent.MemberUpdate: {
        const change = entry.changes.find((c) => c.key === "communication_disabled_until");
        if (!change) return;
        title = change.new
          ? `🔇 成員被禁言至 <t:${Math.floor(Date.parse(String(change.new)) / 1000)}:f>`
          : "🔊 解除禁言";
        break;
      }
      default:
        return;
    }

    await sendModLog(guild, (embed) =>
      embed
        .setTitle("管理紀錄")
        .setDescription(title)
        .addFields(
          { name: "對象", value: entry.targetId ? `<@${entry.targetId}>（${entry.targetId}）` : "未知", inline: true },
          { name: "執行者", value: entry.executorId ? `<@${entry.executorId}>` : "未知", inline: true },
          { name: "原因", value: entry.reason?.slice(0, 1024) || "（未填寫）" },
        ),
    );
  },
});
