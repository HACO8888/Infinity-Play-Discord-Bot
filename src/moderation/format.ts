/** Embed 欄位上限 1024 字，並避免內容提前結束 code block */
export function codeBlock(content: string, max = 1000): string {
  if (!content.trim()) return "（沒有文字內容）";
  const safe = content.replaceAll("```", "`​``");
  const body = safe.length > max ? `${safe.slice(0, max)}…` : safe;
  return `\`\`\`${body}\`\`\``;
}
