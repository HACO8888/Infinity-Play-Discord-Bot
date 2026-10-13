import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findInvites } from "../src/moderation/invites.ts";
import { normalizeText } from "../src/moderation/normalize.ts";

const codes = (text: string) => findInvites(normalizeText(text)).map((m) => m.code);

describe("findInvites", () => {
  it("detects links without a scheme (the 2026-10-04 miss)", () => {
    assert.deepEqual(codes("discord.gg/99uq8KSgE"), ["99uq8KSgE"]);
  });

  it("detects common URL forms", () => {
    assert.deepEqual(codes("https://discord.gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("https://www.discord.com/invite/abc123"), ["abc123"]);
    assert.deepEqual(codes("http://discordapp.com/invite/my-server"), ["my-server"]);
    assert.deepEqual(codes("<https://discord.gg/abc123>"), ["abc123"]);
    assert.deepEqual(codes("[點我](https://discord.gg/abc123)"), ["abc123"]);
    assert.deepEqual(codes("DISCORD.GG/abc123"), ["abc123"]);
  });

  it("detects obfuscated forms", () => {
    assert.deepEqual(codes("ｄｉｓｃｏｒｄ．ｇｇ／abc123"), ["abc123"]);
    assert.deepEqual(codes("discord。gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("disc​ord.gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("discord . gg / abc123"), ["abc123"]);
    assert.deepEqual(codes("discord[.]gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("discord(dot)gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("discord dot gg/abc123"), ["abc123"]);
    assert.deepEqual(codes("discord\\.gg\\/abc123"), ["abc123"]);
  });

  it("flags third-party invite services as unresolvable", () => {
    const [match] = findInvites(normalizeText("join dsc.gg/coolserver"));
    assert.equal(match?.code, "coolserver");
    assert.equal(match?.resolvable, false);
    assert.equal(findInvites(normalizeText("discord.me/abc"))[0]?.resolvable, false);
  });

  it("keeps the invite code's case and de-duplicates", () => {
    assert.deepEqual(codes("discord.gg/AbC discord.gg/AbC"), ["AbC"]);
  });

  it("ignores ordinary text", () => {
    assert.deepEqual(codes("我在 discord 上 gg 了"), []);
    assert.deepEqual(codes("https://discord.com/channels/1/2/3"), []);
    assert.deepEqual(codes("https://support.discord.com/hc/zh-tw"), []);
  });
});
