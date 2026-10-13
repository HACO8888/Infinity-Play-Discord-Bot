import type { Client, Guild } from "discord.js";
import type { InviteResolver } from "./scanner.ts";

const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { codes: Set<string>; at: number }>();

async function ownInviteCodes(guild: Guild): Promise<Set<string>> {
  const cached = cache.get(guild.id);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.codes;
  const codes = new Set<string>();
  try {
    // 需要「管理伺服器」權限；沒有權限時改為逐一查詢邀請
    const invites = await guild.invites.fetch();
    for (const invite of invites.values()) codes.add(invite.code);
  } catch {}
  if (guild.vanityURLCode) codes.add(guild.vanityURLCode);
  cache.set(guild.id, { codes, at: Date.now() });
  return codes;
}

export function createInviteResolver(client: Client, guild: Guild, allowList: readonly string[]): InviteResolver {
  const allowed = new Set(allowList.map((v) => v.toLowerCase()));
  return {
    async isAllowed(invite) {
      if (allowed.has(invite.code.toLowerCase()) || allowed.has(invite.url.toLowerCase())) return true;
      if (!invite.resolvable) return false;
      if ((await ownInviteCodes(guild)).has(invite.code)) return true;
      // 快取之後才建立的邀請：直接問 Discord 這個邀請指向哪個伺服器
      try {
        const resolved = await client.fetchInvite(invite.code);
        return resolved.guild?.id === guild.id;
      } catch {
        // 無效或過期的邀請仍視為外部邀請，交給設定決定
        return false;
      }
    },
  };
}
