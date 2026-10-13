import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_AUTOMOD } from "../src/config.ts";
import { normalizeText } from "../src/moderation/normalize.ts";
import { scanContent, shouldDelete } from "../src/moderation/scanner.ts";

const own = { isAllowed: async (invite: { code: string }) => invite.code === "ourserver" };
const scam = new Set(["free-nitro.xyz"]);
const scan = (text: string, mentionCount = 0, automod = DEFAULT_AUTOMOD) =>
  scanContent({ normalized: normalizeText(text), mentionCount }, automod, scam, own);

describe("scanContent", () => {
  it("flags external invites and allows our own", async () => {
    assert.deepEqual(await scan("discord.gg/ourserver"), []);
    const [finding] = await scan("join discord.gg/99uq8KSgE");
    assert.equal(finding?.kind, "invite");
    assert.equal(finding?.action, "delete");
  });

  it("flags scam domains and scam text independently", async () => {
    const kinds = (await scan("高薪兼職日結，加line：abc12345 https://free-nitro.xyz/claim")).map((f) => f.kind);
    assert.deepEqual(kinds, ["scamLink", "scamText"]);
  });

  it("only alerts for scam text by default", async () => {
    const findings = await scan(
      "Here is an opportunity you can generate profit using your pc. Contact me. No technical skills are required.",
    );
    assert.equal(findings[0]?.action, "alert");
    assert.equal(shouldDelete(findings), false);
  });

  it("respects off and mention limits", async () => {
    assert.deepEqual(await scan("discord.gg/abc", 0, { ...DEFAULT_AUTOMOD, invites: "off" }), []);
    assert.equal((await scan("hi", 4)).length, 0);
    assert.equal((await scan("hi", 5))[0]?.kind, "mentionSpam");
  });
});
