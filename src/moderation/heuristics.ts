export interface HeuristicResult {
  score: number;
  /** 命中的規則，用於通報訊息 */
  reasons: string[];
}

interface Rule {
  label: string;
  pattern: RegExp;
  weight: number;
}

// 站外聯絡方式：詐騙幾乎都會把人導到 LINE／微信／Telegram
const CONTACT_RULES: Rule[] = [
  {
    label: "站外聯絡帳號",
    pattern:
      /(?:(?<![a-z])(?:line|wechat|vx|wx|telegram|whatsapp|skype|kakao|qq|tg)|微信|飛機|飞机)\s*(?:id|帳號|账号|號|号)?\s*[:：=]\s*@?[\w.-]{4,}/i,
    weight: 3,
  },
  { label: "加好友引導", pattern: /加\s*(?:line|賴|微信|vx|wx|tg|飛機|飞机)/i, weight: 2 },
  { label: "站外聯絡連結", pattern: /\b(?:t\.me|wa\.me|line\.me\/ti\/p|lin\.ee)\/\S+/i, weight: 3 },
];

const LURE_RULES: Rule[] = [
  // 中文：假招募、代儲、博弈、投資
  { label: "假招募", pattern: /招募|招聘|工讀生|兼[職职]|日[結结]|高薪|月入|日入/, weight: 1 },
  { label: "賺錢誘餌", pattern: /輕鬆賺|轻松赚|躺[賺赚]|[穩稳][賺赚]|保[證证][獲获]利|被動收入|被动收入/, weight: 1 },
  { label: "遊戲代儲／衝榜", pattern: /儲值|充值|[沖冲衝]榜|首儲|代儲|返利|返水|無上限|无上限/, weight: 1 },
  { label: "名額／暗號話術", pattern: /名額|名额|暗[號号]|限時領取|免費領|免费领|領取/, weight: 1 },
  { label: "博弈／投資", pattern: /娛樂城|娱乐城|博弈|帶單|带单|USDT|虛擬貨幣|虚拟货币|投資機會|投资机会/i, weight: 1 },
  // 英文：拿電腦賺錢、被動收入、免費 Nitro
  {
    label: "賺錢誘餌（英文）",
    pattern:
      /generate (?:some )?(?:profit|income)|extra income|passive income|make (?:easy )?money|earn \$?\d+|profit using your (?:pc|computer)/i,
    weight: 1,
  },
  {
    label: "閒置電腦話術",
    pattern: /computer that isn'?t getting (?:much )?use|leave (?:the|your) computer unused/i,
    weight: 1,
  },
  {
    label: "零門檻話術",
    pattern: /no (?:technical )?(?:skills?|experience) (?:is |are )?(?:required|needed)/i,
    weight: 1,
  },
  { label: "私訊引導", pattern: /\b(?:contact me|dm me|message me|inbox me)\b/i, weight: 1 },
  {
    label: "免費禮物詐騙",
    pattern:
      /free (?:discord )?nitro|nitro (?:giveaway|gift)|steam (?:gift|giveaway)|claim your (?:gift|reward|prize)|airdrop/i,
    weight: 1,
  },
  {
    label: "投資話術（英文）",
    pattern: /(?:crypto|forex|bitcoin) (?:trading|investment|signals?)|investment opportunit/i,
    weight: 1,
  },
];

/** 規則式評分：命中站外聯絡方式或多個誘餌話術時分數會升高 */
export function scoreScamText(normalized: string): HeuristicResult {
  const reasons: string[] = [];
  let score = 0;
  let hasContact = false;
  let lureCount = 0;

  for (const rule of CONTACT_RULES) {
    if (rule.pattern.test(normalized)) {
      hasContact = true;
      score += rule.weight;
      reasons.push(rule.label);
    }
  }
  for (const rule of LURE_RULES) {
    if (rule.pattern.test(normalized)) {
      lureCount++;
      score += rule.weight;
      reasons.push(rule.label);
    }
  }

  // 只有聯絡方式但沒有任何誘餌（例如分享自己的 LINE），或只有一個誘餌詞，都不算
  if ((hasContact && lureCount === 0) || (!hasContact && lureCount < 3)) {
    return { score: Math.min(score, 2), reasons };
  }
  return { score, reasons };
}

export const SCAM_TEXT_THRESHOLD = 3;
