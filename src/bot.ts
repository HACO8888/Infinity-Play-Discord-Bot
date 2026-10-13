import { Client, Collection, GatewayIntentBits, Options, Partials } from "discord.js";
import automod from "./commands/automod.ts";
import info from "./commands/info.ts";
import ping from "./commands/ping.ts";
import server from "./commands/server.ts";
import guildAuditLogEntryCreate from "./events/guildAuditLogEntryCreate.ts";
import guildMemberAdd from "./events/guildMemberAdd.ts";
import guildMemberRemove from "./events/guildMemberRemove.ts";
import guildMemberUpdate from "./events/guildMemberUpdate.ts";
import interactionCreate from "./events/interactionCreate.ts";
import messageCreate from "./events/messageCreate.ts";
import messageDelete from "./events/messageDelete.ts";
import messageDeleteBulk from "./events/messageDeleteBulk.ts";
import messageUpdate from "./events/messageUpdate.ts";
import presenceUpdate from "./events/presenceUpdate.ts";
import ready from "./events/ready.ts";
import { membersEnabled, presencesEnabled } from "./runtime.ts";
import type { Command, Event } from "./types.ts";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  // 特權：偵測邀請連結、詐騙訊息，以及 mod log 記錄被刪除／編輯的訊息
  GatewayIntentBits.MessageContent,
  // 非特權：接收審核日誌事件（踢出、封鎖、禁言）
  GatewayIntentBits.GuildModeration,
];
// 特權：加入／離開紀錄、新帳號警示、防突襲、冒充偵測、處罰身分組防逃避
if (membersEnabled) intents.push(GatewayIntentBits.GuildMembers);
// 特權：自訂狀態詐騙偵測
if (presencesEnabled) intents.push(GatewayIntentBits.GuildPresences);

const client = new Client({
  intents,
  // 成員不在快取時仍要收到更新事件
  partials: [Partials.GuildMember],
  // 不快取上線狀態，成員快取也設上限，避免大型伺服器吃掉記憶體
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    PresenceManager: 0,
    GuildMemberManager: { maxSize: 2000, keepOverLimit: (member) => member.id === member.client.user.id },
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    users: { interval: 3600, filter: () => (user) => user.id !== user.client.user?.id },
  },
});

client.commands = new Collection([automod, info, ping, server].map((c) => [c.data.name, c]));

const events: Event[] = [
  ready,
  interactionCreate,
  messageCreate,
  messageUpdate,
  messageDelete,
  messageDeleteBulk,
  guildAuditLogEntryCreate,
  ...(membersEnabled ? [guildMemberAdd, guildMemberRemove, guildMemberUpdate] : []),
  ...(presencesEnabled ? [presenceUpdate] : []),
] as Event[];
for (const event of events) {
  const listener = (...args: unknown[]) => (event.execute as (...a: unknown[]) => unknown)(...args);
  if (event.once) client.once(event.name, listener);
  else client.on(event.name, listener);
}

process.on("unhandledRejection", (error) => console.error("Unhandled rejection:", error));

await client.login(process.env.TOKEN);
