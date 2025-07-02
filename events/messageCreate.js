const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildIds = process.env.GUILD_ID.split(',');
    if (guildIds.includes(message.guild.id)) {
      if (
        message.content.includes("discord.gg") ||
        message.content.includes("discord.com/invite")
      ) {
        const links = ["discord.gg", "discord.com/invite"];
        links.forEach(async (link) => {
          if (!message.content.includes(link)) return;
          let code = message.content.split(link)[1].split(" ")[0];
          if (typeof code === "string" && code.length === 0) return;
          if (code === "/") return;
          code = code.split("/")[1];
          if (!message.guild.vanityURLCode) {
            let type = /^[0-9a-zA-Z]*$/;
            let invites = await message.guild.invites.fetch();
            let invitesCode = invites.map((i) => [i.code]);
            if (guildIds.includes(message.guild.id)) return;
            if (invitesCode.toString().includes(code)) return;
            if (!type.test(code)) return;
            message.delete();
            const NotifyEmbed = new EmbedBuilder()
              .setTitle("😒 又多了一個欠BAN的人")
              .addFields(
                {
                  name: "發送者:",
                  value: "<@" + message.author.id + ">",
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
                  value: "```" + message.content + "```",
                  inline: false,
                }
              );
            return await message.channel.send({ embeds: [NotifyEmbed] });
          } else {
            await message.guild.fetchVanityData().then(async (res) => {
              let type = /^[0-9a-zA-Z]*$/;
              let invites = await message.guild.invites.fetch();
              let invitesCode = invites.map((i) => [i.code]);
              if (!guildIds.includes(message.guild.id)) return;
              if (invitesCode.toString().includes(code)) return;
              if (code === res.code) return;
              if (!type.test(code)) return;
              message.delete();
              let channel =
                message.guild.channels.cache.get("967374280381849601");
              const NotifyEmbed = new EmbedBuilder()
                .setTitle("😒 又多了一個欠BAN的人")
                .addFields(
                  {
                    name: "發送者:",
                    value: "<@" + message.author.id + ">",
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
                    value: "```" + message.content + "```",
                    inline: false,
                  }
                );
              return await channel.send({ embeds: [NotifyEmbed] });
            });
          }
        });
      }
    };
  },
};
