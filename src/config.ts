import { readFileSync } from "node:fs";

/** alert：只通報給管理員決定；delete：先刪除訊息再通報 */
export type DetectionAction = "alert" | "delete" | "off";

export interface AutomodConfig {
  invites: DetectionAction;
  scamLinks: DetectionAction;
  scamText: DetectionAction;
  mentionSpam: DetectionAction;
  flood: DetectionAction;
  /** 以下需要 Server Members intent */
  impersonation: DetectionAction;
  raid: DetectionAction;
  /** 需要 Presence intent */
  customStatus: DetectionAction;
  /** 單則訊息提及幾位使用者／身分組以上算大量提及 */
  maxMentions: number;
  floodMessages: number;
  floodWindowSeconds: number;
  duplicateMessages: number;
  duplicateWindowSeconds: number;
  /** 帳號建立未滿幾天算新帳號 */
  newAccountDays: number;
  /** raidWindowSeconds 內有幾人加入算突襲 */
  raidJoins: number;
  raidWindowSeconds: number;
  /** 額外要保護、不允許別人冒用的名稱（伺服器擁有者與管理員會自動保護） */
  protectedNames: string[];
  /** 這些身分組不受自動偵測（有管理訊息權限的人本來就會略過） */
  exemptRoleIds: string[];
  /** 允許的邀請碼或第三方邀請網址（本伺服器的邀請會自動判斷，不用填） */
  allowedInvites: string[];
}

export interface GuildConfig {
  alertChannelId: string | null;
  logChannelId: string | null;
  /** 成員退出再加入時要自動補回的處罰身分組 */
  persistRoleIds: string[];
  automod: AutomodConfig;
}

export interface BotConfig {
  guilds: Map<string, GuildConfig>;
}

export const DEFAULT_AUTOMOD: AutomodConfig = {
  invites: "delete",
  scamLinks: "delete",
  scamText: "alert",
  mentionSpam: "alert",
  flood: "alert",
  impersonation: "alert",
  raid: "alert",
  customStatus: "alert",
  maxMentions: 5,
  floodMessages: 6,
  floodWindowSeconds: 5,
  duplicateMessages: 3,
  duplicateWindowSeconds: 60,
  newAccountDays: 7,
  raidJoins: 10,
  raidWindowSeconds: 60,
  protectedNames: [],
  exemptRoleIds: [],
  allowedInvites: [],
};

const ACTIONS: readonly DetectionAction[] = ["alert", "delete", "off"];
const SNOWFLAKE = /^\d{17,20}$/;

function fail(path: string, message: string): never {
  throw new Error(`config.json: ${path} ${message}`);
}

function snowflakeOrNull(value: unknown, path: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !SNOWFLAKE.test(value)) fail(path, "必須是 Discord ID 字串或 null");
  return value;
}

function snowflakeList(value: unknown, path: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string" && SNOWFLAKE.test(v))) {
    fail(path, "必須是 Discord ID 字串陣列");
  }
  return value;
}

function parseAutomod(raw: unknown, path: string): AutomodConfig {
  if (raw === undefined) return { ...DEFAULT_AUTOMOD };
  if (typeof raw !== "object" || raw === null) fail(path, "必須是物件");
  const input = raw as Record<string, unknown>;
  const result: AutomodConfig = { ...DEFAULT_AUTOMOD };

  for (const key of [
    "invites",
    "scamLinks",
    "scamText",
    "mentionSpam",
    "flood",
    "impersonation",
    "raid",
    "customStatus",
  ] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (!ACTIONS.includes(value as DetectionAction)) fail(`${path}.${key}`, `必須是 ${ACTIONS.join(" / ")}`);
    result[key] = value as DetectionAction;
  }
  for (const key of [
    "maxMentions",
    "floodMessages",
    "floodWindowSeconds",
    "duplicateMessages",
    "duplicateWindowSeconds",
    "newAccountDays",
    "raidJoins",
    "raidWindowSeconds",
  ] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || (value as number) < 1) fail(`${path}.${key}`, "必須是正整數");
    result[key] = value as number;
  }
  for (const key of ["exemptRoleIds", "allowedInvites", "protectedNames"] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) fail(`${path}.${key}`, "必須是字串陣列");
    result[key] = value;
  }
  return result;
}

/**
 * 解析設定。GUILD_ID 環境變數（逗號分隔）若有設定，只啟用其中的伺服器，
 * 沒寫在 config.json 的伺服器會用預設值（沒有通報頻道時通報會發在原頻道）
 */
export function parseConfig(raw: unknown, guildIdEnv?: string): BotConfig {
  if (typeof raw !== "object" || raw === null) fail("", "必須是物件");
  const guildsRaw = (raw as Record<string, unknown>).guilds ?? {};
  if (typeof guildsRaw !== "object" || guildsRaw === null) fail("guilds", "必須是物件");

  const guilds = new Map<string, GuildConfig>();
  for (const [id, value] of Object.entries(guildsRaw)) {
    if (!SNOWFLAKE.test(id)) fail(`guilds.${id}`, "的 key 必須是伺服器 ID");
    const entry = (value ?? {}) as Record<string, unknown>;
    guilds.set(id, {
      alertChannelId: snowflakeOrNull(entry.alertChannelId, `guilds.${id}.alertChannelId`),
      logChannelId: snowflakeOrNull(entry.logChannelId, `guilds.${id}.logChannelId`),
      persistRoleIds: snowflakeList(entry.persistRoleIds, `guilds.${id}.persistRoleIds`),
      automod: parseAutomod(entry.automod, `guilds.${id}.automod`),
    });
  }

  const enabled = guildIdEnv
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!enabled?.length) return { guilds };

  const filtered = new Map<string, GuildConfig>();
  for (const id of enabled) {
    filtered.set(
      id,
      guilds.get(id) ?? {
        alertChannelId: null,
        logChannelId: null,
        persistRoleIds: [],
        automod: { ...DEFAULT_AUTOMOD },
      },
    );
  }
  return { guilds: filtered };
}

export function loadConfig(): BotConfig {
  const raw: unknown = JSON.parse(readFileSync(new URL("../config.json", import.meta.url), "utf8"));
  return parseConfig(raw, process.env.GUILD_ID);
}
