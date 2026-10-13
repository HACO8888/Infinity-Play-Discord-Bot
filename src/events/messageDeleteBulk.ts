import { Events } from "discord.js";
import { sendModLog } from "../modlog/modlog.ts";
import { config } from "../runtime.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.MessageBulkDelete,
  async execute(messages, channel) {
    if (!config.guilds.has(channel.guildId)) return;
    await sendModLog(channel.guild, (embed) =>
      embed.setTitle("🧹 大量刪除訊息").setDescription(`<#${channel.id}> 一次刪除了 ${messages.size} 則訊息`),
    );
  },
});
