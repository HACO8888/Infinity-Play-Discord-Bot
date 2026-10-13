import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { domainCandidates, extractHostnames, findListedDomain, parseDomainList } from "../src/moderation/links.ts";
import { normalizeText } from "../src/moderation/normalize.ts";

describe("extractHostnames", () => {
  it("finds hosts with or without a scheme", () => {
    assert.deepEqual(extractHostnames("go https://Steam-Gift.example.com/claim now"), ["steam-gift.example.com"]);
    assert.deepEqual(extractHostnames("visit free-nitro.xyz."), ["free-nitro.xyz"]);
    assert.deepEqual(extractHostnames(normalizeText("free-nitro[.]xyz/claim")), ["free-nitro.xyz"]);
    assert.deepEqual(extractHostnames("快去free-nitro.xyz領取"), ["free-nitro.xyz"]);
  });

  it("ignores text that is not a domain", () => {
    assert.deepEqual(extractHostnames("version 1.2.3 and e.g. something"), []);
  });
});

describe("domain list", () => {
  const list = parseDomainList("bad.com\nsub.evil.net\n# comment\nclk.rtpdn*.com\ncaptcha.xyz?path=x\n\nBAD2.ORG\n");

  it("parses only plain domains", () => {
    assert.deepEqual([...list].sort(), ["bad.com", "bad2.org", "sub.evil.net"]);
  });

  it("matches the host and its parent domains", () => {
    assert.deepEqual(domainCandidates("a.b.bad.com"), ["a.b.bad.com", "b.bad.com", "bad.com"]);
    assert.equal(findListedDomain(["login.bad.com"], list), "bad.com");
    assert.equal(findListedDomain(["sub.evil.net"], list), "sub.evil.net");
    assert.equal(findListedDomain(["evil.net"], list), undefined);
    assert.equal(findListedDomain(["notbad.com"], list), undefined);
  });
});
