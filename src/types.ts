import type { ChatInputCommandInteraction, ClientEvents, SlashCommandBuilder } from "discord.js";

export interface Command {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute(interaction: ChatInputCommandInteraction): Promise<unknown>;
}

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<unknown> | unknown;
}

/** 讓 TypeScript 檢查事件名稱與參數是否對得上 */
export function defineEvent<K extends keyof ClientEvents>(event: Event<K>): Event<K> {
  return event;
}
