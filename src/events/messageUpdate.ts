import { Events } from "discord.js";
import { codeBlock } from "../moderation/format.ts";
import { inspectMessage } from "../moderation/pipeline.ts";
import { sendModLog } from "../modlog/modlog.ts";
import { config } from "../runtime.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.inGuild() || newMessage.author.bot || !config.guilds.has(newMessage.guildId)) return;
    // 只有內容真的改變才處理（嵌入預覽載入也會觸發 messageUpdate）
    if (oldMessage.partial || oldMessage.content === newMessage.content) return;

    // 先貼正常訊息、之後再編輯成廣告是常見的繞過手法
    await inspectMessage(newMessage, { edited: true });

    await sendModLog(newMessage.guild, (embed) =>
      embed
        .setTitle("✏️ 訊息已編輯")
        .setAuthor({
          name: `${newMessage.author.tag}（${newMessage.author.id}）`,
          iconURL: newMessage.author.displayAvatarURL(),
        })
        .addFields(
          { name: "頻道", value: `<#${newMessage.channelId}> · [跳到訊息](${newMessage.url})` },
          { name: "編輯前", value: codeBlock(oldMessage.content ?? "", 500) },
          { name: "編輯後", value: codeBlock(newMessage.content, 500) },
        ),
    );
  },
});
