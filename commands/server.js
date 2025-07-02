const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("查看伺服器資訊！"),
  async execute(interaction) {
    let time = interaction.channel.guild.createdAt.toUTCString().split(" ");
    let hor = interaction.channel.guild.createdAt.getUTCHours(8);
    let H = (hor + 8) + time[4].substring(2);
    let ctime = time[3] + " " + H + " " + time[2] + " " + time[1] + ", " + time[0] + " UTC+8";

    let Embed = new EmbedBuilder()
      .setTitle(`伺服器資訊`)
      .setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}.png`)
      .addFields(
        { name: `伺服器名稱`, value: `${interaction.guild.name}`, inline: true },
        { name: `伺服器ID`, value: `${interaction.guild.id}`, inline: true },
        { name: `伺服器人數`, value: `:busts_in_silhouette:總人數 - ${interaction.guild.memberCount}\n:bust_in_silhouette:用戶 - ${interaction.guild.members.cache.filter(member => !member.user.bot).size}\n:robot:機器人 - ${interaction.guild.members.cache.filter(member => member.user.bot).size}`, inline: true },
        { name: `伺服器擁有者`, value: `<@${interaction.guild.ownerId}>`, inline: true },
        { name: `伺服器驗證等級`, value: `${interaction.guild.verificationLevel}`, inline: true },
        { name: `表情總數 - ${interaction.guild.emojis.cache.size}`, value: `靜態表情 - ${interaction.guild.emojis.cache.filter(emojis => !emojis.animated).size}\n動態表情 - ${interaction.guild.emojis.cache.filter(emojis => emojis.animated).size}`, inline: true },
        { name: `加成狀態`, value: `<:ServerBoost:802751407937290240>等級 - ${interaction.guild.premiumTier}\n<:NitroBoost:802751430301319208>加成 - ${interaction.guild.premiumSubscriptionCount}`, inline: true },
        { name: `身分組數`, value: `${interaction.guild.roles.cache.size}`, inline: true },
        { name: `人數狀態 - ${interaction.guild.memberCount}`, value: `<:Online:746672406411870331>上線 - ${interaction.guild.members.cache.filter(member => member.presence?.status === 'online').size}\n<:Idle:746672449353154650>閒置 - ${interaction.guild.members.cache.filter(member => member.presence?.status === 'idle').size}\n<:Dnd:746672747287019610>請勿打擾 - ${interaction.guild.members.cache.filter(member => member.presence?.status === 'dnd').size}\n<:Offline:746672917584281630>離線/隱形 - ${interaction.guild.members.cache.filter(member => !member.presence || member.presence.status === 'offline').size}`, inline: true },
        { name: `頻道總數 - ${interaction.guild.channels.cache.size}`, value: `📚類別 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size}\n📄文字頻道 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}\n🔊語音頻道 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}\n📢公告頻道 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size}\n🎪論壇頻道 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size}\n🧵討論串頻道 - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.PublicThread || c.type === ChannelType.PrivateThread).size}`, inline: true },
        { name: `伺服器創建時間`, value: `${ctime}`, inline: true }
      )
      .setColor("#1cd3aa")
      .setTimestamp()
      .setFooter({
        text: "無限遊玩服務",
        iconURL: "https://cdn.lazco.dev/play-logo.png",
      });
    await interaction.reply({
      embeds: [Embed],
    });
  },
};
