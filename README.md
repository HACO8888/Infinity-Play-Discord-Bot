# Play Bot

無限遊玩官方 Discord 機器人：自動管理（防廣告、防詐騙、防洗版）與管理紀錄。

## 功能

### 自動管理

每則新訊息、編輯後的訊息與轉發的訊息都會檢查，偵測到可疑內容時發送通報到管理員頻道，管理員用按鈕決定處置：**刪除訊息、禁言 1 天、踢出、封鎖（並刪除 24 小時內訊息）或標記誤判**。處理結果會記錄在通報上。

| 偵測項目 | 說明 | 預設 |
|---|---|---|
| 外部邀請連結 | `discord.gg`、`discord.com/invite`、`dsc.gg` 等，包含省略 `https://`、全形字、零寬字元、`discord[.]gg` 等繞過寫法；本伺服器的邀請與自訂網址會自動放行 | 刪除並通報 |
| 詐騙／釣魚網址 | 比對 [Discord-AntiScam](https://github.com/Discord-AntiScam/scam-links) 公開清單（每 6 小時更新） | 刪除並通報 |
| 疑似詐騙訊息 | 站外聯絡方式（LINE、微信、Telegram…）搭配假招募、代儲、高薪、被動收入、免費 Nitro 等話術 | 只通報 |
| 大量提及 | 單則訊息提及 5 個以上使用者或身分組 | 只通報 |
| 洗版 | 5 秒內 6 則訊息，或 60 秒內 3 次相同內容（跨頻道也算） | 只通報 |

擁有「管理訊息」權限的成員與 `exemptRoleIds` 內的身分組不會被檢查。

### 成員相關（需要 Server Members intent，`EXTRA_INTENTS` 含 `members`）

| 功能 | 說明 | 預設 |
|---|---|---|
| 加入／離開紀錄 | 記錄到 log 頻道，帳號未滿 `newAccountDays`（7）天標示為新帳號 | 開 |
| 防突襲 | `raidWindowSeconds`（60）秒內 `raidJoins`（10）人加入時通報，按鈕可暫停邀請 24 小時或把驗證等級調到最高 | 只通報 |
| 冒充偵測 | 名稱與擁有者、管理員（曾發言的管理員會自動記住）或 `protectedNames` 幾乎相同，或自稱管理員、官方、客服，或名稱含詐騙網址／聯絡方式 | 只通報 |
| 處罰身分組防逃避 | `persistRoleIds` 內的身分組在成員退出再加入時自動補回（存於 SQLite） | 設定後啟用 |

### 自訂狀態（需要 Presence intent，`EXTRA_INTENTS` 含 `presences`）

自訂狀態含詐騙網址、外部邀請或詐騙話術時通報管理員。只看自訂狀態文字，不讀取上線狀態或遊戲活動，也不保存。

### 管理紀錄（mod log）

設定 `logChannelId` 後，會把訊息刪除、訊息編輯（前後內容）、大量刪除，以及踢出／封鎖／禁言（來自審核日誌）記錄到該頻道。

### 指令

- `/automod`：查看自動管理設定與詐騙清單狀態（需要「管理訊息」權限）
- `/server`、`/info`、`/ping`

指令會在啟動時自動同步到啟用的伺服器。

## 設定

`config.json` 以伺服器 ID 為 key；`automod` 底下的欄位都可省略，未填寫就使用上表的預設值。

```jsonc
{
  "guilds": {
    "827865729285881868": {
      "alertChannelId": "967374280381849601", // 通報頻道
      "logChannelId": null,                   // 管理紀錄頻道，null 代表不記錄
      "automod": {
        "invites": "delete",   // delete：刪除並通報 / alert：只通報 / off：關閉
        "scamText": "alert",
        "maxMentions": 5,
        "exemptRoleIds": [],
        "allowedInvites": ["partner-server"]  // 允許的外部邀請碼或網址
      }
    }
  }
}
```

環境變數（見 `.env.example`）：

| 名稱 | 說明 |
|---|---|
| `TOKEN` | Bot token |
| `GUILD_ID` | 啟用的伺服器 ID，逗號分隔；只會處理這些伺服器的訊息 |
| `EXTRA_INTENTS` | 選用特權 intent：`members`、`presences`（逗號分隔）；審核未通過時移除即可 |
| `ROLE_STORE_KEY` | 處罰身分組資料的加密金鑰（`openssl rand -base64 32`）；未設定時不啟用該功能 |
| `DATABASE_PATH` | SQLite 路徑，Docker 預設 `/app/data/bot.sqlite`（請把 `/app/data` 掛成 volume） |

## 機器人需要的權限

檢視頻道、傳送訊息、嵌入連結、讀取訊息歷史、管理訊息、禁言成員、踢出成員、封鎖成員、**檢視審核日誌**（mod log）、**管理伺服器**（讀取本伺服器邀請列表）。

## Gateway Intents

`Guilds`、`GuildMessages`、`GuildModeration`，以及特權 intent **`MessageContent`**（偵測可疑訊息與管理紀錄）。依 `EXTRA_INTENTS` 另外啟用 **`GuildMembers`**（成員相關功能）與 **`GuildPresences`**（自訂狀態偵測）。

## 開發

需要 Node.js 24（直接執行 TypeScript，不需要編譯）與 pnpm。

```bash
pnpm install
pnpm start        # 啟動
pnpm check        # Biome + 型別檢查 + 測試
pnpm format       # 自動格式化
```

### 部署

Dokploy 以 `Dockerfile` 建置；也可以用 `docker compose up -d --build`（讀取 `.env`）。

## 隱私權

見 [PRIVACY.md](PRIVACY.md)；服務條款見 [TERMS.md](TERMS.md)。
