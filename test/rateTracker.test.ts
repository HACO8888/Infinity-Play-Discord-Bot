import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Cooldown, RateTracker } from "../src/moderation/rateTracker.ts";

const limits = { floodMessages: 3, floodWindowSeconds: 5, duplicateMessages: 3, duplicateWindowSeconds: 60 };

describe("RateTracker", () => {
  it("detects floods inside the window only", () => {
    const tracker = new RateTracker(limits);
    assert.equal(tracker.record("u", "c", "a1", 0).flood, false);
    assert.equal(tracker.record("u", "c", "a2", 1000).flood, false);
    assert.equal(tracker.record("u", "c", "a3", 2000).flood, true);
    assert.equal(tracker.record("u", "c", "a4", 9000).flood, false);
  });

  it("detects duplicate content across channels, ignoring case and punctuation", () => {
    const tracker = new RateTracker(limits);
    tracker.record("u", "c1", "Free nitro here!!", 0);
    tracker.record("u", "c2", "free nitro here", 10_000);
    const result = tracker.record("u", "c3", "FREE NITRO HERE.", 20_000);
    assert.equal(result.duplicate, true);
    assert.equal(result.channelCount, 3);
  });

  it("ignores short repeated messages", () => {
    const tracker = new RateTracker(limits);
    for (let i = 0; i < 3; i++) tracker.record("u", "c", "+1", i * 10_000);
    assert.equal(tracker.record("u", "c", "+1", 40_000).duplicate, false);
  });

  it("sweeps idle users", () => {
    const tracker = new RateTracker(limits);
    tracker.record("u", "c", "hello world", 0);
    tracker.sweep(120_000);
    assert.equal(tracker.record("u", "c", "x", 120_000).recentCount, 1);
  });
});

describe("Cooldown", () => {
  it("allows once per window", () => {
    const cooldown = new Cooldown(60);
    assert.equal(cooldown.take("k", 0), true);
    assert.equal(cooldown.take("k", 30_000), false);
    assert.equal(cooldown.take("k", 61_000), true);
  });
});
