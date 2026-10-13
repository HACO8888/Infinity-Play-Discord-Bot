import { loadConfig } from "./config.ts";
import { JoinTracker } from "./moderation/raid.ts";
import { Cooldown, RateTracker } from "./moderation/rateTracker.ts";
import { RoleStore } from "./store.ts";

/** 每個 shard 程序各自一份的執行期狀態 */
export const config = loadConfig();

const limits = [...config.guilds.values()].map((g) => g.automod);
export const rateTracker = new RateTracker({
  floodMessages: Math.min(...limits.map((l) => l.floodMessages), 6),
  floodWindowSeconds: Math.max(...limits.map((l) => l.floodWindowSeconds), 5),
  duplicateMessages: Math.min(...limits.map((l) => l.duplicateMessages), 3),
  duplicateWindowSeconds: Math.max(...limits.map((l) => l.duplicateWindowSeconds), 60),
});
setInterval(() => rateTracker.sweep(), 60_000).unref();

/** 同一位使用者的洗版通報一分鐘最多一次 */
export const floodCooldown = new Cooldown(60);

/** 機器人自己刪掉的訊息，mod log 不再重複記錄 */
export const deletedByAutomod = new Set<string>();
export function markDeletedByAutomod(messageId: string): void {
  deletedByAutomod.add(messageId);
  setTimeout(() => deletedByAutomod.delete(messageId), 60_000).unref();
}

/** 選用的特權 intent（審核未通過時移除環境變數即可，bot 仍可運作） */
const extra = new Set(
  (process.env.EXTRA_INTENTS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),
);
export const membersEnabled = extra.has("members");
export const presencesEnabled = extra.has("presences");

export const joinTracker = new JoinTracker();
/** 沒有設定 ROLE_STORE_KEY 時不啟用處罰身分組功能，也不建立資料庫 */
export const roleStore = process.env.ROLE_STORE_KEY
  ? new RoleStore(process.env.DATABASE_PATH ?? "data/bot.sqlite", process.env.ROLE_STORE_KEY)
  : null;
if (membersEnabled && !roleStore) console.warn("ROLE_STORE_KEY is not set; punishment-role persistence is disabled");

/** 曾在伺服器發言的管理員顯示名稱，用來偵測冒充 */
export const staffNames = new Map<string, Set<string>>();
export function rememberStaffName(guildId: string, name: string): void {
  const names = staffNames.get(guildId) ?? new Set<string>();
  staffNames.set(guildId, names);
  if (names.size < 500) names.add(name);
}

/** 同一位使用者的同一個名稱或狀態只通報一次（一天內） */
export const alreadyReported = new Cooldown(24 * 60 * 60);
