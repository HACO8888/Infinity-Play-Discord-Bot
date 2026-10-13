import { type Message, PermissionFlagsBits } from "discord.js";
import { config, floodCooldown, markDeletedByAutomod, rateTracker, rememberStaffName } from "../runtime.ts";
import { alertChannel, buildAlert, messageText } from "./alerts.ts";
import { createInviteResolver } from "./inviteResolver.ts";
import { normalizeText } from "./normalize.ts";
import { getScamDomains } from "./scamDomains.ts";
import { type Finding, scanContent, shouldDelete } from "./scanner.ts";

function isExempt(message: Message<true>, exemptRoleIds: readonly string[]): boolean {
  const member = message.member;
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  return exemptRoleIds.some((id) => member.roles.cache.has(id));
}

/** 檢查一則訊息；新訊息會一併計入洗版判斷，編輯過的訊息只重新檢查內容 */
export async function inspectMessage(message: Message, { edited = false } = {}): Promise<void> {
  if (!message.inGuild() || message.author.bot || message.webhookId) return;
  const guildConfig = config.guilds.get(message.guildId);
  if (!guildConfig) return;
  const { automod } = guildConfig;
  if (isExempt(message, automod.exemptRoleIds)) {
    // 記住管理員的名稱，之後才能偵測別人冒充
    if (message.member) rememberStaffName(message.guildId, message.member.displayName);
    return;
  }

  const text = messageText(message);
  const findings: Finding[] = await scanContent(
    { normalized: normalizeText(text), mentionCount: message.mentions.users.size + message.mentions.roles.size },
    automod,
    getScamDomains(),
    createInviteResolver(message.client, message.guild, automod.allowedInvites),
  );

  if (!edited && automod.flood !== "off") {
    const rate = rateTracker.record(`${message.guildId}:${message.author.id}`, message.channelId, text);
    if ((rate.flood || rate.duplicate) && floodCooldown.take(`${message.guildId}:${message.author.id}`)) {
      const summary = rate.duplicate
        ? `相同內容在 ${automod.duplicateWindowSeconds} 秒內發了 ${rate.duplicateCount} 次（${rate.channelCount} 個頻道）`
        : `${automod.floodWindowSeconds} 秒內發了 ${rate.recentCount} 則訊息`;
      findings.push({ kind: "flood", action: automod.flood, summary });
    }
  }
  if (findings.length === 0) return;

  let deleted = false;
  if (shouldDelete(findings)) {
    markDeletedByAutomod(message.id);
    deleted = await message.delete().then(
      () => true,
      () => false,
    );
  }

  const channel = await alertChannel(message);
  await channel?.send(buildAlert(message, findings, deleted, edited)).catch((error: unknown) => {
    console.error(`Failed to send alert in guild ${message.guildId}:`, error);
  });
}
