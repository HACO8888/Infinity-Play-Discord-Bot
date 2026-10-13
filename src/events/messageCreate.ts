const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const channel = require("../channel.json");

const guildIds = (process.env.GUILD_ID ?? "").split(",").filter(Boolean);

// 允許省略 https://（常見的繞過手法），並涵蓋舊網域 discordapp.com；邀請碼可能含 -（自訂網址）
const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)/gi;

// 欄位上限是 1024 字，並避免訊息內容提前結束 code block
function formatContent(content) {
  const safe = content.replaceAll("```", "`​``");
  const body = safe.length > 1000 ? `${safe.slice(0, 1000)}…` : safe;
  return "```" + body + "```";
}

async function getAllowedCodes(guild) {
  const invites = await guild.invites.fetch();
  const codes = new Set(invites.map((invite) => invite.code));

  if (guild.vanityURLCode) {
    codes.add(guild.vanityURLCode);
  }

  return codes;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!guildIds.includes(message.guild.id)) return;

    const codes = [...message.content.matchAll(inviteRegex)].map((match) => match[1]);
    if (codes.length === 0) return;

    try {
      // 每則訊息只抓一次邀請列表
      const allowedCodes = await getAllowedCodes(message.guild);
      const code = codes.find((c) => !allowedCodes.has(c));
      if (!code) return;

      await message.delete();

      const NotifyEmbed = new EmbedBuilder()
        .setTitle("😒 又多了一個欠BAN的人")
        .addFields(
          {
            name: "發送者:",
            value: `<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "發送頻道:",
            value: `<#${message.channel.id}>`,
            inline: true,
          },
          {
            name: "邀請連結:",
            value: `https://discord.gg/${code}`,
            inline: true,
          },
          {
            name: "訊息內容:",
            value: formatContent(message.content),
            inline: false,
          },
        )
        .setColor("#1cd3aa")
        .setTimestamp()
        .setFooter({
          text: "無限遊玩服務",
          iconURL: "https://cdn.lazco.dev/play-logo.png",
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`kick-${message.author.id}`)
          .setLabel("Kick")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ban-${message.author.id}`)
          .setLabel("Ban")
          .setStyle(ButtonStyle.Danger),
      );

      const sendChannel =
        message.guild.channels.cache.get(channel[message.guild.id]) ?? message.channel;
      await sendChannel.send({ embeds: [NotifyEmbed], components: [row] });
    }
    catch (error) {
      console.error("Error processing invite:", error);
    }
  },
};
