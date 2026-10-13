// 零寬字元、軟連字號等常被插進網址中間來繞過偵測
const INVISIBLE = /[­᠎​-‏⁠-⁤﻿]/g;
// NFKC 不會轉換的句點變體
const DOT_VARIANTS = /[。｡・•·∙]/g;
// discord[.]gg、discord(dot)gg 之類的寫法
const BRACKETED_DOT = /\s*(?:\[\s*(?:\.|dot)\s*\]|\(\s*(?:\.|dot)\s*\)|\{\s*(?:\.|dot)\s*\})\s*/gi;
// Markdown 跳脫：discord\.gg\/abc
const ESCAPED = /\\([./])/g;

/** 把常見的混淆寫法還原成一般文字，供邀請連結與網址偵測使用 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(DOT_VARIANTS, ".")
    .replace(BRACKETED_DOT, ".")
    .replace(ESCAPED, "$1");
}

/** 比對重複訊息用：忽略大小寫、空白與標點 */
export function fingerprint(text: string): string {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}
