import { normalizeText } from "./normalize.ts";

// 常見的字形混淆：西里爾／希臘字母與數字替代
const CONFUSABLES: Record<string, string> = {
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ј: "j",
  ѕ: "s",
  ԁ: "d",
  ɡ: "g",
  α: "a",
  ο: "o",
  ν: "v",
  ρ: "p",
  τ: "t",
  ι: "i",
  κ: "k",
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "|": "l",
  "!": "i",
};

/** 去除空白、標點與混淆字元後的比對用字串 */
export function nameKey(name: string): string {
  const lowered = normalizeText(name).toLowerCase();
  let out = "";
  for (const ch of lowered) out += CONFUSABLES[ch] ?? ch;
  // l 與 i 外觀幾乎一樣，統一成 l
  return out.replace(/[\s\p{P}\p{S}　]+/gu, "").replaceAll("i", "l");
}

// 名稱裡出現這些字通常是冒充官方或管理員（中英文）
const STAFF_TERMS = [
  "admln",
  "administrator",
  "moderator",
  "staff",
  "discordsupport",
  "discordteam",
  "discordstaff",
  "trustandsafety",
  "管理員",
  "管理员",
  "管理組",
  "版主",
  "客服",
  "官方",
  "系統通知",
  "系统通知",
].map(nameKey);

export interface NameCheck {
  reason: string;
}

/** 檢查名稱是否冒充受保護的名稱或官方／管理身分 */
export function checkImpersonation(name: string, protectedNames: Iterable<string>): NameCheck | null {
  const key = nameKey(name);
  if (key.length < 3) return null;
  for (const protectedName of protectedNames) {
    const target = nameKey(protectedName);
    if (target.length >= 3 && (key === target || (target.length >= 5 && key.includes(target)))) {
      return { reason: `名稱與「${protectedName}」幾乎相同` };
    }
  }
  const term = STAFF_TERMS.find((t) => key.includes(t));
  return term ? { reason: "名稱自稱管理員／官方／客服" } : null;
}
