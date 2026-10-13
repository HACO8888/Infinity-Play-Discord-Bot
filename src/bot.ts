require("dotenv").config();
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { loadCommands, loadEvents } = require("./loader");

// Message Content 只用於 events/messageCreate.js 的外部邀請連結偵測
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

loadCommands(client);
loadEvents(client);

client.login(process.env.TOKEN);
