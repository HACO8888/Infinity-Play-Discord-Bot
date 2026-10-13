import type { AutomodConfig, DetectionAction } from "../config.ts";
import { SCAM_TEXT_THRESHOLD, scoreScamText } from "./heuristics.ts";
import { findInvites, type InviteMatch } from "./invites.ts";
import { extractHostnames, findListedDomain } from "./links.ts";

export type FindingKind = "invite" | "scamLink" | "scamText" | "mentionSpam" | "flood";

export interface Finding {
  kind: FindingKind;
  action: DetectionAction;
  /** 給管理員看的一行說明 */
  summary: string;
}

export const KIND_LABEL: Record<FindingKind, string> = {
  invite: "外部邀請連結",
  scamLink: "詐騙／釣魚網址",
  scamText: "疑似詐騙訊息",
  mentionSpam: "大量提及",
  flood: "洗版",
};

export interface InviteResolver {
  /** 回傳 true 代表邀請屬於本伺服器或在允許清單內 */
  isAllowed(invite: InviteMatch): Promise<boolean>;
}

export interface ScanInput {
  normalized: string;
  mentionCount: number;
}

/** 對單則訊息內容做所有內容型偵測（洗版另外由 RateTracker 判斷） */
export async function scanContent(
  input: ScanInput,
  automod: AutomodConfig,
  scamDomains: ReadonlySet<string>,
  invites: InviteResolver,
): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (automod.invites !== "off") {
    const external: string[] = [];
    for (const invite of findInvites(input.normalized)) {
      if (!(await invites.isAllowed(invite))) external.push(invite.url);
    }
    if (external.length > 0) {
      findings.push({ kind: "invite", action: automod.invites, summary: external.slice(0, 5).join("、") });
    }
  }

  if (automod.scamLinks !== "off" && scamDomains.size > 0) {
    const domain = findListedDomain(extractHostnames(input.normalized), scamDomains);
    if (domain) findings.push({ kind: "scamLink", action: automod.scamLinks, summary: `命中詐騙網域清單：${domain}` });
  }

  if (automod.scamText !== "off") {
    const { score, reasons } = scoreScamText(input.normalized);
    if (score >= SCAM_TEXT_THRESHOLD) {
      findings.push({ kind: "scamText", action: automod.scamText, summary: `${reasons.join("、")}（分數 ${score}）` });
    }
  }

  if (automod.mentionSpam !== "off" && input.mentionCount >= automod.maxMentions) {
    findings.push({
      kind: "mentionSpam",
      action: automod.mentionSpam,
      summary: `一則訊息提及 ${input.mentionCount} 個對象`,
    });
  }

  return findings;
}

/** 任何一項設定為 delete 就刪除訊息 */
export function shouldDelete(findings: readonly Finding[]): boolean {
  return findings.some((f) => f.action === "delete");
}
