const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildIds = process.env.GUILD_ID.split(',');
    if (guildIds.includes(message.guild.id)) {

      // 使用正則表達式來檢測 Discord 邀請連結
      const inviteRegex = /https?:\/\/(?:www\.)?discord\.(?:gg|com\/invite)\/([a-zA-Z0-9]+)/g;
      const matches = [...message.content.matchAll(inviteRegex)];

      if (matches.length > 0) {
        for (const match of matches) {
          const code = match[1]; // 提取邀請碼

          console.log(`Found invite code: ${code}`);

          // 檢查邀請碼格式是否有效
          const validCodePattern = /^[0-9a-zA-Z]+$/;
          if (!validCodePattern.test(code)) {
            console.log(`Invalid code format: ${code}`);
            continue;
          }

          try {
            // 獲取伺服器邀請列表
            const invites = await message.guild.invites.fetch();
            const inviteCodes = invites.map((invite) => invite.code);

            // 檢查是否為本伺服器的邀請
            if (inviteCodes.includes(code)) {
              console.log(`Code ${code} is from this server, allowing`);
              continue;
            }

            // 如果伺服器有自訂 URL，也要檢查
            if (message.guild.vanityURLCode) {
              try {
                const vanityData = await message.guild.fetchVanityData();
                if (code === vanityData.code) {
                  console.log(`Code ${code} is the server's vanity URL, allowing`);
                  continue;
                }
              } catch (error) {
                console.error('Error fetching vanity data:', error);
              }
            }

            // 如果到這裡，表示是外部邀請連結，需要刪除
            console.log(`Deleting message with external invite code: ${code}`);
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
                  value: "```" + message.content + "```",
                  inline: false,
                }
              );

            // 如果伺服器有自訂 URL，發送到指定頻道
            if (message.guild.vanityURLCode) {
              const channel = message.guild.channels.cache.get("967374280381849601");
              if (channel) {
                await channel.send({ embeds: [NotifyEmbed] });
              } else {
                await message.channel.send({ embeds: [NotifyEmbed] });
              }
            } else {
              await message.channel.send({ embeds: [NotifyEmbed] });
            }

            // 找到一個外部邀請就刪除訊息，不需要繼續檢查其他的
            break;

          } catch (error) {
            console.error('Error processing invite:', error);
          }
        }
      }
    }
  },
};