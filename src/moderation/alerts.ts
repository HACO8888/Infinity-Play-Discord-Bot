import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type GuildTextBasedChannel,
  type Message,
  type MessageCreateOptions,
} from "discord.js";
import { ALERT_COLOR, FOOTER } from "../brand.ts";
import { config } from "../runtime.ts";
import { codeBlock } from "./format.ts";
import { type Finding, KIND_LABEL } from "./scanner.ts";

export type ModAction = "delete" | "timeout" | "kick" | "ban" | "dismiss";

/** customId：mod:<動作>:<頻道 ID>:<訊息 ID>:<使用者 ID> */
export function actionId(action: ModAction, channelId: string, messageId: string, userId: string): string {
  return `mod:${action}:${channelId}:${messageId}:${userId}`;
}

export function parseActionId(customId: string) {
  const groups =
    /^mod:(?<action>delete|timeout|kick|ban|dismiss):(?<channelId>\d+):(?<messageId>\d+):(?<userId>\d+)$/.exec(
      customId,
    )?.groups;
  if (!groups?.action || !groups.channelId || !groups.messageId || !groups.userId) return null;
  return {
    action: groups.action as ModAction,
    channelId: groups.channelId,
    messageId: groups.messageId,
    userId: groups.userId,
  };
}

export function actionRows(message: { channelId: string; id: string; author: { id: string } }, deleted: boolean) {
  const id = (action: ModAction) => actionId(action, message.channelId, message.id, message.author.id);
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(id("delete"))
        .setLabel(deleted ? "已自動刪除" : "刪除訊息")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(deleted),
      new ButtonBuilder().setCustomId(id("timeout")).setLabel("禁言 1 天").setEmoji("🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(id("kick")).setLabel("踢出").setEmoji("👢").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(id("ban")).setLabel("封鎖").setEmoji("🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(id("dismiss"))
        .setLabel("誤判，忽略")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}

/** 訊息本身 + 轉發的訊息內容 */
export function messageText(message: Message): string {
  const parts = [message.content];
  for (const snapshot of message.messageSnapshots.values()) {
    if (snapshot.content) parts.push(`（轉發）${snapshot.content}`);
  }
  return parts.filter(Boolean).join("\n");
}

export function buildAlert(message: Message<true>, findings: readonly Finding[], deleted: boolean, edited: boolean) {
  const embed = new EmbedBuilder()
    .setColor(ALERT_COLOR)
    .setTitle(deleted ? "🚨 已自動刪除可疑訊息" : "⚠️ 偵測到可疑訊息，請管理員確認")
    .setAuthor({ name: `${message.author.tag}（${message.author.id}）`, iconURL: message.author.displayAvatarURL() })
    .addFields(
      { name: "發送者", value: `<@${message.author.id}>`, inline: true },
      { name: "頻道", value: `<#${message.channelId}>`, inline: true },
      {
        name: "訊息",
        value: deleted ? "已刪除" : `[跳到訊息](${message.url})${edited ? "（編輯後）" : ""}`,
        inline: true,
      },
      {
        name: "偵測結果",
        value: findings
          .map((f) => `• **${KIND_LABEL[f.kind]}**：${f.summary}`)
          .join("\n")
          .slice(0, 1024),
      },
      { name: "訊息內容", value: codeBlock(messageText(message)) },
    )
    .setTimestamp()
    .setFooter(FOOTER);
  return {
    embeds: [embed],
    components: actionRows(message, deleted),
    allowedMentions: { parse: [] },
  } satisfies MessageCreateOptions;
}

export async function alertChannel(message: Message<true>): Promise<GuildTextBasedChannel | null> {
  const channelId = config.guilds.get(message.guildId)?.alertChannelId;
  if (!channelId) return message.channel;
  const channel = await message.guild.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}
