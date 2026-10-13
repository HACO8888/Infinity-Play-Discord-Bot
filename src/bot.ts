import { Client, Collection, GatewayIntentBits } from "discord.js";
import automod from "./commands/automod.ts";
import info from "./commands/info.ts";
import ping from "./commands/ping.ts";
import server from "./commands/server.ts";
import guildAuditLogEntryCreate from "./events/guildAuditLogEntryCreate.ts";
import interactionCreate from "./events/interactionCreate.ts";
import messageCreate from "./events/messageCreate.ts";
import messageDelete from "./events/messageDelete.ts";
import messageDeleteBulk from "./events/messageDeleteBulk.ts";
import messageUpdate from "./events/messageUpdate.ts";
import ready from "./events/ready.ts";
import type { Command, Event } from "./types.ts";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // 特權 intent：偵測邀請連結、詐騙訊息，以及 mod log 記錄被刪除／編輯的訊息
    GatewayIntentBits.MessageContent,
    // 非特權：接收審核日誌事件（踢出、封鎖、禁言）
    GatewayIntentBits.GuildModeration,
  ],
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
] as Event[];
for (const event of events) {
  const listener = (...args: unknown[]) => (event.execute as (...a: unknown[]) => unknown)(...args);
  if (event.once) client.once(event.name, listener);
  else client.on(event.name, listener);
}

process.on("unhandledRejection", (error) => console.error("Unhandled rejection:", error));

await client.login(process.env.TOKEN);
