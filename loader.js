const fs = require("node:fs");
const path = require("node:path");

const commandsPath = path.join(__dirname, "commands");
const eventsPath = path.join(__dirname, "events");

function listJSFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(dir, file));
}

function requireFresh(filePath) {
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
}

function loadCommands(client) {
  let success = 0;
  let errors = 0;

  client.commands.clear();

  for (const filePath of listJSFiles(commandsPath)) {
    try {
      const command = requireFresh(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        success++;
      }
      else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
        errors++;
      }
    }
    catch (error) {
      console.error(`載入指令 ${filePath} 時發生錯誤:`, error);
      errors++;
    }
  }

  return { success, errors };
}

// 只移除自己註冊過的 listener，避免重新載入後同一事件被處理兩次
function loadEvents(client, { reload = false } = {}) {
  let success = 0;
  let errors = 0;

  client.eventListeners ??= [];
  for (const { name, listener } of client.eventListeners) {
    client.off(name, listener);
  }
  client.eventListeners = [];

  for (const filePath of listJSFiles(eventsPath)) {
    try {
      const event = requireFresh(filePath);
      if (!event.name) {
        console.warn(`事件 ${filePath} 缺少必要的 "name" 屬性`);
        errors++;
        continue;
      }
      // once 事件（例如 ClientReady）已經觸發過，重新載入時不再註冊
      if (event.once) {
        if (!reload) client.once(event.name, (...args) => event.execute(...args));
        success++;
        continue;
      }
      const listener = (...args) => event.execute(...args);
      client.on(event.name, listener);
      client.eventListeners.push({ name: event.name, listener });
      success++;
    }
    catch (error) {
      console.error(`載入事件 ${filePath} 時發生錯誤:`, error);
      errors++;
    }
  }

  return { success, errors };
}

module.exports = { loadCommands, loadEvents };
