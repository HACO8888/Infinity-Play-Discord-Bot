import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  type Guild,
  GuildVerificationLevel,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { ALERT_COLOR, FOOTER } from "../brand.ts";
import { configuredAlertChannel } from "./alerts.ts";
import { accountAgeDays, type JoinRecord } from "./raid.ts";

export async function sendRaidAlert(
  guild: Guild,
  joins: readonly JoinRecord[],
  windowSeconds: number,
  newAccountDays: number,
) {
  const newAccounts = joins.filter((j) => accountAgeDays(j.accountCreatedAt) < newAccountDays).length;
  const list = joins
    .slice(-25)
    .map((j) => `<@${j.userId}>（帳號 ${accountAgeDays(j.accountCreatedAt)} 天）`)
    .join("\n");
  const embed = new EmbedBuilder()
    .setColor(ALERT_COLOR)
    .setTitle("🚨 偵測到可能的突襲（大量成員加入）")
    .setDescription(
      `${windowSeconds} 秒內有 ${joins.length} 人加入，其中 ${newAccounts} 個是未滿 ${newAccountDays} 天的新帳號。`,
    )
    .addFields({ name: "最近加入的成員", value: list.slice(0, 1024) || "—" })
    .setTimestamp()
    .setFooter(FOOTER);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("raid:pause")
      .setLabel("暫停邀請 24 小時")
      .setEmoji("⏸️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("raid:verify")
      .setLabel("驗證等級調為最高")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("raid:dismiss").setLabel("誤判，忽略").setEmoji("✅").setStyle(ButtonStyle.Success),
  );
  const channel = await configuredAlertChannel(guild);
  await channel
    ?.send({ embeds: [embed], components: [row], allowedMentions: { parse: [] } })
    .catch((error: unknown) => console.error("Failed to send raid alert:", error));
}

export async function handleRaidButton(interaction: ButtonInteraction<"cached">): Promise<boolean> {
  const action = /^raid:(pause|verify|dismiss)$/.exec(interaction.customId)?.[1];
  if (!action) return false;
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "❌ 需要「管理伺服器」權限", flags: MessageFlags.Ephemeral });
    return true;
  }
  const reason = `由 ${interaction.user.tag} 透過突襲通報處理`;
  let line: string;
  try {
    if (action === "pause") {
      await interaction.guild.setIncidentActions({ invitesDisabledUntil: Date.now() + 24 * 60 * 60 * 1000 });
      line = "⏸️ 已暫停邀請 24 小時";
    } else if (action === "verify") {
      await interaction.guild.setVerificationLevel(GuildVerificationLevel.VeryHigh, reason);
      line = "🛡️ 已將驗證等級調為最高（需驗證手機）";
    } else {
      line = "✅ 標記為誤判";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await interaction.reply({ content: `❌ 執行失敗：${message}`, flags: MessageFlags.Ephemeral });
    return true;
  }
  const embed = EmbedBuilder.from(interaction.message.embeds[0] ?? new EmbedBuilder()).addFields({
    name: "處理紀錄",
    value: `${line} — <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`,
  });
  const rows = interaction.message.components.map((row) =>
    ActionRowBuilder.from<ButtonBuilder>(row as never).setComponents(
      ...("components" in row ? row.components : []).map((c) =>
        ButtonBuilder.from(c as never).setDisabled(
          action === "dismiss" || ("customId" in c && c.customId === interaction.customId),
        ),
      ),
    ),
  );
  await interaction.update({ embeds: [embed], components: rows });
  return true;
}
