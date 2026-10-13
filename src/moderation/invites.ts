export interface InviteMatch {
  /** 比對到的原始片段，例如 discord.gg/abc */
  url: string;
  code: string;
  /** discord.gg / discord.com/invite 可以向 Discord 查詢實際指向的伺服器；第三方短網址不行 */
  resolvable: boolean;
}

// 句點兩側允許空白，以及「dot」寫法（normalizeText 已處理括號版本）
const DOT = String.raw`\s*(?:\.|\s+dot\s+)\s*`;
const SLASH = String.raw`\s*\/\s*`;

const OFFICIAL = new RegExp(
  `(?:discord${DOT}gg|discord(?:app)?${DOT}com${SLASH}invite)${SLASH}([a-z0-9-]{2,32})`,
  "gi",
);
const THIRD_PARTY = new RegExp(
  `(?:dsc${DOT}gg|invite${DOT}gg|discord${DOT}(?:me|io|li|link|plus)|disboard${DOT}org${SLASH}server${SLASH}join)${SLASH}([a-z0-9-]{2,32})`,
  "gi",
);

/** 從已正規化的文字找出所有邀請連結，同一個邀請碼只回傳一次 */
export function findInvites(normalized: string): InviteMatch[] {
  const results = new Map<string, InviteMatch>();
  for (const [regex, resolvable] of [
    [OFFICIAL, true],
    [THIRD_PARTY, false],
  ] as const) {
    for (const match of normalized.matchAll(regex)) {
      const code = match[1];
      if (!code) continue;
      const key = `${resolvable}:${code}`;
      if (!results.has(key)) {
        results.set(key, { url: match[0].replace(/\s+/g, ""), code, resolvable });
      }
    }
  }
  return [...results.values()];
}
