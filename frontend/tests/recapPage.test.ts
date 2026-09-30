// Run with any TypeScript-capable Node runner, e.g. from /frontend:
//   ../backend/node_modules/.bin/tsx --test tests/recapPage.test.ts
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, describe, it } from "node:test";
import handler, { buildMeta, renderRecapHtml, resolveApiBase, resolveOrigin } from "../api/recap-page.ts";

const SHELL = `<!doctype html><html><head><meta charset="UTF-8" /><title>tired of using excel? - use TRACKr</title></head><body><div id="root"></div></body></html>`;
const SLUG = "abcdefghijklmnopqrstuv";
const recap = { periodStart: "2026-09-01", periodEnd: "2026-09-30", stats: { applications: 10, interviewRate: 40, offers: 1, longestStreakDays: 4 } };

describe("renderRecapHtml", () => {
  it("replaces the title and adds Open Graph tags before </head>", () => {
    const html = renderRecapHtml(SHELL, buildMeta(recap, `https://x.dev/r/${SLUG}`));
    assert.match(html, /<title>Job search recap: 10 applications, 40% interview rate<\/title>/);
    assert.match(html, /property="og:title" content="Job search recap: 10 applications, 40% interview rate"/);
    assert.match(html, /property="og:description" content="Sep 1, 2026 - Sep 30, 2026\. 1 offer and a 4-day applying streak/);
    assert.match(html, new RegExp(`property="og:url" content="https://x.dev/r/${SLUG}"`));
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.ok(html.indexOf('og:title') < html.indexOf("</head>"));
    assert.ok(html.includes('<div id="root">'), "the app shell is preserved");
    assert.ok(!html.includes("tired of using excel"), "old title replaced");
  });
  it("uses singular wording for one application/offer", () => {
    const one = buildMeta({ ...recap, stats: { ...recap.stats, applications: 1, offers: 1 } }, "u");
    assert.match(one.title, /1 application,/);
    assert.match(one.description, /1 offer and/);
  });
  it("escapes everything it injects", () => {
    const html = renderRecapHtml(SHELL, { title: `"><script>alert(1)</script>`, description: `a & b 'c'`, pageUrl: `https://x/"><img src=x>` });
    assert.ok(!html.includes("<script>alert"));
    assert.ok(!html.includes(`"><img`));
    assert.match(html, /&quot;&gt;&lt;script&gt;/);
    assert.match(html, /a &amp; b &#39;c&#39;/);
  });
  it("tolerates replacement patterns in values ($& and friends)", () => {
    const html = renderRecapHtml(SHELL, { title: "$& $1 $`", description: "d", pageUrl: "u" });
    assert.ok(html.includes("<title>$&amp; $1 $`</title>"));
  });
  it("returns the shell unchanged when there is nothing to inject", () => assert.equal(renderRecapHtml(SHELL, null), SHELL));
  it("clamps odd numbers coming back from the API", () => {
    const meta = buildMeta({ ...recap, stats: { applications: -5, interviewRate: NaN, offers: "x" as unknown as number, longestStreakDays: 2.6 } }, "u");
    assert.match(meta.title, /0 applications, 0% interview rate/);
    assert.match(meta.description, /3-day/);
  });
});

describe("configuration", () => {
  it("never derives the origin from a request header", () => {
    assert.equal(resolveOrigin({}), null);
    assert.equal(resolveOrigin({ SITE_URL: "https://trackr.dev/" }), "https://trackr.dev");
    assert.equal(resolveOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "trackr.dev", VERCEL_URL: "x.vercel.app" }), "https://trackr.dev");
    assert.equal(resolveOrigin({ VERCEL_URL: "x.vercel.app" }), "https://x.vercel.app");
  });
  it("requires an https API base (http only for localhost)", () => {
    assert.equal(resolveApiBase({ VITE_API_URL_PROD: "https://api.example.com/api/v1/" }), "https://api.example.com/api/v1");
    assert.equal(resolveApiBase({ VITE_API_URL_PROD: "http://localhost:3000/api/v1" }), "http://localhost:3000/api/v1");
    assert.equal(resolveApiBase({ VITE_API_URL_PROD: "http://evil.example/api" }), null);
    assert.equal(resolveApiBase({ VITE_API_URL_PROD: "javascript:alert(1)" }), null);
    assert.equal(resolveApiBase({ VITE_API_URL_PROD: "not a url" }), null);
    assert.equal(resolveApiBase({}), null);
  });
});

describe("handler", () => {
  const servers: http.Server[] = [];
  const listen = (fn: http.RequestListener) =>
    new Promise<number>((resolve) => {
      const s = http.createServer(fn).listen(0, "127.0.0.1", () => {
        servers.push(s);
        resolve((s.address() as AddressInfo).port);
      });
    });
  after(() => servers.forEach((s) => s.closeAllConnections?.() ?? s.close()));

  async function run(slug: string, apiStatus: number | "down", apiBody = JSON.stringify(recap)) {
    const site = await listen((_req, res) => res.writeHead(200, { "content-type": "text/html" }).end(SHELL));
    const seen: string[] = [];
    const api = await listen((req, res) => {
      seen.push(req.url ?? "");
      if (apiStatus === "down") return req.socket.destroy();
      res.writeHead(apiStatus, { "content-type": "application/json" }).end(apiBody);
    });
    process.env.SITE_URL = `http://127.0.0.1:${site}`;
    process.env.VITE_API_URL_PROD = `http://127.0.0.1:${api}/api/v1`;
    const fn = await listen((req, res) => void handler(req, res));
    const res = await fetch(`http://127.0.0.1:${fn}/api/recap-page?slug=${encodeURIComponent(slug)}`);
    return { status: res.status, body: await res.text(), headers: res.headers, seen };
  }

  it("serves the shell with recap tags for a live link", async () => {
    const r = await run(SLUG, 200);
    assert.equal(r.status, 200);
    assert.match(r.body, /og:title/);
    assert.equal(r.headers.get("cache-control"), "no-cache");
    assert.match(r.headers.get("x-robots-tag") ?? "", /noindex/);
    assert.deepEqual(r.seen, [`/api/v1/public/recap/${SLUG}`]);
  });
  it("returns 404 with the plain shell for an unknown or revoked link", async () => {
    const r = await run(SLUG, 404, JSON.stringify({ error: "Recap not found" }));
    assert.equal(r.status, 404);
    assert.ok(!r.body.includes("og:title"));
    assert.ok(r.body.includes('<div id="root">'));
  });
  it("never calls the API for a malformed slug (no path injection)", async () => {
    for (const bad of ["short", "../../admin", `${SLUG}/extra`, "a".repeat(22) + "%0d%0a"]) {
      const r = await run(bad, 200);
      assert.equal(r.status, 404, bad);
      assert.deepEqual(r.seen, [], bad);
    }
  });
  it("still serves the app when the API is down or returns garbage", async () => {
    for (const r of [await run(SLUG, "down"), await run(SLUG, 200, "not json"), await run(SLUG, 500, "boom")]) {
      assert.equal(r.status, 200);
      assert.ok(r.body.includes('<div id="root">'));
      assert.ok(!r.body.includes("og:title"));
    }
  });
});
