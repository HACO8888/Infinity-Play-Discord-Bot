import { Events, MessageFlags } from "discord.js";
import { handleModerationButton } from "../moderation/actions.ts";
import { handleRaidButton } from "../moderation/raidAlert.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
      } else if (interaction.isButton() && interaction.inCachedGuild()) {
        if (!(await handleRaidButton(interaction))) await handleModerationButton(interaction);
      }
    } catch (error) {
      console.error("Interaction failed:", error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ 處理時發生錯誤", flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }
  },
});
