export interface JoinRecord {
  userId: string;
  at: number;
  accountCreatedAt: number;
}

export interface RaidResult {
  joins: JoinRecord[];
}

/** 追蹤每個伺服器最近的加入；超過門檻時回傳這段期間的加入者（同一波只通報一次） */
export class JoinTracker {
  private readonly joins = new Map<string, JoinRecord[]>();
  private readonly lastAlert = new Map<string, number>();

  record(guildId: string, join: JoinRecord, threshold: number, windowSeconds: number): RaidResult | null {
    const windowMs = windowSeconds * 1000;
    const list = (this.joins.get(guildId) ?? []).filter((j) => join.at - j.at < windowMs);
    list.push(join);
    this.joins.set(guildId, list);
    if (list.length < threshold) return null;
    // 同一波突襲在 10 分鐘內只通報一次
    const last = this.lastAlert.get(guildId) ?? Number.NEGATIVE_INFINITY;
    if (join.at - last < 10 * 60 * 1000) return null;
    this.lastAlert.set(guildId, join.at);
    return { joins: [...list] };
  }
}

export function accountAgeDays(createdAt: number, now = Date.now()): number {
  return Math.floor((now - createdAt) / 86_400_000);
}
