import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_AUTOMOD, parseConfig } from "../src/config.ts";

const A = "827865729285881868";
const B = "806477754681262100";

describe("parseConfig", () => {
  it("applies defaults and overrides", () => {
    const config = parseConfig({
      guilds: { [A]: { alertChannelId: "967374280381849601", automod: { invites: "alert", maxMentions: 8 } } },
    });
    const guild = config.guilds.get(A);
    assert.equal(guild?.alertChannelId, "967374280381849601");
    assert.equal(guild?.logChannelId, null);
    assert.equal(guild?.automod.invites, "alert");
    assert.equal(guild?.automod.maxMentions, 8);
    assert.equal(guild?.automod.scamText, DEFAULT_AUTOMOD.scamText);
  });

  it("restricts to GUILD_ID and fills missing guilds with defaults", () => {
    const config = parseConfig({ guilds: { [A]: {} } }, ` ${B} `);
    assert.deepEqual([...config.guilds.keys()], [B]);
    assert.equal(config.guilds.get(B)?.alertChannelId, null);
  });

  it("rejects invalid values", () => {
    assert.throws(() => parseConfig({ guilds: { [A]: { automod: { invites: "ban" } } } }), /invites/);
    assert.throws(() => parseConfig({ guilds: { [A]: { logChannelId: "abc" } } }), /logChannelId/);
    assert.throws(() => parseConfig({ guilds: { [A]: { automod: { maxMentions: 0 } } } }), /maxMentions/);
    assert.throws(() => parseConfig({ guilds: { notanid: {} } }), /key/);
  });
});
