import { parseDomainList } from "./links.ts";

const SOURCE = "https://raw.githubusercontent.com/Discord-AntiScam/scam-links/main/list.txt";
const REFRESH_MS = 6 * 60 * 60 * 1000;

// 這些平台本身是正常服務，就算清單誤收錄也不比對（只會比對到更精確的子網域）
const NEVER_BLOCK = new Set([
  "discord.com",
  "discord.gg",
  "discordapp.com",
  "discord.media",
  "discordapp.net",
  "google.com",
  "youtube.com",
  "youtu.be",
  "github.com",
  "steamcommunity.com",
  "steampowered.com",
  "twitch.tv",
  "x.com",
  "twitter.com",
]);

let domains: ReadonlySet<string> = new Set();
let loadedAt = 0;

export function getScamDomains(): ReadonlySet<string> {
  return domains;
}

export async function refreshScamDomains(): Promise<void> {
  try {
    const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseDomainList(await response.text());
    for (const domain of NEVER_BLOCK) parsed.delete(domain);
    // 防止來源被清空或格式改變時把清單覆蓋成空的
    if (parsed.size < 1000) throw new Error(`list too small (${parsed.size})`);
    domains = parsed;
    loadedAt = Date.now();
    console.log(`Loaded ${parsed.size} scam domains`);
  } catch (error) {
    console.error(`Failed to refresh scam domain list (keeping ${domains.size} entries):`, error);
  }
}

export function startScamDomainRefresh(): void {
  void refreshScamDomains();
  setInterval(() => void refreshScamDomains(), REFRESH_MS).unref();
}

export function scamDomainsAge(): number | null {
  return loadedAt ? Date.now() - loadedAt : null;
}
