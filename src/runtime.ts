import { loadConfig } from "./config.ts";
import { Cooldown, RateTracker } from "./moderation/rateTracker.ts";

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
