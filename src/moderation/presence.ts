import { ActivityType, type Presence } from "discord.js";
import { alreadyReported, config } from "../runtime.ts";
import { buildMemberAlert, configuredAlertChannel } from "./alerts.ts";
import { createInviteResolver } from "./inviteResolver.ts";
import { isStaff } from "./members.ts";
import { normalizeText } from "./normalize.ts";
import { getScamDomains } from "./scamDomains.ts";
import { KIND_LABEL, scanContent } from "./scanner.ts";

/** 自訂狀態的文字（其他活動，例如正在玩的遊戲，一律不看） */
export function customStatusText(presence: Pick<Presence, "activities">): string | null {
  const custom = presence.activities.find((a) => a.type === ActivityType.Custom);
  return custom?.state?.trim() || null;
}

/** 檢查自訂狀態是否含詐騙網址、外部邀請或詐騙話術；只在記憶體比對，不保存狀態 */
export async function inspectPresence(oldPresence: Presence | null, presence: Presence): Promise<void> {
  const guild = presence.guild;
  if (!guild) return;
  const guildConfig = config.guilds.get(guild.id);
  if (!guildConfig || guildConfig.automod.customStatus === "off") return;

  const text = customStatusText(presence);
  if (!text || (oldPresence && customStatusText(oldPresence) === text)) return;

  const { automod } = guildConfig;
  const findings = await scanContent(
    { normalized: normalizeText(text), mentionCount: 0 },
    { ...automod, mentionSpam: "off", scamText: automod.scamText === "off" ? "off" : "alert" },
    getScamDomains(),
    createInviteResolver(presence.client, guild, automod.allowedInvites),
  );
  if (findings.length === 0) return;

  const member = presence.member ?? (await guild.members.fetch(presence.userId).catch(() => null));
  if (!member || member.user.bot || isStaff(member, automod.exemptRoleIds)) return;
  if (!alreadyReported.take(`status:${guild.id}:${member.id}:${text}`)) return;

  const channel = await configuredAlertChannel(guild);
  await channel
    ?.send(
      buildMemberAlert(
        member.user,
        "⚠️ 可疑的自訂狀態，請管理員確認",
        findings.map((f) => ({ label: KIND_LABEL[f.kind], summary: f.summary })),
        text,
      ),
    )
    .catch((error: unknown) => console.error("Failed to send status alert:", error));
}
