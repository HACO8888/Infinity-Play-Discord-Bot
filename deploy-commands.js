require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    for (const guildId of process.env.GUILD_ID.split(",")) {
      console.log(`Refreshing commands for guild: ${guildId}`);

      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.ID, guildId),
        { body: commands }
      );
      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    }
  } catch (error) {
    console.error(error);
  }
})();
