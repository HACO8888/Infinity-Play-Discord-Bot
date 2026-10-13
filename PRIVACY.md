# 隱私權政策 / Privacy Policy

最後更新：2026-10-14 · Last updated: 2026-10-14

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
| 成員加入／離開、帳號建立日期、暱稱變更 Member joins/leaves, account creation date, nickname changes | 管理紀錄、新帳號警示、偵測短時間大量加入（突襲）Moderation log, new-account warnings, raid detection | 以 Discord 訊息形式留在紀錄頻道；突襲判斷只在記憶體保留最近 1 分鐘的加入時間 Kept as a Discord message in the log channel; raid detection keeps join times in memory for about one minute |
| 成員的使用者名稱、顯示名稱與伺服器暱稱 Members' username, display name and server nickname | 偵測冒充管理員／官方客服，或名稱中含詐騙網址與聯絡方式 Detect impersonation of staff or official support, and scam links or contact handles in names | 只在記憶體比對；被偵測到時以 Discord 訊息形式通報到管理員頻道 Checked in memory; flagged names are reported to the staff channel |
| 處罰身分組（使用者 ID 與身分組 ID）Punishment roles (user ID and role ID) | 成員退出再加入時自動補回，防止逃避處罰 Re-apply them if the member leaves and rejoins, to prevent evasion | **這是唯一儲存在 Discord 以外的資料**：存放在我們主機上的 SQLite 資料庫並靜態加密（使用者 ID 只保存 HMAC-SHA256 雜湊、身分組以 AES-256-GCM 加密，金鑰另外存放），只有伺服器設定為「處罰身分組」的才會記錄，身分組被移除時立即刪除 **The only data stored outside Discord**: a SQLite database on our server, encrypted at rest (user IDs are kept only as HMAC-SHA256 hashes and roles are AES-256-GCM encrypted, with keys stored separately), only for roles configured as punishment roles, deleted as soon as the role is removed |
| 自訂狀態文字（Presence）Custom status text (presence) | 偵測自訂狀態中的詐騙網址、外部邀請或詐騙話術 Detect scam links, external invites or scam wording in custom statuses | 只在記憶體比對，不保存；被偵測到時以 Discord 訊息形式通報到管理員頻道。不讀取、不保存上線狀態、正在玩的遊戲或其他活動 Checked in memory and never stored; flagged statuses are reported to the staff channel. Online status, games and other activities are not read or stored |

我們**不會**：將訊息內容、名稱或狀態儲存到 Discord 以外的地方（上表的處罰身分組除外）、出售或分享給第三方、用於訓練任何機器學習或 AI 模型、用於廣告或使用者追蹤。

We **do not**: store message content, names or statuses outside Discord (except the punishment roles above), sell or share data with third parties, use it to train any machine-learning or AI model, or use it for advertising or user tracking.

所有偵測結果只作為管理員的參考，除了外部邀請連結與已知詐騙網址會自動刪除外，是否處置由管理員決定。

All detections are advisory: apart from external invites and known scam links being removed automatically, moderators decide what action to take.

## 外部服務 / External services

為了辨識詐騙網址，本機器人會定期下載公開的詐騙網域清單（[Discord-AntiScam/scam-links](https://github.com/Discord-AntiScam/scam-links)）。比對完全在本機進行，**不會把任何訊息內容或使用者資料傳送給清單提供者**。

To recognise scam links, the bot periodically downloads a public scam-domain list ([Discord-AntiScam/scam-links](https://github.com/Discord-AntiScam/scam-links)). Matching happens locally; **no message content or user data is sent to the list provider**.

## 刪除資料 / Data removal

要求刪除與你有關的資料：在 ∞ 遊玩伺服器聯絡任一位管理員，或來信 haco@lazco.tw（請附上你的 Discord 使用者 ID）。我們會在 7 天內刪除，並移除你在本機器人資料庫中的所有紀錄。

To request deletion of data about you, contact any moderator in the ∞ 遊玩 server or email haco@lazco.tw with your Discord user ID. We will delete it within 7 days, including every record about you in the bot's database.


通報與管理紀錄是伺服器內的一般 Discord 訊息，伺服器管理員可以隨時刪除；處罰身分組紀錄會在身分組移除時自動刪除。如需協助，請在伺服器內聯絡管理員，或來信 haco@lazco.tw。

Alerts and log entries are ordinary Discord messages in the server and can be deleted by the server's staff at any time; punishment-role records are deleted automatically when the role is removed. For help, contact the server staff or email haco@lazco.tw.

## 變更 / Changes

本政策若有變更會更新於此頁面並修改上方日期。

Changes to this policy will be published on this page with an updated date.
