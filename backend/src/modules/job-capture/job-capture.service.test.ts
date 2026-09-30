import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../utils/AppError.js";
import { parseJobUrl } from "./job-capture.service.js";
import { FetchError, type SafeFetch, type SafeFetchResult } from "./safeFetch.js";
import { FetchBlockedError } from "./ssrf.js";

const ok = (url: string, body: string, contentType = "text/html"): SafeFetchResult => ({ finalUrl: new URL(url), status: 200, contentType, body, truncated: false });

// A fetcher stub keyed by hostname, recording every URL it was asked for.
function stub(routes: Record<string, (url: URL) => SafeFetchResult | Error>) {
  const calls: string[] = [];
  const fetcher: SafeFetch = async (url) => {
    calls.push(url.href);
    const route = routes[url.hostname];
    if (!route) throw new FetchError("unexpected status 404");
    const out = route(url);
    if (out instanceof Error) throw out;
    return out;
  };
  return { fetcher, calls };
}

const ldPage = (json: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;
const LEVER_ID = "0a1b2c3d-1111-2222-3333-444455556666";

describe("parseJobUrl", () => {
  it("uses the Greenhouse API and reports high confidence", async () => {
    const { fetcher, calls } = stub({
      "boards-api.greenhouse.io": (u) => ok(u.href, JSON.stringify({ title: "SWE Intern", company_name: "Stripe" }), "application/json"),
    });
    const out = await parseJobUrl("https://boards.greenhouse.io/stripe/jobs/123?gh_src=abc", fetcher);
    assert.deepEqual(out, {
      companyName: "Stripe",
      role: "SWE Intern",
      applicationLink: "https://boards.greenhouse.io/stripe/jobs/123",
      source: "greenhouse",
      confidence: "high",
      warnings: [],
    });
    assert.deepEqual(calls, ["https://boards-api.greenhouse.io/v1/boards/stripe/jobs/123"]);
  });

  it("marks Lever results medium, because the company comes from the URL", async () => {
    const { fetcher } = stub({ "api.lever.co": (u) => ok(u.href, JSON.stringify({ text: "Backend Intern" }), "application/json") });
    const out = await parseJobUrl(`https://jobs.lever.co/acme-corp/${LEVER_ID}`, fetcher);
    assert.equal(out.companyName, "Acme Corp");
    assert.equal(out.role, "Backend Intern");
    assert.equal(out.confidence, "medium");
    assert.equal(out.warnings.length, 1);
  });

  it("falls back to the page when the provider API fails", async () => {
    const { fetcher, calls } = stub({
      "boards-api.greenhouse.io": () => new FetchError("unexpected status 404"),
      "boards.greenhouse.io": (u) => ok(u.href, `<head><meta property="og:title" content="Job Application for Data Intern at Globex"></head>`),
    });
    const out = await parseJobUrl("https://boards.greenhouse.io/globex/jobs/9", fetcher);
    assert.equal(out.source, "opengraph");
    assert.equal(out.role, "Data Intern");
    assert.equal(out.companyName, "Globex");
    assert.equal(calls.length, 2);
  });

  it("prefers JSON-LD from an arbitrary company page", async () => {
    const { fetcher } = stub({
      "careers.initech.com": (u) => ok(u.href, ldPage({ "@type": "JobPosting", title: "ML Intern", hiringOrganization: { name: "Initech" } })),
    });
    const out = await parseJobUrl("https://careers.initech.com/jobs/ml-intern", fetcher);
    assert.deepEqual([out.source, out.confidence, out.companyName, out.role], ["json-ld", "high", "Initech", "ML Intern"]);
  });

  it("fills a missing JSON-LD company from the page title or address, at lower confidence", async () => {
    const { fetcher } = stub({
      "careers.initech.com": (u) => ok(u.href, ldPage({ "@type": "JobPosting", title: "ML Intern" })),
    });
    const out = await parseJobUrl("https://careers.initech.com/jobs/1", fetcher);
    assert.equal(out.confidence, "medium");
    assert.equal(out.companyName, "Initech");
    assert.ok(out.warnings.some((w) => /guessed/.test(w)));
  });

  it("is honest when the title can't be split", async () => {
    const { fetcher } = stub({
      "jobs.example.com": (u) => ok(u.href, "<head><title>Summer 2026 Opportunities</title></head>"),
    });
    const out = await parseJobUrl("https://jobs.example.com/x", fetcher);
    assert.equal(out.confidence, "low");
    assert.equal(out.role, "Summer 2026 Opportunities");
    assert.ok(out.warnings.length >= 1);
  });

  it("falls back to hints from the address when the page can't be read", async () => {
    const { fetcher } = stub({});
    const out = await parseJobUrl("https://careers.stripe.com/listing/123", fetcher);
    assert.equal(out.confidence, "low");
    assert.equal(out.companyName, "Stripe");
    assert.ok(out.warnings.some((w) => /wasn't found/.test(w)));
  });

  it("returns no fields, confidence none, and a warning when there is nothing to go on", async () => {
    const { fetcher } = stub({ "localhost-ish": () => new Error("x") });
    const out = await parseJobUrl("https://x/abc", fetcher);
    assert.equal(out.confidence, "none");
    assert.equal(out.companyName, "");
    assert.equal(out.role, "");
    assert.ok(out.warnings.length >= 1);
  });

  it("does not scrape LinkedIn, Indeed or Glassdoor", async () => {
    const { fetcher, calls } = stub({});
    for (const url of ["https://www.linkedin.com/jobs/view/123", "https://uk.indeed.com/viewjob?jk=1", "https://www.glassdoor.com/job/x"]) {
      const out = await parseJobUrl(url, fetcher);
      assert.equal(out.confidence, "none");
      assert.match(out.warnings[0]!, /blocks automated access/);
    }
    assert.deepEqual(calls, []);
    // ...but a look-alike domain is not treated as LinkedIn
    const { fetcher: f2, calls: c2 } = stub({});
    await parseJobUrl("https://notlinkedin.com/jobs", f2);
    assert.equal(c2.length, 1);
  });

  it("turns a blocked address into a 400, not a silent fallback", async () => {
    const fetcher: SafeFetch = async () => {
      throw new FetchBlockedError();
    };
    await assert.rejects(
      () => parseJobUrl("https://sneaky.example/job", fetcher),
      (err: any) => err instanceof AppError && err.statusCode === 400 && err.code === "URL_NOT_ALLOWED"
    );
  });

  it("rejects invalid input before fetching anything", async () => {
    const { fetcher, calls } = stub({});
    for (const bad of ["", "nope", "ftp://x.com", "http://127.0.0.1/", "http://169.254.169.254/", 5, null]) {
      await assert.rejects(() => parseJobUrl(bad, fetcher), AppError);
    }
    assert.deepEqual(calls, []);
  });

  it("never lets scraped text through unsanitised", async () => {
    const { fetcher } = stub({
      "careers.evil.com": (u) => ok(u.href, ldPage({ "@type": "JobPosting", title: "<img src=x onerror=alert(1)>Intern" + "A".repeat(500), hiringOrganization: { name: "Evil\u0000Corp" } })),
    });
    const out = await parseJobUrl("https://careers.evil.com/j", fetcher);
    assert.ok(!out.role.includes("<") && out.role.length <= 200);
    assert.equal(out.companyName, "Evil Corp");
  });
});
