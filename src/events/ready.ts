import { Events } from "discord.js";
import { setFooterIcon } from "../brand.ts";
import { startScamDomainRefresh } from "../moderation/scamDomains.ts";
import { config } from "../runtime.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    setFooterIcon(client.user.displayAvatarURL({ extension: "png", size: 64 }));
    startScamDomainRefresh();

    // 啟動時把指令同步到本 shard 負責的伺服器，不必再手動執行部署腳本
    const body = [...client.commands.values()].map((c) => c.data.toJSON());
    for (const guildId of config.guilds.keys()) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      await guild.commands
        .set(body)
        .then(() => console.log(`Synced ${body.length} commands to ${guild.name}`))
        .catch((error: unknown) => console.error(`Failed to sync commands to ${guildId}:`, error));
    }
  },
});
