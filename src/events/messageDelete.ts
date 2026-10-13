import { Events } from "discord.js";
import { codeBlock } from "../moderation/format.ts";
import { sendModLog } from "../modlog/modlog.ts";
import { config, deletedByAutomod } from "../runtime.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.inGuild() || !config.guilds.has(message.guildId)) return;
    if (deletedByAutomod.has(message.id) || message.author?.bot) return;

    await sendModLog(message.guild, (embed) => {
      embed.setTitle("🗑️ 訊息已刪除").addFields({ name: "頻道", value: `<#${message.channelId}>` });
      if (message.partial) {
        // 機器人啟動前或已被移出快取的訊息，只知道 ID
        return embed.setDescription(`訊息 ID \`${message.id}\`（內容不在快取中）`);
      }
      const attachments = [...message.attachments.values()].map((a) => a.name).join("、");
      embed
        .setAuthor({
          name: `${message.author.tag}（${message.author.id}）`,
          iconURL: message.author.displayAvatarURL(),
        })
        .addFields(
          { name: "發送時間", value: `<t:${Math.floor(message.createdTimestamp / 1000)}:f>`, inline: true },
          { name: "內容", value: codeBlock(message.content) },
        );
      if (attachments) embed.addFields({ name: "附件", value: attachments.slice(0, 1024) });
      return embed;
    });
  },
});
