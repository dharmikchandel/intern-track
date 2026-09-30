import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, describe, it } from "node:test";
import zlib from "node:zlib";
import { createSafeFetch, FetchError, type Resolver } from "./safeFetch.js";
import { FetchBlockedError } from "./ssrf.js";

// Local servers stand in for "the internet". A stub resolver and a permissive
// address predicate let them play a public host; blocking behaviour is tested
// by tightening those two, never by loosening the production defaults.
const servers: http.Server[] = [];
function serve(handler: http.RequestListener): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer(handler).listen(0, "0.0.0.0", () => {
      servers.push(server);
      resolve((server.address() as AddressInfo).port);
    });
  });
}
after(() => servers.forEach((s) => s.closeAllConnections?.() ?? s.close()));

const toLoopback: Resolver = async () => [{ address: "127.0.0.1", family: 4 }];
const allow127 = (ip: string) => ip === "127.0.0.1";
const local = (overrides = {}) =>
  createSafeFetch({ resolve: toLoopback, isAllowed: allow127, allowCustomPorts: true, timeoutMs: 2000, ...overrides });

describe("safeFetch: address blocking (production defaults)", () => {
  it("blocks an IP literal for loopback", async () => {
    await assert.rejects(() => createSafeFetch()(new URL("http://127.0.0.1/")), FetchBlockedError);
  });

  it("blocks a hostname that resolves to loopback (localhost)", async () => {
    await assert.rejects(() => createSafeFetch()(new URL("http://localhost/")), FetchBlockedError);
  });

  it("blocks the cloud metadata address", async () => {
    await assert.rejects(() => createSafeFetch()(new URL("http://169.254.169.254/latest/meta-data/")), FetchBlockedError);
  });

  it("blocks when the resolver returns private addresses", async () => {
    const resolve: Resolver = async () => [{ address: "10.0.0.5", family: 4 }];
    await assert.rejects(() => createSafeFetch({ resolve })(new URL("http://intranet.example/")), FetchBlockedError);
  });

  it("blocks a mixed public+private answer instead of picking one", async () => {
    const resolve: Resolver = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "169.254.169.254", family: 4 },
    ];
    await assert.rejects(() => createSafeFetch({ resolve })(new URL("http://rebind.example/")), FetchBlockedError);
  });
});

describe("safeFetch: DNS rebinding", () => {
  it("resolves exactly once per hop, so a later different answer can't be used", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "text/html" }).end("<html>ok</html>"));
    let calls = 0;
    // First answer is the "public" address; any further lookup would return a private one.
    const resolve: Resolver = async () => (++calls === 1 ? [{ address: "127.0.0.1", family: 4 }] : [{ address: "10.0.0.1", family: 4 }]);
    const fetcher = createSafeFetch({ resolve, isAllowed: allow127, allowCustomPorts: true });

    const result = await fetcher(new URL(`http://rebind.example:${port}/`));
    assert.equal(result.body, "<html>ok</html>");
    assert.equal(calls, 1);
  });

  it("re-checks the connected address, not only the DNS answer", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "text/html" }).end("x"));
    let checks = 0;
    // Passes at DNS time, fails when the socket connects.
    const isAllowed = () => ++checks === 1;
    const fetcher = createSafeFetch({ resolve: toLoopback, isAllowed, allowCustomPorts: true });
    await assert.rejects(() => fetcher(new URL(`http://x.example:${port}/`)), FetchBlockedError);
  });
});

