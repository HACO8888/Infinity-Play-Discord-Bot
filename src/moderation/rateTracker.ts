import { fingerprint } from "./normalize.ts";

export interface RateLimits {
  /** windowSeconds 內超過幾則訊息算洗版 */
  floodMessages: number;
  floodWindowSeconds: number;
  /** 相同內容在 duplicateWindowSeconds 內出現幾次算重複洗版（常見於被盜帳號跨頻道貼詐騙） */
  duplicateMessages: number;
  duplicateWindowSeconds: number;
}

interface Entry {
  at: number;
  fingerprint: string;
  channelId: string;
}

export interface RateResult {
  flood: boolean;
  duplicate: boolean;
  recentCount: number;
  duplicateCount: number;
  channelCount: number;
}

/** 記錄每位使用者最近的訊息，判斷洗版與重複內容；只存時間、頻道與內容雜湊，不存原文 */
export class RateTracker {
  private readonly entries = new Map<string, Entry[]>();
  private readonly limits: RateLimits;

  constructor(limits: RateLimits) {
    this.limits = limits;
  }

  record(key: string, channelId: string, content: string, now = Date.now()): RateResult {
    const maxWindow = Math.max(this.limits.floodWindowSeconds, this.limits.duplicateWindowSeconds) * 1000;
    const list = (this.entries.get(key) ?? []).filter((e) => now - e.at < maxWindow);
    const print = fingerprint(content);
    list.push({ at: now, fingerprint: print, channelId });
    this.entries.set(key, list);

    const recent = list.filter((e) => now - e.at < this.limits.floodWindowSeconds * 1000);
    // 太短的內容（例如「好」「+1」）不算重複
    const duplicates =
      print.length >= 8
        ? list.filter((e) => e.fingerprint === print && now - e.at < this.limits.duplicateWindowSeconds * 1000)
        : [];

    return {
      flood: recent.length >= this.limits.floodMessages,
      duplicate: duplicates.length >= this.limits.duplicateMessages,
      recentCount: recent.length,
      duplicateCount: duplicates.length,
      channelCount: new Set(duplicates.map((e) => e.channelId)).size,
    };
  }

  /** 清掉過期的使用者，避免 Map 無限成長 */
  sweep(now = Date.now()): void {
    const maxWindow = Math.max(this.limits.floodWindowSeconds, this.limits.duplicateWindowSeconds) * 1000;
    for (const [key, list] of this.entries) {
      if (list.every((e) => now - e.at >= maxWindow)) this.entries.delete(key);
    }
  }
}

/** 在一段時間內只允許觸發一次（避免同一個人洗版時每則訊息都通報） */
export class Cooldown {
  private readonly until = new Map<string, number>();
  private readonly ms: number;

  constructor(seconds: number) {
    this.ms = seconds * 1000;
  }

  /** 冷卻中回傳 false，否則開始冷卻並回傳 true */
  take(key: string, now = Date.now()): boolean {
    const until = this.until.get(key);
    if (until !== undefined && until > now) return false;
    this.until.set(key, now + this.ms);
    if (this.until.size > 5000) {
      for (const [k, v] of this.until) if (v <= now) this.until.delete(k);
    }
    return true;
  }
}
