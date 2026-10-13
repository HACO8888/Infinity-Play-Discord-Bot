# Play Bot
 無限遊玩官方Discord機器人

## 環境變數

| 名稱 | 說明 |
|---|---|
| `TOKEN` | Bot token |
| `ID` | Application ID（部署 slash command 用） |
| `GUILD_ID` | 啟用的伺服器 ID，多個用逗號分隔 |

## 執行

```bash
pnpm install
pnpm run deploy-commands   # 註冊 slash command 到 GUILD_ID 內的伺服器
pnpm start
```

需要 Node.js 18 以上。

## Gateway Intents

只使用 `Guilds`、`GuildMessages`、`MessageContent`。`MessageContent` 用於偵測並刪除非本伺服器的 Discord 邀請連結（`events/messageCreate.js`）。
Developer Portal 上的 **Server Members Intent** 與 **Presence Intent** 可以關閉。
