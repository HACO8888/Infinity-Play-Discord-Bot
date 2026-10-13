import { Events } from "discord.js";
import { inspectPresence } from "../moderation/presence.ts";
import { defineEvent } from "../types.ts";

// 需要 Presence intent；只看自訂狀態文字，不保存任何狀態
export default defineEvent({
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    await inspectPresence(oldPresence, newPresence);
  },
});
