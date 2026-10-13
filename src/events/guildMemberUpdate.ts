import { Events } from "discord.js";
import { inspectMemberName } from "../moderation/members.ts";
import { sendModLog } from "../modlog/modlog.ts";
import { config, roleStore } from "../runtime.ts";
import { defineEvent } from "../types.ts";

// 需要 Server Members intent
export default defineEvent({
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const guildConfig = config.guilds.get(newMember.guild.id);
    if (!guildConfig) return;

    // 記錄處罰身分組的增減（舊成員資料不在快取時無法比對，以目前狀態為準）
    for (const roleId of guildConfig.persistRoleIds) {
      const has = newMember.roles.cache.has(roleId);
      if (has) roleStore.add(newMember.guild.id, newMember.id, roleId);
      else if (!oldMember.partial) roleStore.remove(newMember.guild.id, newMember.id, roleId);
    }

    if (!oldMember.partial && oldMember.nickname !== newMember.nickname) {
      await sendModLog(newMember.guild, (embed) =>
        embed
          .setTitle("🏷️ 暱稱變更")
          .setAuthor({ name: `${newMember.user.tag}（${newMember.id}）`, iconURL: newMember.user.displayAvatarURL() })
          .addFields(
            { name: "變更前", value: oldMember.nickname ?? "（無）", inline: true },
            { name: "變更後", value: newMember.nickname ?? "（無）", inline: true },
          ),
      );
    }

    // 改名冒充管理員是常見的詐騙手法；同一個名稱只通報一次
    await inspectMemberName(newMember);
  },
});
