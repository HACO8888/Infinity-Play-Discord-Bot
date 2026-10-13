import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * 只保存「處罰身分組」，用來在成員退出再加入時補回；身分組被移除時就刪除紀錄。
 *
 * 靜態加密：使用者 ID 只以 HMAC-SHA256 雜湊保存（無法反推），身分組 ID 以 AES-256-GCM 加密。
 * 金鑰由 ROLE_STORE_KEY 提供（32 bytes，base64），與資料庫分開存放。
 */
export class RoleStore {
  private readonly db: DatabaseSync;
  private readonly hmacKey: Buffer;
  private readonly encKey: Buffer;

  constructor(file: string, key: string) {
    const master = Buffer.from(key, "base64");
    if (master.length !== 32) throw new Error("ROLE_STORE_KEY must be 32 bytes encoded as base64");
    // 雜湊與加密使用不同的衍生金鑰
    this.hmacKey = createHmac("sha256", master).update("role-store/hmac").digest();
    this.encKey = createHmac("sha256", master).update("role-store/aes-256-gcm").digest();

    if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      DROP TABLE IF EXISTS persisted_roles;
      CREATE TABLE IF NOT EXISTS persisted_roles_v2 (
        role_key TEXT PRIMARY KEY,
        user_key TEXT NOT NULL,
        role_cipher TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS persisted_roles_v2_user ON persisted_roles_v2 (user_key);`);
  }

  private hash(...parts: string[]): string {
    return createHmac("sha256", this.hmacKey).update(parts.join(":")).digest("base64url");
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encKey, iv);
    const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
  }

  private decrypt(value: string): string {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", this.encKey, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  }

  add(guildId: string, userId: string, roleId: string): void {
    this.db
      .prepare("INSERT OR IGNORE INTO persisted_roles_v2 (role_key, user_key, role_cipher) VALUES (?, ?, ?)")
      .run(this.hash(guildId, userId, roleId), this.hash(guildId, userId), this.encrypt(roleId));
  }

  remove(guildId: string, userId: string, roleId: string): void {
    this.db.prepare("DELETE FROM persisted_roles_v2 WHERE role_key = ?").run(this.hash(guildId, userId, roleId));
  }

  list(guildId: string, userId: string): string[] {
    return this.db
      .prepare("SELECT role_cipher FROM persisted_roles_v2 WHERE user_key = ?")
      .all(this.hash(guildId, userId))
      .map((row) => this.decrypt(String(row.role_cipher)));
  }

  /** 測試用：直接讀出資料表內容，確認沒有明文 */
  rawRows(): Record<string, unknown>[] {
    return this.db.prepare("SELECT * FROM persisted_roles_v2").all() as Record<string, unknown>[];
  }

  close(): void {
    this.db.close();
  }
}
