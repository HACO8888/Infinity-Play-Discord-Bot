const URL_HOST =
  /(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62})(?::\d{1,5})?(?![a-z0-9_-])/gi;

/** 找出文字中所有看起來像網域的字串（小寫、去重） */
export function extractHostnames(normalized: string): string[] {
  const hosts = new Set<string>();
  for (const match of normalized.matchAll(URL_HOST)) {
    if (match[1]) hosts.add(match[1].toLowerCase().replace(/\.$/, ""));
  }
  return [...hosts];
}

/** host 本身與所有上層網域（至少保留兩段），例如 a.b.example.com → a.b.example.com、b.example.com、example.com */
export function domainCandidates(host: string): string[] {
  const labels = host.split(".");
  const candidates: string[] = [];
  for (let i = 0; i <= labels.length - 2; i++) {
    candidates.push(labels.slice(i).join("."));
  }
  return candidates;
}

const VALID_DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/;

/** 解析清單內容：一行一個網域，略過註解、萬用字元與帶路徑的項目 */
export function parseDomainList(text: string): Set<string> {
  const domains = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const domain = line.trim().toLowerCase();
    if (VALID_DOMAIN.test(domain)) domains.add(domain);
  }
  return domains;
}

/** 回傳命中清單的網域（若有） */
export function findListedDomain(hosts: readonly string[], list: ReadonlySet<string>): string | undefined {
  for (const host of hosts) {
    for (const candidate of domainCandidates(host)) {
      if (list.has(candidate)) return candidate;
    }
  }
  return undefined;
}
