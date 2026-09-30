// Vercel serverless function behind /r/:slug (see vercel.json).
//
// The app is a single-page app, and link-preview crawlers (LinkedIn, Slack,
// X...) don't run JavaScript, so they would only ever see the generic page
// title. This function returns the normal app shell with the recap's Open
// Graph tags injected into <head>. Browsers then load the app as usual.
//
// It only ever fails "soft": if anything goes wrong it serves the plain shell,
// so a share link never breaks because of the preview layer.
//
// Kept in ONE file with no relative imports: Vercel compiles each file in
// /api on its own. Tests live in /tests so they are not deployed as functions.

import type { IncomingMessage, ServerResponse } from "node:http";

const SLUG = /^[A-Za-z0-9_-]{22}$/;
const FETCH_TIMEOUT_MS = 3000;

interface RecapData {
  periodStart: string;
  periodEnd: string;
  stats: { applications: number; interviewRate: number; offers: number; longestStreakDays: number };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function buildMeta(recap: RecapData, pageUrl: string) {
  const apps = num(recap.stats.applications);
  const title = `Job search recap: ${apps} ${apps === 1 ? "application" : "applications"}, ${num(recap.stats.interviewRate)}% interview rate`;
  const period = `${formatDay(recap.periodStart)} - ${formatDay(recap.periodEnd)}`;
  const offers = num(recap.stats.offers);
  const description = `${period}. ${offers} ${offers === 1 ? "offer" : "offers"} and a ${num(recap.stats.longestStreakDays)}-day applying streak. Tracked with TRACKr.`;
  return { title, description, pageUrl };
}

// Injects the tags into an HTML shell: replaces <title> and adds meta tags
// before </head>. Every value is escaped.
export function renderRecapHtml(shell: string, meta: { title: string; description: string; pageUrl: string } | null): string {
  if (!meta) return shell;
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.pageUrl);
  const tags = [
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="noindex, nofollow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="TRACKr" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
  ].join("\n  ");

  const withTitle = /<title>[\s\S]*?<\/title>/i.test(shell)
    ? shell.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${t}</title>`)
    : shell;
  return withTitle.includes("</head>") ? withTitle.replace("</head>", () => `  ${tags}\n</head>`) : withTitle;
}

// The origin comes from Vercel's own environment, never from the request's
// Host header, so a forged header can't point this function at another site.
export function resolveOrigin(env: Record<string, string | undefined>): string | null {
  const explicit = env.SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const host = env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;
  return host ? `https://${host}` : null;
}

// The API base must be https (http only for localhost, for local runs).
export function resolveApiBase(env: Record<string, string | undefined>): string | null {
  const raw = env.VITE_API_URL_PROD;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
    return url.href.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

async function fetchText(url: string, accept: string): Promise<{ status: number; body: string } | null> {
  try {
    const res = await fetch(url, { headers: { accept }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    return { status: res.status, body: await res.text() };
  } catch {
    return null;
  }
}

function send(res: ServerResponse, status: number, body: string) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    // Revalidate every time so a revoked link stops showing its numbers at once.
    "Cache-Control": "no-cache",
    "X-Robots-Tag": "noindex, nofollow",
  });
  res.end(body);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const slug = new URL(req.url ?? "", "http://internal").searchParams.get("slug") ?? "";
  const origin = resolveOrigin(process.env);
  const apiBase = resolveApiBase(process.env);

  if (!origin) return send(res, 500, "Site origin is not configured.");

  const shell = await fetchText(`${origin}/index.html`, "text/html");
  if (!shell || shell.status !== 200) return send(res, 502, "The page is temporarily unavailable.");

  // Malformed slug, or no API configured: just the normal app (it shows its own "not available" state).
  if (!SLUG.test(slug) || !apiBase) return send(res, SLUG.test(slug) ? 200 : 404, shell.body);

  const api = await fetchText(`${apiBase}/public/recap/${slug}`, "application/json");
  if (!api) return send(res, 200, shell.body); // API unreachable: still serve the app
  if (api.status === 404) return send(res, 404, shell.body); // unknown or revoked
  if (api.status !== 200) return send(res, 200, shell.body);

  try {
    const recap = JSON.parse(api.body) as RecapData;
    return send(res, 200, renderRecapHtml(shell.body, buildMeta(recap, `${origin}/r/${slug}`)));
  } catch {
    return send(res, 200, shell.body);
  }
}
