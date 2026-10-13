import { Events } from "discord.js";
import { inspectMessage } from "../moderation/pipeline.ts";
import { defineEvent } from "../types.ts";

export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    await inspectMessage(message);
  },
});
