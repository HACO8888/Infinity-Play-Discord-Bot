import { EmbedBuilder, type Guild } from "discord.js";
import { LOG_COLOR } from "../brand.ts";
import { config } from "../runtime.ts";

/** 發到該伺服器設定的 log 頻道；沒設定就不記錄 */
export async function sendModLog(guild: Guild, build: (embed: EmbedBuilder) => EmbedBuilder): Promise<void> {
  const channelId = config.guilds.get(guild.id)?.logChannelId;
  if (!channelId) return;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = build(new EmbedBuilder().setColor(LOG_COLOR).setTimestamp());
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch((error: unknown) => {
    console.error(`Failed to send mod log in guild ${guild.id}:`, error);
  });
}
