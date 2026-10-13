# 隱私權政策 / Privacy Policy

最後更新：2026-10-13 · Last updated: 2026-10-13

無限遊玩機器人（以下稱「本機器人」）是無限遊玩社群自行營運的 Discord 管理機器人，**只在我們自己的伺服器中運作**（伺服器清單由我們設定，其他伺服器即使邀請本機器人也不會處理任何訊息）。

The 無限遊玩 bot ("the bot") is a Discord moderation bot operated by the 無限遊玩 community. **It only operates in servers we own** (a fixed allow-list we configure); it does not process messages in any other server.

## 我們處理哪些資料 / What we process

| 資料 Data | 用途 Purpose | 保存方式 Retention |
|---|---|---|
| 新訊息與編輯後訊息的文字內容（包含轉發訊息） Text of new and edited messages, including forwarded messages | 偵測外部邀請連結、詐騙／釣魚網址、詐騙話術、大量提及與洗版 Detect external invites, scam/phishing links, scam wording, mass mentions and flooding | 只在記憶體中即時比對，不寫入任何資料庫或檔案 Checked in memory only; never written to a database or file |
| 被偵測到的訊息內容、作者、頻道 Content, author and channel of a flagged message | 通報給伺服器管理員，由管理員決定如何處理 Shown to the server's moderators, who decide what to do | 以 Discord 訊息形式留在該伺服器的管理員頻道 Kept as a Discord message in that server's private staff channel |
| 被刪除或編輯的訊息（刪除前／編輯前的內容）Deleted messages and the previous version of edited messages | 管理紀錄（mod log），協助管理員事後追查 Moderation log for staff review | 以 Discord 訊息形式留在該伺服器的紀錄頻道；機器人本身只在記憶體快取最近的訊息，重新啟動即清除 Kept as a Discord message in that server's private log channel; the bot itself only keeps recent messages in an in-memory cache that is cleared on restart |
| 洗版判斷用的訊息雜湊與時間 Message hashes and timestamps for flood detection | 判斷短時間內是否大量或重複發訊 Detect rapid or repeated posting | 只在記憶體中保留最多 60 秒 In memory for at most 60 seconds |
| 審核日誌事件（踢出、封鎖、禁言）Audit log events (kick, ban, timeout) | 管理紀錄 Moderation log | 以 Discord 訊息形式留在紀錄頻道 Kept as a Discord message in the log channel |

我們**不會**：將訊息內容儲存到 Discord 以外的地方、出售或分享給第三方、用於訓練任何機器學習或 AI 模型、用於廣告。

We **do not**: store message content outside Discord, sell or share it with third parties, use it to train any machine-learning or AI model, or use it for advertising.

本機器人不使用 Server Members（伺服器成員）與 Presence（上線狀態）特權 intent，不追蹤使用者的上線狀態或活動。

The bot does not use the Server Members or Presence privileged intents and does not track online status or activity.

## 外部服務 / External services

為了辨識詐騙網址，本機器人會定期下載公開的詐騙網域清單（[Discord-AntiScam/scam-links](https://github.com/Discord-AntiScam/scam-links)）。比對完全在本機進行，**不會把任何訊息內容或使用者資料傳送給清單提供者**。

To recognise scam links, the bot periodically downloads a public scam-domain list ([Discord-AntiScam/scam-links](https://github.com/Discord-AntiScam/scam-links)). Matching happens locally; **no message content or user data is sent to the list provider**.

## 刪除資料 / Data removal

通報與管理紀錄是伺服器內的一般 Discord 訊息，伺服器管理員可以隨時刪除。如需協助，請在伺服器內聯絡管理員，或來信 haco@lazco.tw。

Alerts and log entries are ordinary Discord messages in the server and can be deleted by the server's staff at any time. For help, contact the server staff or email haco@lazco.tw.

## 變更 / Changes

本政策若有變更會更新於此頁面並修改上方日期。

Changes to this policy will be published on this page with an updated date.
