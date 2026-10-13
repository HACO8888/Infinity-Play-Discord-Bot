import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { BRAND_COLOR, FOOTER } from "../brand.ts";
import type { Command } from "../types.ts";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("取得機器人延遲！"),
  async execute(interaction) {
    const response = await interaction.reply({
      content: "<a:loading:1057261323735547934>正在讀取...",
      withResponse: true,
    });
    const roundTrip = (response.resource?.message?.createdTimestamp ?? Date.now()) - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("機器人延遲")
      .setDescription(
        `<a:check:1057263917732220980> WebSocket \`${interaction.client.ws.ping}\` 毫秒\n來回延遲 \`${roundTrip}\` 毫秒`,
      )
      .setTimestamp()
      .setFooter(FOOTER);
    await interaction.editReply({ content: null, embeds: [embed] });
  },
} satisfies Command;
