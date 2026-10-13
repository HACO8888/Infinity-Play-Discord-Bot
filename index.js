require("dotenv").config();
const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./bot.js", {
  token: process.env.TOKEN,
});

manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

manager.spawn().catch((error) => {
  console.error(error);
  process.exit(1);
});
