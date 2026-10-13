import { Events } from "discord.js";
import { inspectMemberName } from "../moderation/members.ts";
import { accountAgeDays } from "../moderation/raid.ts";
import { sendRaidAlert } from "../moderation/raidAlert.ts";
import { sendModLog } from "../modlog/modlog.ts";
import { config, joinTracker, roleStore } from "../runtime.ts";
import { defineEvent } from "../types.ts";

// 需要 Server Members intent
export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    const guildConfig = config.guilds.get(member.guild.id);
    if (!guildConfig) return;
    const { automod } = guildConfig;
    const age = accountAgeDays(member.user.createdTimestamp);
    const isNew = age < automod.newAccountDays;

    // 處罰身分組防逃避：退出再加入時補回
    const persisted = (roleStore?.list(member.guild.id, member.id) ?? []).filter((id) =>
      guildConfig.persistRoleIds.includes(id),
    );
    if (persisted.length > 0) {
      await member.roles
        .add(persisted, "退出後重新加入，補回處罰身分組")
        .catch((error: unknown) => console.error("Failed to restore roles:", error));
    }

    await sendModLog(member.guild, (embed) =>
      embed
        .setColor(isNew ? 0xfaa61a : 0x43b581)
        .setTitle(isNew ? "📥 成員加入（⚠️ 新帳號）" : "📥 成員加入")
        .setAuthor({ name: `${member.user.tag}（${member.id}）`, iconURL: member.user.displayAvatarURL() })
        .addFields(
          { name: "成員", value: `<@${member.id}>`, inline: true },
          {
            name: "帳號建立",
            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>（${age} 天）`,
            inline: true,
          },
          { name: "目前人數", value: `${member.guild.memberCount}`, inline: true },
          ...(persisted.length > 0
            ? [{ name: "已補回處罰身分組", value: persisted.map((id) => `<@&${id}>`).join(" ") }]
            : []),
        ),
    );

    if (automod.raid !== "off") {
      const raid = joinTracker.record(
        member.guild.id,
        { userId: member.id, at: Date.now(), accountCreatedAt: member.user.createdTimestamp },
        automod.raidJoins,
        automod.raidWindowSeconds,
      );
      if (raid) await sendRaidAlert(member.guild, raid.joins, automod.raidWindowSeconds, automod.newAccountDays);
    }

    await inspectMemberName(member);
  },
});
