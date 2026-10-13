import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * 只保存「處罰身分組」：哪位成員在哪個伺服器有哪些處罰身分組，用來在退出再加入時補回。
 * 身分組被移除時就刪除紀錄，不保存其他任何資料。
 */
export class RoleStore {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS persisted_roles (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, user_id, role_id)
      ) STRICT`);
  }

  add(guildId: string, userId: string, roleId: string): void {
    this.db
      .prepare("INSERT OR IGNORE INTO persisted_roles (guild_id, user_id, role_id) VALUES (?, ?, ?)")
      .run(guildId, userId, roleId);
  }

  remove(guildId: string, userId: string, roleId: string): void {
    this.db
      .prepare("DELETE FROM persisted_roles WHERE guild_id = ? AND user_id = ? AND role_id = ?")
      .run(guildId, userId, roleId);
  }

  list(guildId: string, userId: string): string[] {
    return this.db
      .prepare("SELECT role_id FROM persisted_roles WHERE guild_id = ? AND user_id = ?")
      .all(guildId, userId)
      .map((row) => String(row.role_id));
  }

  close(): void {
    this.db.close();
  }
}
