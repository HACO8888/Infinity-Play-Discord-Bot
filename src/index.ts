import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";

const manager = new ShardingManager(fileURLToPath(new URL("./bot.ts", import.meta.url)), {
  token: process.env.TOKEN,
});

manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

manager.spawn().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
