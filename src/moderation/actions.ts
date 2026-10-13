import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { markDeletedByAutomod } from "../runtime.ts";
import { type ModAction, parseActionId } from "./alerts.ts";

const TIMEOUT_MS = 24 * 60 * 60 * 1000;
const BAN_DELETE_SECONDS = 24 * 60 * 60;

const REQUIRED: Record<ModAction, bigint> = {
  delete: PermissionFlagsBits.ManageMessages,
  timeout: PermissionFlagsBits.ModerateMembers,
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
  dismiss: PermissionFlagsBits.ManageMessages,
};

const DONE: Record<ModAction, string> = {
  delete: "🗑️ 已刪除訊息",
  timeout: "🔇 已禁言 1 天",
  kick: "👢 已踢出",
  ban: "🔨 已封鎖（並刪除 24 小時內訊息）",
  dismiss: "✅ 標記為誤判",
};

/** 處理通報訊息上的按鈕；回傳 false 代表不是這個模組的按鈕 */
export async function handleModerationButton(interaction: ButtonInteraction<"cached">): Promise<boolean> {
  const parsed = parseActionId(interaction.customId) ?? parseLegacyId(interaction.customId);
  if (!parsed) return false;
  const { action, channelId, messageId, userId } = parsed;

  if (!interaction.memberPermissions.has(REQUIRED[action])) {
    await interaction.reply({ content: "❌ 你沒有執行這個動作的權限", flags: MessageFlags.Ephemeral });
    return true;
  }
  await interaction.deferUpdate();

  const reason = `由 ${interaction.user.tag} 透過自動管理通報處理`;
  const guild = interaction.guild;
  let result = DONE[action];
  try {
    if (action === "delete") {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      const target = channel?.isTextBased() ? await channel.messages.fetch(messageId).catch(() => null) : null;
      if (target) {
        markDeletedByAutomod(target.id);
        await target.delete();
      } else {
        result = "🗑️ 訊息已不存在";
      }
    } else if (action === "ban") {
      // 成員已離開也能用 ID 封鎖
      await guild.members.ban(userId, { reason, deleteMessageSeconds: BAN_DELETE_SECONDS });
    } else if (action === "timeout" || action === "kick") {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        result = "⚠️ 使用者已不在伺服器";
      } else if (action === "timeout") {
        if (!member.moderatable) throw new Error("機器人的身分組不夠高，無法禁言");
        await member.timeout(TIMEOUT_MS, reason);
      } else {
        if (!member.kickable) throw new Error("機器人的身分組不夠高，無法踢出");
        await member.kick(reason);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await interaction.followUp({ content: `❌ 執行失敗：${message}`, flags: MessageFlags.Ephemeral });
    return true;
  }

  await recordOutcome(
    interaction,
    action,
    `${result} — <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`,
  );
  return true;
}

/** 在通報上記錄處理結果；封鎖、踢出、誤判後停用全部按鈕，其他動作只停用該按鈕 */
async function recordOutcome(interaction: ButtonInteraction<"cached">, action: ModAction, line: string) {
  const original = interaction.message;
  const embed = EmbedBuilder.from(original.embeds[0] ?? new EmbedBuilder());
  const history = embed.data.fields?.find((f) => f.name === "處理紀錄");
  if (history) history.value = `${history.value}\n${line}`.slice(-1024);
  else embed.addFields({ name: "處理紀錄", value: line });
  if (action === "ban" || action === "kick" || action === "dismiss") embed.setColor(0x747f8d);

  const closeAll = action === "ban" || action === "kick" || action === "dismiss";
  const rows = original.components.map((row) => {
    const builder = new ActionRowBuilder<ButtonBuilder>();
    if (row.type !== ComponentType.ActionRow) return builder;
    for (const component of row.components) {
      if (component.type !== ComponentType.Button) continue;
      const button = ButtonBuilder.from(component);
      if (closeAll || component.customId === interaction.customId) button.setDisabled(true);
      builder.addComponents(button);
    }
    return builder;
  });
  await interaction.editReply({ embeds: [embed], components: rows });
}

/** 舊版通報上的 kick-<id> / ban-<id> 按鈕 */
function parseLegacyId(customId: string) {
  const groups = /^(?<action>kick|ban)-(?<userId>\d+)$/.exec(customId)?.groups;
  if (!groups?.action || !groups.userId) return null;
  return { action: groups.action as ModAction, channelId: "0", messageId: "0", userId: groups.userId };
}
