import { type GuildMember, PermissionFlagsBits } from "discord.js";
import { alreadyReported, config, staffNames } from "../runtime.ts";
import { buildMemberAlert, configuredAlertChannel } from "./alerts.ts";
import { checkImpersonation } from "./impersonation.ts";
import { createInviteResolver } from "./inviteResolver.ts";
import { normalizeText } from "./normalize.ts";
import { getScamDomains } from "./scamDomains.ts";
import { KIND_LABEL, scanContent } from "./scanner.ts";

export function isStaff(member: GuildMember, exemptRoleIds: readonly string[]): boolean {
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  return exemptRoleIds.some((id) => member.roles.cache.has(id));
}

/** 檢查成員的名稱（使用者名稱、顯示名稱、伺服器暱稱）是否冒充管理員或含詐騙資訊 */
export async function inspectMemberName(member: GuildMember): Promise<void> {
  const guildConfig = config.guilds.get(member.guild.id);
  if (!guildConfig || member.user.bot) return;
  const { automod } = guildConfig;
  if (automod.impersonation === "off" || isStaff(member, automod.exemptRoleIds)) return;

  const names = [
    ...new Set([member.user.username, member.user.globalName, member.nickname].filter((n) => n)),
  ] as string[];
  const key = `name:${member.guild.id}:${member.id}:${names.join("|")}`;

  const owner = await member.guild.fetchOwner().catch(() => null);
  const protectedNames = [
    ...automod.protectedNames,
    ...(staffNames.get(member.guild.id) ?? []),
    ...(owner ? [owner.displayName, owner.user.username] : []),
  ];

  const findings: { label: string; summary: string }[] = [];
  for (const name of names) {
    const match = checkImpersonation(name, protectedNames);
    if (match) findings.push({ label: "冒充管理員／官方", summary: `「${name}」${match.reason}` });
  }
  // 名稱裡塞詐騙網址、外部邀請或站外聯絡方式
  const scan = await scanContent(
    { normalized: normalizeText(names.join("\n")), mentionCount: 0 },
    { ...automod, mentionSpam: "off" },
    getScamDomains(),
    createInviteResolver(member.client, member.guild, automod.allowedInvites),
  );
  for (const f of scan) findings.push({ label: `名稱含${KIND_LABEL[f.kind]}`, summary: f.summary });

  if (findings.length === 0 || !alreadyReported.take(key)) return;
  const channel = await configuredAlertChannel(member.guild);
  await channel
    ?.send(buildMemberAlert(member.user, "⚠️ 可疑的成員名稱，請管理員確認", findings, names.join("\n")))
    .catch((error: unknown) => console.error("Failed to send name alert:", error));
}
