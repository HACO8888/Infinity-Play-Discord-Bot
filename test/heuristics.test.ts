import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCAM_TEXT_THRESHOLD, scoreScamText } from "../src/moderation/heuristics.ts";
import { normalizeText } from "../src/moderation/normalize.ts";

const flagged = (text: string) => scoreScamText(normalizeText(text)).score >= SCAM_TEXT_THRESHOLD;

describe("scoreScamText", () => {
  it("flags the fake game recruitment message (2026-10-05)", () => {
    const text = `遊戲招募《工讀生》，給您申請一個vip等級無上限賬號誠邀您來體驗，進遊給你儲值，資源我們給，你來沖榜
有興趣加line：@354hwdth
有興趣加wechat：y74496921
發送暗號626領取名額噢`;
    assert.ok(flagged(text));
  });

  it("flags the idle computer income scam", () => {
    const text = `Here is an opportunity you can generate profit using your pc

Do you have a computer that isn't getting much use?
Do not leave the computer unused in the workplace or room.
Contact me if you'd like to generate some extra income with it.
No technical skills are required.`;
    assert.ok(flagged(text));
  });

  it("flags full-width obfuscated contacts", () => {
    assert.ok(flagged("高薪兼職日結，加ｌｉｎｅ：ａｂｃ１２３４"));
  });

  it("does not flag normal chat", () => {
    assert.ok(!flagged("今晚誰要一起打排位？"));
    assert.ok(!flagged("我的 line: abcd1234 有事找我"));
    assert.ok(!flagged("I'm online: playing ranked now"));
    assert.ok(!flagged("contact me if the server is down"));
    assert.ok(!flagged("儲值活動今天結束喔"));
    assert.ok(!flagged("加我好友一起玩，領取活動獎勵"));
  });
});
