import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanLink,
  cleanText,
  companyFromHostname,
  decodeEntities,
  detectProvider,
  extractJsonLdJobPosting,
  extractMeta,
  parseGreenhouseJob,
  parseLeverPosting,
  providerApiUrl,
  splitTitle,
  titleCaseSlug,
  urlHints,
} from "./parsers.js";

const ld = (json: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;

describe("text cleanup", () => {
  it("decodes entities, strips tags and control characters, collapses whitespace", () => {
    assert.equal(cleanText("  Software&nbsp;Engineer &amp; <b>Intern</b>\n\t(2026)  "), "Software Engineer & Intern (2026)");
    assert.equal(cleanText("A\u0000B\u0007C"), "A B C");
  });
  it("returns undefined for empty or non-string input", () => {
    assert.equal(cleanText("   "), undefined);
    assert.equal(cleanText("<br>"), undefined);
    assert.equal(cleanText(42), undefined);
    assert.equal(cleanText(null), undefined);
  });
  it("caps length", () => assert.equal(cleanText("x".repeat(500))?.length, 200));
  it("decodes numeric entities and survives invalid code points", () => {
    assert.equal(decodeEntities("&#65;&#x42;"), "AB");
    assert.equal(decodeEntities("&#99999999999;"), "&#99999999999;");
    assert.equal(decodeEntities("&unknown;"), "&unknown;");
  });
});

describe("company guesses", () => {
  it("title-cases slugs", () => {
    assert.equal(titleCaseSlug("acme-corp"), "Acme Corp");
    assert.equal(titleCaseSlug("stripe"), "Stripe");
    assert.equal(titleCaseSlug("NVIDIA"), "NVIDIA");
    assert.equal(titleCaseSlug("---"), undefined);
  });
  it("derives a company from the registrable domain", () => {
    assert.equal(companyFromHostname("careers.stripe.com"), "Stripe");
    assert.equal(companyFromHostname("www.shopify.com"), "Shopify");
    assert.equal(companyFromHostname("jobs.acme.co.uk"), "Acme");
    assert.equal(companyFromHostname("localhost"), undefined);
  });
});

describe("provider detection", () => {
  it("recognises Greenhouse job URLs (incl. EU and embed forms)", () => {
    assert.deepEqual(detectProvider(new URL("https://boards.greenhouse.io/stripe/jobs/12345")), { kind: "greenhouse", board: "stripe", id: "12345", eu: false });
    assert.deepEqual(detectProvider(new URL("https://job-boards.eu.greenhouse.io/acme/jobs/77?gh_src=x")), { kind: "greenhouse", board: "acme", id: "77", eu: true });
    assert.deepEqual(detectProvider(new URL("https://boards.greenhouse.io/embed/job_app?for=stripe&token=999")), { kind: "greenhouse", board: "stripe", id: "999", eu: false });
  });
  it("recognises Lever job URLs", () => {
    const id = "0a1b2c3d-1111-2222-3333-444455556666";
    assert.deepEqual(detectProvider(new URL(`https://jobs.lever.co/acme-corp/${id}/apply`)), { kind: "lever", company: "acme-corp", id, eu: false });
    assert.equal(detectProvider(new URL(`https://jobs.eu.lever.co/acme/${id}`))?.kind, "lever");
  });
  it("ignores other hosts, even with look-alike paths", () => {
    assert.equal(detectProvider(new URL("https://evil.example/stripe/jobs/123")), null);
    assert.equal(detectProvider(new URL("https://boards.greenhouse.io.evil.example/stripe/jobs/123")), null);
    assert.equal(detectProvider(new URL("https://boards.greenhouse.io/stripe")), null);
  });
  it("refuses path-traversal or odd characters in the values it would put in an API URL", () => {
    assert.equal(detectProvider(new URL("https://boards.greenhouse.io/..%2F..%2Fadmin/jobs/1")), null);
    assert.equal(detectProvider(new URL("https://boards.greenhouse.io/stripe/jobs/1abc")), null);
    assert.equal(detectProvider(new URL("https://boards.greenhouse.io/embed/job_app?for=a/b&token=1")), null);
    assert.equal(detectProvider(new URL("https://jobs.lever.co/acme/not-a-uuid")), null);
  });
  it("builds API URLs on the provider's own hosts", () => {
    assert.equal(providerApiUrl({ kind: "greenhouse", board: "stripe", id: "1", eu: false }).href, "https://boards-api.greenhouse.io/v1/boards/stripe/jobs/1");
    assert.equal(providerApiUrl({ kind: "greenhouse", board: "acme", id: "2", eu: true }).hostname, "boards-api.eu.greenhouse.io");
    assert.equal(providerApiUrl({ kind: "lever", company: "acme", id: "u", eu: false }).hostname, "api.lever.co");
  });
});

describe("provider payloads", () => {
  it("reads a Greenhouse job", () => {
    const job = parseGreenhouseJob({ title: "Software Engineer Intern", company_name: "Stripe" }, "stripe");
    assert.deepEqual(job, { role: "Software Engineer Intern", companyName: "Stripe", companyFromSlug: false });
  });
  it("falls back to the board name when Greenhouse omits the company", () => {
    const job = parseGreenhouseJob({ title: "Intern" }, "acme-corp");
    assert.equal(job.companyName, "Acme Corp");
    assert.equal(job.companyFromSlug, true);
  });
  it("tolerates junk payloads", () => {
    assert.equal(parseGreenhouseJob(null, "x").role, undefined);
    assert.equal(parseGreenhouseJob("string", "x").role, undefined);
    assert.equal(parseLeverPosting([], "x").role, undefined);
  });
  it("reads a Lever posting and strips HTML from the title", () => {
    assert.deepEqual(parseLeverPosting({ text: "Backend <em>Intern</em>" }, "acme"), { role: "Backend Intern", companyName: "Acme" });
  });
});

describe("JSON-LD JobPosting", () => {
  it("reads a plain JobPosting with an organization object", () => {
    const html = ld({ "@context": "https://schema.org", "@type": "JobPosting", title: "Data Intern", hiringOrganization: { "@type": "Organization", name: "Globex" } });
    assert.deepEqual(extractJsonLdJobPosting(html), { role: "Data Intern", companyName: "Globex" });
  });
  it("finds a JobPosting inside @graph and arrays", () => {
    const graph = ld({ "@graph": [{ "@type": "WebSite", name: "x" }, { "@type": "JobPosting", title: "ML Intern", hiringOrganization: "Initech" }] });
    assert.deepEqual(extractJsonLdJobPosting(graph), { role: "ML Intern", companyName: "Initech" });
    const arr = ld([{ "@type": ["Thing", "JobPosting"], title: "SRE Intern", hiringOrganization: [{ name: "Umbrella" }] }]);
    assert.deepEqual(extractJsonLdJobPosting(arr), { role: "SRE Intern", companyName: "Umbrella" });
  });
  it("ignores malformed or unrelated blocks and keeps looking", () => {
    const html = `<script type="application/ld+json">{ broken</script>
      <script type="application/ld+json">{"@type":"Organization","name":"x"}</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Found","hiringOrganization":{"name":"Co"}}</script>`;
    assert.deepEqual(extractJsonLdJobPosting(html), { role: "Found", companyName: "Co" });
  });
  it("returns null when there is none", () => {
    assert.equal(extractJsonLdJobPosting("<html><script>var a=1</script></html>"), null);
    assert.equal(extractJsonLdJobPosting(ld({ "@type": "JobPosting" })), null);
  });
  it("does not go quadratic on hostile markup", () => {
    const started = Date.now();
    extractJsonLdJobPosting("<script ".repeat(50_000));
    extractJsonLdJobPosting("<script type='application/ld+json'>".repeat(50_000));
    extractMeta("<meta ".repeat(50_000));
    cleanText("<".repeat(200_000), 300);
    cleanText("<a ".repeat(100_000), 300);
    assert.ok(Date.now() - started < 1000, `took ${Date.now() - started}ms`);
  });
});

describe("meta tags and titles", () => {
  it("reads og:title, og:site_name and <title>, with entities", () => {
    const html = `<head><title>Fallback &amp; Title</title>
      <meta property="og:title" content="Intern at Acme">
      <meta content="Acme Careers" property="og:site_name"></head>`;
    assert.deepEqual(extractMeta(html), { ogTitle: "Intern at Acme", siteName: "Acme Careers", title: "Fallback & Title" });
  });
  it("only looks at the head", () => {
    assert.equal(extractMeta("<head></head><body><meta property='og:title' content='late'></body>").ogTitle, undefined);
  });

  it("splits 'Role at Company' (Greenhouse style) confidently", () => {
    assert.deepEqual(splitTitle("Job Application for Software Engineer Intern at Stripe"), { role: "Software Engineer Intern", companyName: "Stripe", confident: true });
    assert.deepEqual(splitTitle("Engineer at Scale AI"), { role: "Engineer", companyName: "Scale AI", confident: true });
  });
  it("uses the site name to decide which side of a separator is the company", () => {
    assert.deepEqual(splitTitle("Data Intern - Globex", "Globex"), { role: "Data Intern", companyName: "Globex", confident: true });
    assert.deepEqual(splitTitle("Globex | Data Intern", "Globex"), { role: "Data Intern", companyName: "Globex", confident: true });
  });
  it("does not guess when the split is ambiguous", () => {
    assert.deepEqual(splitTitle("Data Intern - Summer 2026"), { role: "Data Intern - Summer 2026", confident: false });
    assert.equal(splitTitle("Data Intern - Globex", "Greenhouse").confident, false);
    assert.deepEqual(splitTitle(undefined), { confident: false });
  });
});

describe("url hints and link cleanup", () => {
  it("guesses from known applicant-tracking hosts", () => {
    assert.deepEqual(urlHints(new URL("https://jobs.ashbyhq.com/acme-corp/abc")), { source: "ashby", companyName: "Acme Corp" });
    const workday = urlHints(new URL("https://nvidia.wd5.myworkdayjobs.com/en-US/Careers/job/US-CA/Software-Engineer-Intern_JR12345-1"));
    assert.equal(workday.source, "workday");
    assert.equal(workday.companyName, "Nvidia");
    assert.equal(workday.role, "Software Engineer Intern");
    assert.deepEqual(urlHints(new URL("https://careers.stripe.com/jobs/1")), { source: "url", companyName: "Stripe" });
    // a job board's own domain is never the employer
    assert.deepEqual(urlHints(new URL("https://boards.greenhouse.io/stripe/jobs/1")), { source: "greenhouse", companyName: "Stripe" });
    assert.deepEqual(urlHints(new URL("https://boards.greenhouse.io/embed/job_app?for=acme-corp&token=1")), { source: "greenhouse", companyName: "Acme Corp" });
    assert.deepEqual(urlHints(new URL("https://jobs.lever.co/acme/whatever")), { source: "lever", companyName: "Acme" });
    assert.equal(urlHints(new URL("https://www.smartrecruiters.com/x/1")).companyName, undefined);
  });
  it("removes tracking parameters and fragments only", () => {
    assert.equal(
      cleanLink(new URL("https://boards.greenhouse.io/stripe/jobs/1?gh_src=abc&utm_source=x&UTM_Medium=y&keep=1#apply")),
      "https://boards.greenhouse.io/stripe/jobs/1?keep=1"
    );
  });
});
