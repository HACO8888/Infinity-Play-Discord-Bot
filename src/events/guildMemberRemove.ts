import { Events } from "discord.js";
import { sendModLog } from "../modlog/modlog.ts";
import { config } from "../runtime.ts";
import { defineEvent } from "../types.ts";

// 需要 Server Members intent
export default defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (!config.guilds.has(member.guild.id)) return;
    await sendModLog(member.guild, (embed) => {
      embed
        .setColor(0x747f8d)
        .setTitle("📤 成員離開")
        .setAuthor({ name: `${member.user.tag}（${member.id}）`, iconURL: member.user.displayAvatarURL() })
        .addFields({ name: "成員", value: `<@${member.id}>`, inline: true });
      if (member.joinedTimestamp) {
        embed.addFields({
          name: "加入時間",
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          inline: true,
        });
      }
      return embed;
    });
  },
});
