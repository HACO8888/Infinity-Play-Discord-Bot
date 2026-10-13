import { ChannelType, EmbedBuilder, SlashCommandBuilder, TimestampStyles, time } from "discord.js";
import { BRAND_COLOR, FOOTER } from "../brand.ts";
import type { Command } from "../types.ts";

export default {
  data: new SlashCommandBuilder().setName("server").setDescription("查看伺服器資訊！").setContexts(0),
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    // withCounts 會回傳大約的成員／上線人數，不需要 Guild Members 與 Presence intent
    const guild = await interaction.client.guilds.fetch({ guild: interaction.guildId, withCounts: true, force: true });
    const channels = guild.channels.cache;
    const emojis = guild.emojis.cache;
    const count = (...types: ChannelType[]) => channels.filter((c) => types.includes(c.type)).size;

    const embed = new EmbedBuilder()
      .setTitle("伺服器資訊")
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: "伺服器名稱", value: guild.name, inline: true },
        { name: "伺服器ID", value: guild.id, inline: true },
        {
          name: "伺服器人數",
          value: `:busts_in_silhouette:總人數 - ${guild.approximateMemberCount ?? guild.memberCount}\n<:Online:746672406411870331>上線 - ${guild.approximatePresenceCount ?? "未知"}`,
          inline: true,
        },
        { name: "伺服器擁有者", value: `<@${guild.ownerId}>`, inline: true },
        { name: "伺服器驗證等級", value: `${guild.verificationLevel}`, inline: true },
        {
          name: `表情總數 - ${emojis.size}`,
          value: `靜態表情 - ${emojis.filter((e) => !e.animated).size}\n動態表情 - ${emojis.filter((e) => e.animated).size}`,
          inline: true,
        },
        {
          name: "加成狀態",
          value: `<:ServerBoost:802751407937290240>等級 - ${guild.premiumTier}\n<:NitroBoost:802751430301319208>加成 - ${guild.premiumSubscriptionCount ?? 0}`,
          inline: true,
        },
        { name: "身分組數", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: `頻道總數 - ${channels.size}`,
          value: [
            `📚類別 - ${count(ChannelType.GuildCategory)}`,
            `📄文字頻道 - ${count(ChannelType.GuildText)}`,
            `🔊語音頻道 - ${count(ChannelType.GuildVoice, ChannelType.GuildStageVoice)}`,
            `📢公告頻道 - ${count(ChannelType.GuildAnnouncement)}`,
            `🎪論壇頻道 - ${count(ChannelType.GuildForum)}`,
            `🧵討論串頻道 - ${count(ChannelType.PublicThread, ChannelType.PrivateThread)}`,
          ].join("\n"),
          inline: true,
        },
        { name: "伺服器創建時間", value: time(guild.createdAt, TimestampStyles.LongDateTime), inline: true },
      )
      .setColor(BRAND_COLOR)
      .setTimestamp()
      .setFooter(FOOTER);
    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
