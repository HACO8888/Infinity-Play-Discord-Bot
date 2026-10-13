import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkImpersonation, nameKey } from "../src/moderation/impersonation.ts";
import { accountAgeDays, JoinTracker } from "../src/moderation/raid.ts";
import { RoleStore } from "../src/store.ts";

describe("checkImpersonation", () => {
  const protectedNames = ["Haco", "吉娃娃・莫札特"];

  it("catches look-alike copies of protected names", () => {
    assert.ok(checkImpersonation("haco", protectedNames));
    assert.ok(checkImpersonation("H a c 0", protectedNames));
    assert.ok(checkImpersonation("Ｈａｃｏ", protectedNames));
    assert.ok(checkImpersonation("Hаcо", protectedNames)); // 西里爾字母 а、о
    assert.ok(checkImpersonation("吉娃娃 莫札特", protectedNames));
  });

  it("catches self-declared staff and official accounts", () => {
    assert.ok(checkImpersonation("Discord Support", []));
    assert.ok(checkImpersonation("伺服器管理員", []));
    assert.ok(checkImpersonation("官方客服小美", []));
    assert.ok(checkImpersonation("Moderator Team", []));
    assert.ok(checkImpersonation("Adm1n", []));
  });

  it("does not flag ordinary names", () => {
    assert.equal(checkImpersonation("Hacker123", protectedNames), null);
    assert.equal(checkImpersonation("Chacon", protectedNames), null);
    assert.equal(checkImpersonation("狗子請留步", protectedNames), null);
    assert.equal(checkImpersonation("modern_gamer", []), null);
    assert.equal(checkImpersonation("ab", []), null);
  });

  it("normalizes confusable characters", () => {
    assert.equal(nameKey("Adm1n"), nameKey("admin"));
  });
});

describe("JoinTracker", () => {
  const join = (userId: string, at: number) => ({ userId, at, accountCreatedAt: 0 });

  it("reports once when the threshold is reached inside the window", () => {
    const tracker = new JoinTracker();
    for (let i = 0; i < 4; i++) assert.equal(tracker.record("g", join(`u${i}`, i * 1000), 5, 60), null);
    const raid = tracker.record("g", join("u4", 4000), 5, 60);
    assert.equal(raid?.joins.length, 5);
    assert.equal(tracker.record("g", join("u5", 5000), 5, 60), null);
  });

  it("ignores joins spread over time", () => {
    const tracker = new JoinTracker();
    for (let i = 0; i < 10; i++) assert.equal(tracker.record("g", join(`u${i}`, i * 30_000), 5, 60), null);
  });

  it("computes account age", () => {
    assert.equal(accountAgeDays(0, 3 * 86_400_000 + 1), 3);
  });
});

describe("RoleStore", () => {
  const key = Buffer.alloc(32, 7).toString("base64");

  it("rejects keys of the wrong length", () => {
    assert.throws(() => new RoleStore(":memory:", "c2hvcnQ="), /32 bytes/);
  });

  it("never writes user or role IDs in plain text", () => {
    const store = new RoleStore(":memory:", key);
    store.add("827865729285881868", "508964901415550976", "1113764486030041108");
    const dump = JSON.stringify(store.rawRows());
    for (const id of ["827865729285881868", "508964901415550976", "1113764486030041108"]) assert.ok(!dump.includes(id));
    store.close();
  });

  it("adds, lists and removes persisted roles", () => {
    const store = new RoleStore(":memory:", key);
    store.add("g", "u", "r1");
    store.add("g", "u", "r1");
    store.add("g", "u", "r2");
    assert.deepEqual(store.list("g", "u").sort(), ["r1", "r2"]);
    store.remove("g", "u", "r1");
    assert.deepEqual(store.list("g", "u"), ["r2"]);
    assert.deepEqual(store.list("g", "other"), []);
    store.close();
  });
});

describe("customStatusText", async () => {
  const { ActivityType } = await import("discord.js");
  const { customStatusText } = await import("../src/moderation/presence.ts");
  it("reads only the custom status text", () => {
    assert.equal(
      customStatusText({ activities: [{ type: ActivityType.Custom, state: " free nitro → dsc.gg/x " }] } as never),
      "free nitro → dsc.gg/x",
    );
    assert.equal(customStatusText({ activities: [{ type: ActivityType.Playing, state: "Valorant" }] } as never), null);
    assert.equal(customStatusText({ activities: [] } as never), null);
  });
});
