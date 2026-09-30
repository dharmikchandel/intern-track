import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicAddress, validateJobUrl } from "./ssrf.js";

describe("isPublicAddress", () => {
  const publicAddresses = [
    "8.8.8.8",
    "1.1.1.1",
    "93.184.216.34",
    "172.32.0.1", // just outside 172.16.0.0/12
    "100.128.0.1", // just outside 100.64.0.0/10
    "2606:4700:4700::1111",
    "2001:4860:4860::8888",
  ];
  const blockedAddresses = [
    "127.0.0.1",
    "127.255.255.255",
    "0.0.0.0",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "198.18.0.1",
    "::1",
    "::",
    "fe80::1",
    "fe80::1%eth0",
    "fc00::1",
    "fd12:3456::1",
    "ff02::1",
    "::ffff:127.0.0.1", // IPv4-mapped loopback
    "::ffff:7f00:1", // same, hex form
    "::ffff:169.254.169.254",
    "64:ff9b::7f00:1", // NAT64 wrapping loopback
    "2002:7f00:1::", // 6to4 wrapping loopback
    "2002:a9fe:a9fe::1", // 6to4 wrapping the metadata address
    "2001:0:4136:e378:8000:63bf:3fff:fdd2", // Teredo
    "2001:db8::1",
    "not-an-ip",
    "",
  ];

  for (const ip of publicAddresses) {
    it(`allows public ${ip}`, () => assert.equal(isPublicAddress(ip), true));
  }
  for (const ip of blockedAddresses) {
    it(`blocks ${JSON.stringify(ip)}`, () => assert.equal(isPublicAddress(ip), false));
  }
});

describe("validateJobUrl", () => {
  const rejected: [string, unknown][] = [
    ["ftp scheme", "ftp://example.com/job"],
    ["javascript scheme", "javascript:alert(1)"],
    ["file scheme", "file:///etc/passwd"],
    ["data scheme", "data:text/html,hi"],
    ["loopback literal", "http://127.0.0.1/"],
    ["decimal-encoded loopback", "http://2130706433/"],
    ["hex-encoded loopback", "http://0x7f.1/"],
    ["octal-encoded loopback", "http://0177.0.0.1/"],
    ["ipv6 loopback", "http://[::1]/"],
    ["ipv4-mapped ipv6 loopback", "http://[::ffff:127.0.0.1]/"],
    ["cloud metadata", "http://169.254.169.254/latest/meta-data/"],
    ["private range", "https://10.1.2.3/job"],
    ["credentials in url", "https://user:pass@example.com/job"],
    ["credentials trick", "https://example.com@127.0.0.1/"],
    ["non-default port", "http://example.com:8080/job"],
    ["non-default https port", "https://example.com:8443/job"],
    ["not a url", "not a url"],
    ["empty string", ""],
    ["whitespace", "   "],
    ["too long", `https://example.com/${"a".repeat(2100)}`],
    ["number", 42],
    ["null", null],
    ["object", { href: "https://example.com" }],
  ];
  for (const [name, value] of rejected) {
    it(`rejects ${name}`, () => assert.throws(() => validateJobUrl(value), { name: "Error" }));
  }

  it("uses a 400 status and a stable code", () => {
    assert.throws(
      () => validateJobUrl("http://127.0.0.1/"),
      (err: any) => err.statusCode === 400 && err.code === "URL_NOT_ALLOWED"
    );
    assert.throws(
      () => validateJobUrl("ftp://x.com"),
      (err: any) => err.statusCode === 400 && err.code === "INVALID_URL"
    );
  });

  it("accepts normal job links, including explicit default ports", () => {
    assert.equal(validateJobUrl("https://boards.greenhouse.io/stripe/jobs/123").hostname, "boards.greenhouse.io");
    assert.equal(validateJobUrl("https://example.com:443/job").port, "");
    assert.equal(validateJobUrl("http://example.com:80/job").port, "");
    assert.equal(validateJobUrl("  https://example.com/job  ").href, "https://example.com/job");
  });

  it("leaves hostnames to be checked when the connection is made", () => {
    // localhost is not an IP literal, so it passes here; safeFetch blocks it at connect time.
    assert.doesNotThrow(() => validateJobUrl("http://localhost/"));
  });
});
