// Pure functions that turn fetched job-page content into { companyName, role }.
// Everything here treats its input as untrusted third-party text.

export type Extracted = {
  companyName?: string | undefined;
  role?: string | undefined;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1]?.toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
      } catch {
        return whole; // out-of-range code point
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

// Plain text only, with control characters removed and a length cap, since the
// value ends up in a form field and then in the database.
export function cleanText(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = decodeEntities(value)
    .replace(/<[^<>]*>/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text === "" ? undefined : text.slice(0, max);
}

export function titleCaseSlug(slug: string): string | undefined {
  const words = slug.replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;
  return words.map((w) => (w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

const SECOND_LEVEL_LABELS = new Set(["co", "com", "org", "net", "ac", "gov", "edu"]);

// careers.stripe.com -> "Stripe"; jobs.acme.co.uk -> "Acme". A guess, not a fact.
export function companyFromHostname(hostname: string): string | undefined {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length < 2) return undefined;
  const last = labels[labels.length - 1]!;
  const second = labels[labels.length - 2]!;
  const label = labels.length >= 3 && last.length === 2 && SECOND_LEVEL_LABELS.has(second) ? labels[labels.length - 3]! : second;
  return titleCaseSlug(label);
}

// ---- job boards with a public JSON API ------------------------------------

export type ProviderMatch =
  | { kind: "greenhouse"; board: string; id: string; eu: boolean }
  | { kind: "lever"; company: string; id: string; eu: boolean };

// These values are interpolated into an API URL path, so they are validated
// against a strict pattern rather than trusted.
const SLUG = /^[A-Za-z0-9_-]{1,100}$/;
const NUMERIC_ID = /^\d{1,20}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GREENHOUSE_HOSTS = ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards.eu.greenhouse.io", "job-boards.eu.greenhouse.io"];
const LEVER_HOSTS = ["jobs.lever.co", "jobs.eu.lever.co"];

export function detectProvider(url: URL): ProviderMatch | null {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (GREENHOUSE_HOSTS.includes(host)) {
    const eu = host.includes(".eu.");
    // https://boards.greenhouse.io/{board}/jobs/{id}
    if (segments[1] === "jobs" && SLUG.test(segments[0] ?? "") && NUMERIC_ID.test(segments[2] ?? "")) {
      return { kind: "greenhouse", board: segments[0]!, id: segments[2]!, eu };
    }
    // https://boards.greenhouse.io/embed/job_app?for={board}&token={id}
    if (segments[0] === "embed" && segments[1] === "job_app") {
      const board = url.searchParams.get("for") ?? "";
      const id = url.searchParams.get("token") ?? "";
      if (SLUG.test(board) && NUMERIC_ID.test(id)) return { kind: "greenhouse", board, id, eu };
    }
    return null;
  }

  if (LEVER_HOSTS.includes(host)) {
    // https://jobs.lever.co/{company}/{uuid}[/apply]
    if (SLUG.test(segments[0] ?? "") && UUID.test(segments[1] ?? "")) {
      return { kind: "lever", company: segments[0]!, id: segments[1]!, eu: host.includes(".eu.") };
    }
  }
  return null;
}

export function providerApiUrl(match: ProviderMatch): URL {
  if (match.kind === "greenhouse") {
    return new URL(`https://boards-api${match.eu ? ".eu" : ""}.greenhouse.io/v1/boards/${match.board}/jobs/${match.id}`);
  }
  return new URL(`https://api${match.eu ? ".eu" : ""}.lever.co/v0/postings/${match.company}/${match.id}`);
}

export function parseGreenhouseJob(json: unknown, board: string): Extracted & { companyFromSlug: boolean } {
  const data = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const fromApi = cleanText(data.company_name);
  return {
    role: cleanText(data.title),
    companyName: fromApi ?? titleCaseSlug(board),
    companyFromSlug: !fromApi,
  };
}

// Lever's posting JSON has the role title but not the company name.
export function parseLeverPosting(json: unknown, company: string): Extracted {
  const data = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  return { role: cleanText(data.text), companyName: titleCaseSlug(company) };
}

// ---- hints from the URL alone ---------------------------------------------

// Job-board domains: the domain says nothing about the employer, so it is never
// used as a company guess (only a slug in the path can be).
const PLATFORM_DOMAINS = ["greenhouse.io", "lever.co", "ashbyhq.com", "workable.com", "myworkdayjobs.com", "smartrecruiters.com", "icims.com", "jobvite.com"];

export function urlHints(url: URL): Extracted & { source: string } {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (GREENHOUSE_HOSTS.includes(host) || LEVER_HOSTS.includes(host)) {
    const slug = segments[0] && segments[0] !== "embed" && SLUG.test(segments[0]) ? segments[0] : url.searchParams.get("for");
    return { source: GREENHOUSE_HOSTS.includes(host) ? "greenhouse" : "lever", companyName: slug && SLUG.test(slug) ? titleCaseSlug(slug) : undefined };
  }

  if (host === "jobs.ashbyhq.com" && segments[0]) {
    return { source: "ashby", companyName: titleCaseSlug(decodeURIComponentSafe(segments[0])) };
  }
  if (host === "apply.workable.com" && segments[0]) {
    return { source: "workable", companyName: titleCaseSlug(decodeURIComponentSafe(segments[0])) };
  }
  if (host.endsWith(".myworkdayjobs.com")) {
    const tenant = host.split(".")[0];
    const last = segments.length > 1 && segments.includes("job") ? decodeURIComponentSafe(segments[segments.length - 1]!) : undefined;
    // "Software-Engineer-Intern_R12345-1" -> "Software Engineer Intern"
    const role = last ? titleCaseSlug(last.replace(/_[A-Za-z0-9-]+$/, "")) : undefined;
    return { source: "workday", companyName: tenant ? titleCaseSlug(tenant) : undefined, role };
  }
  const isPlatform = PLATFORM_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  return { source: "url", companyName: isPlatform ? undefined : companyFromHostname(host) };
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// ---- structured data & meta tags ------------------------------------------

const MAX_LD_BLOCKS = 20;
// Real pages have a few dozen <script> tags at most; capping the scan keeps a
// page made of thousands of them from costing real CPU.
const MAX_SCRIPT_TAGS_SCANNED = 300;
const MAX_LD_BLOCK_CHARS = 500_000;

// Finds <script type="application/ld+json"> blocks with indexOf and a bounded
// tag pattern (a bare `[^>]*` rescans to the end of the page from every
// unclosed "<script", which is quadratic), so hostile pages can't make it slow.
function* jsonLdBlocks(html: string): Generator<string> {
  const lower = html.toLowerCase();
  // [^<>] (not just [^>]) so a failed attempt at an unclosed "<script" stops at the
  // next "<" instead of scanning ahead up to the length bound every time.
  const openTag = /<script\b([^<>]{0,2000})>/gi;
  let count = 0;
  let scanned = 0;
  let match: RegExpExecArray | null;
  while (count < MAX_LD_BLOCKS && scanned++ < MAX_SCRIPT_TAGS_SCANNED && (match = openTag.exec(html)) !== null) {
    const contentStart = openTag.lastIndex;
    const end = lower.indexOf("</script", contentStart);
    if (end === -1) return;
    if (/type\s*=\s*["']?application\/ld\+json/i.test(match[1] ?? "")) {
      count++;
      if (end - contentStart <= MAX_LD_BLOCK_CHARS) yield html.slice(contentStart, end);
    }
    openTag.lastIndex = end;
  }
}

function typeIncludes(node: Record<string, unknown>, wanted: string): boolean {
  const type = node["@type"];
  return type === wanted || (Array.isArray(type) && type.includes(wanted));
}

function findJobPosting(node: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 4 || node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  if (typeIncludes(obj, "JobPosting")) return obj;
  return findJobPosting(obj["@graph"], depth + 1);
}

function organizationName(value: unknown): string | undefined {
  if (Array.isArray(value)) return organizationName(value[0]);
  if (typeof value === "string") return cleanText(value);
  if (value && typeof value === "object") return cleanText((value as Record<string, unknown>).name);
  return undefined;
}

export function extractJsonLdJobPosting(html: string): Extracted | null {
  for (const block of jsonLdBlocks(html)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block.replace(/^\s*<!--|-->\s*$/g, "").trim());
    } catch {
      continue; // malformed structured data is common; just ignore it
    }
    const job = findJobPosting(parsed);
    if (!job) continue;

    const result: Extracted = {
      role: cleanText(job.title) ?? cleanText(job.name),
      companyName: organizationName(job.hiringOrganization),
    };
    if (result.role || result.companyName) return result;
  }
  return null;
}

export type PageMeta = { ogTitle?: string | undefined; siteName?: string | undefined; title?: string | undefined };

const MAX_META_TAGS = 200;
const HEAD_SCAN_CHARS = 100_000;

export function extractMeta(html: string): PageMeta {
  const headEnd = html.toLowerCase().indexOf("</head>");
  const head = html.slice(0, headEnd === -1 ? HEAD_SCAN_CHARS : Math.min(headEnd, HEAD_SCAN_CHARS));

  const meta: PageMeta = {};
  const tag = /<meta\b[^>]{0,2000}>/gi;
  let match: RegExpExecArray | null;
  let scanned = 0;
  while (scanned++ < MAX_META_TAGS && (match = tag.exec(head)) !== null) {
    const attrs = new Map<string, string>();
    const attr = /([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let a: RegExpExecArray | null;
    while ((a = attr.exec(match[0])) !== null) {
      attrs.set(a[1]!.toLowerCase(), a[2] ?? a[3] ?? a[4] ?? "");
    }
    const key = (attrs.get("property") ?? attrs.get("name") ?? "").toLowerCase();
    const content = attrs.get("content");
    if (content === undefined) continue;
    if (key === "og:title" && meta.ogTitle === undefined) meta.ogTitle = cleanText(content);
    else if (key === "og:site_name" && meta.siteName === undefined) meta.siteName = cleanText(content);
    else if (key === "twitter:title" && meta.ogTitle === undefined) meta.ogTitle = cleanText(content);
  }

  const lower = head.toLowerCase();
  const titleStart = lower.indexOf("<title");
  if (titleStart !== -1) {
    const open = head.indexOf(">", titleStart);
    const close = lower.indexOf("</title>", open);
    if (open !== -1 && close !== -1) meta.title = cleanText(head.slice(open + 1, close), 300);
  }
  return meta;
}

// ---- title splitting -------------------------------------------------------

// Site names that describe the job board, not the employer.
const PLATFORM_NAMES = ["greenhouse", "lever", "workday", "ashby", "workable", "smartrecruiters", "linkedin", "indeed", "glassdoor", "careers", "jobs"];

export function isPlatformName(name: string | undefined): boolean {
  if (!name) return true;
  const lower = name.toLowerCase();
  return PLATFORM_NAMES.some((p) => lower === p || lower.startsWith(`${p} `) || lower.endsWith(` ${p}`));
}

export type TitleSplit = { role?: string | undefined; companyName?: string | undefined; confident: boolean };

// Page titles come in a handful of shapes:
//   "Job Application for Software Engineer at Stripe"   (Greenhouse)
//   "Software Engineer at Stripe"
//   "Software Engineer - Stripe" / "Stripe | Software Engineer"
// Only splits that can be justified are marked confident; otherwise the whole
// title is returned as the role and the caller is told not to trust the company.
export function splitTitle(rawTitle: string | undefined, siteName?: string): TitleSplit {
  const title = cleanText((rawTitle ?? "").replace(/^job application for\s+/i, ""), 300);
  if (!title) return { confident: false };

  const at = title.match(/^(.+)\s+at\s+(.+)$/i);
  if (at) return { role: at[1]!.trim(), companyName: at[2]!.trim(), confident: true };

  const parts = title.split(/\s+[|\-–—·•]\s+/).map((p) => p.trim()).filter(Boolean);
  const site = siteName?.toLowerCase();
  if (parts.length >= 2 && site && !isPlatformName(siteName)) {
    const idx = parts.findIndex((p) => p.toLowerCase() === site || p.toLowerCase().includes(site) || site.includes(p.toLowerCase()));
    if (idx !== -1) {
      const others = parts.filter((_, i) => i !== idx);
      return { role: others[0], companyName: siteName, confident: true };
    }
  }
  return { role: title, confident: false };
}

// ---- link cleanup ----------------------------------------------------------

const TRACKING_PARAMS = new Set(["gclid", "fbclid", "msclkid", "gh_src", "lever-source", "lever-origin", "ref", "trk", "trackingid"]);

// The saved link should be the job page, not a tracking-decorated copy.
export function cleanLink(url: URL): string {
  const copy = new URL(url.href);
  for (const key of [...copy.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith("utm_") || TRACKING_PARAMS.has(lower)) copy.searchParams.delete(key);
  }
  copy.hash = "";
  return copy.href;
}