describe("safeFetch: redirects", () => {
  it("follows a redirect and returns the final URL", async () => {
    const port = await serve((req, res) => {
      if (req.url === "/start") return res.writeHead(302, { location: "/final" }).end();
      res.writeHead(200, { "content-type": "text/html" }).end("<html>final</html>");
    });
    const result = await local()(new URL(`http://a.example:${port}/start`));
    assert.equal(result.finalUrl.pathname, "/final");
    assert.equal(result.body, "<html>final</html>");
  });

  it("blocks a redirect to a private IP literal", async () => {
    const port = await serve((_req, res) => res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end());
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`)), FetchBlockedError);
  });

  it("blocks a redirect to a hostname that resolves privately", async () => {
    const port = await serve((_req, res) => res.writeHead(302, { location: `http://internal.example:${port}/` }).end());
    const resolve: Resolver = async (host) => [{ address: host === "internal.example" ? "127.0.0.2" : "127.0.0.1", family: 4 }];
    await assert.rejects(() => local({ resolve })(new URL(`http://a.example:${port}/`)), FetchBlockedError);
  });

  it("blocks a redirect to a non-http scheme", async () => {
    const port = await serve((_req, res) => res.writeHead(302, { location: "file:///etc/passwd" }).end());
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`)), FetchBlockedError);
  });

  it("stops after too many redirects", async () => {
    const port = await serve((_req, res) => res.writeHead(302, { location: "/again" }).end());
    await assert.rejects(() => local({ maxRedirects: 3 })(new URL(`http://a.example:${port}/`)), /too many redirects/);
  });
});

describe("safeFetch: response limits", () => {
  it("rejects a JSON body over the size cap", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "application/json" }).end("x".repeat(5000)));
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`), { maxBytes: 1000 }), /too large/);
  });

  it("truncates HTML at the cap when truncation is allowed", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "text/html" }).end("y".repeat(5000)));
    const result = await local()(new URL(`http://a.example:${port}/`), { maxBytes: 1000, truncate: true });
    assert.equal(result.truncated, true);
    assert.equal(result.body.length, 1000);
  });

  it("caps decompressed size, so a gzip bomb can't exhaust memory", async () => {
    const bomb = zlib.gzipSync(Buffer.alloc(20_000_000, 0)); // ~20KB compressed, 20MB expanded
    assert.ok(bomb.length < 100_000);
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" }).end(bomb));
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`), { maxBytes: 100_000 }), /too large/);
  });

  it("decodes a normal gzip response", async () => {
    const port = await serve((_req, res) =>
      res.writeHead(200, { "content-type": "application/json", "content-encoding": "gzip" }).end(zlib.gzipSync('{"a":1}'))
    );
    const result = await local()(new URL(`http://a.example:${port}/`));
    assert.equal(result.body, '{"a":1}');
  });

  it("rejects content types that aren't HTML or JSON", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": "image/png" }).end("nope"));
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`)), /unsupported content type/);
  });

  it("rejects non-2xx statuses", async () => {
    const port = await serve((_req, res) => res.writeHead(404, { "content-type": "text/html" }).end("gone"));
    await assert.rejects(() => local()(new URL(`http://a.example:${port}/`)), /unexpected status 404/);
  });

  it("never sends cookies or credentials", async () => {
    let seen: http.IncomingHttpHeaders = {};
    const port = await serve((req, res) => {
      seen = req.headers;
      res.writeHead(200, { "content-type": "text/html" }).end("ok");
    });
    await local()(new URL(`http://a.example:${port}/`));
    assert.equal(seen.cookie, undefined);
    assert.equal(seen.authorization, undefined);
    assert.match(String(seen["user-agent"]), /TRACKr/);
  });
});

describe("safeFetch: timeouts", () => {
  it("times out on a server that never answers", async () => {
    const port = await serve(() => {
      /* hang */
    });
    await assert.rejects(() => local({ timeoutMs: 300 })(new URL(`http://a.example:${port}/`)), /timed out/);
  });

  it("times out on a slow-drip response", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      const timer = setInterval(() => res.write("a"), 50);
      res.on("close", () => clearInterval(timer));
    });
    const started = Date.now();
    await assert.rejects(() => local({ timeoutMs: 400 })(new URL(`http://a.example:${port}/`)), FetchError);
    assert.ok(Date.now() - started < 1500);
  });
});
