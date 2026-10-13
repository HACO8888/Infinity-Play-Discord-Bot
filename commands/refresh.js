const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const OWNER_ID = "508964901415550976";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("refresh")
    .setDescription("重新載入指令或事件")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("選擇要重新載入的類型")
        .setRequired(true)
        .addChoices(
          { name: "指令 (Commands)", value: "commands" },
          { name: "事件 (Events)", value: "events" },
          { name: "全部 (All)", value: "all" },
        ),
    ),

  async execute(interaction) {
    // 檢查權限
    if (interaction.user.id !== OWNER_ID) {
      return await interaction.reply({
        content: "❌ 你沒有權限使用此指令！",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 在執行時才載入，避免 loader 與本檔互相 require
    const { loadCommands, loadEvents } = require("../loader");
    const { client } = interaction;
    const type = interaction.options.getString("type");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let refreshedCount = 0;
    let errorCount = 0;
    const results = [];

    if (type === "commands" || type === "all") {
      const commandResult = loadCommands(client);
      refreshedCount += commandResult.success;
      errorCount += commandResult.errors;
      results.push(`📝 指令: ${commandResult.success} 個成功，${commandResult.errors} 個失敗`);
    }

    if (type === "events" || type === "all") {
      const eventResult = loadEvents(client, { reload: true });
      refreshedCount += eventResult.success;
      errorCount += eventResult.errors;
      results.push(`⚡ 事件: ${eventResult.success} 個成功，${eventResult.errors} 個失敗`);
    }

    const embed = new EmbedBuilder()
      .setTitle("🔄 重新載入完成")
      .setColor("#1cd3aa")
      .setDescription(results.join("\n"))
      .addFields(
        { name: "✅ 成功", value: `${refreshedCount}`, inline: true },
        { name: "❌ 失敗", value: `${errorCount}`, inline: true },
        { name: "📊 總計", value: `${refreshedCount + errorCount}`, inline: true },
      )
      .setTimestamp()
      .setFooter({
        text: `由 ${interaction.user.tag} 執行`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
