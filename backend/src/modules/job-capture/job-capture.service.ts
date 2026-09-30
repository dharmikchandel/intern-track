import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/AppError.js";
import { FetchBlockedError, validateJobUrl } from "./ssrf.js";
import { FetchError, safeFetch, type SafeFetch } from "./safeFetch.js";
import {
  cleanLink,
  detectProvider,
  extractJsonLdJobPosting,
  extractMeta,
  isPlatformName,
  parseGreenhouseJob,
  parseLeverPosting,
  providerApiUrl,
  splitTitle,
  urlHints,
  type Extracted,
} from "./parsers.js";

export type Confidence = "high" | "medium" | "low" | "none";

export interface ParsedJob {
  // Empty string means "not found"; the client only fills fields that have a value.
  companyName: string;
  role: string;
  applicationLink: string;
  source: string;
  confidence: Confidence;
  warnings: string[];
}

// These sites block automated access (and their terms forbid scraping), so we
// don't try; the user is told to enter the details themselves.
const UNSUPPORTED_HOSTS: Record<string, string> = {
  "linkedin.com": "LinkedIn",
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
};

function unsupportedSite(hostname: string): string | undefined {
  const host = hostname.toLowerCase();
  const key = Object.keys(UNSUPPORTED_HOSTS).find((domain) => host === domain || host.endsWith(`.${domain}`));
  return key ? UNSUPPORTED_HOSTS[key] : undefined;
}

// A blocked address is the caller's problem (400); any other fetch failure just
// means we couldn't read the page and should fall back to the URL alone.
function rethrowIfBlocked(err: unknown): void {
  if (err instanceof FetchBlockedError) throw new AppError("That link can't be fetched", 400, "URL_NOT_ALLOWED");
  if (err instanceof AppError) throw err;
}

function describeFailure(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("timed out")) return "The site took too long to respond.";
  const status = message.match(/unexpected status (\d+)/)?.[1];
  if (status === "404" || status === "410") return "That job page wasn't found. It may have been taken down.";
  if (status) return `The site didn't return the page (status ${status}); it may block automated access.`;
  if (message.includes("content type")) return "That link doesn't point to a web page.";
  return "Couldn't read that page.";
}

function result(fields: Extracted, base: Pick<ParsedJob, "applicationLink" | "source" | "confidence" | "warnings">): ParsedJob {
  return { companyName: fields.companyName ?? "", role: fields.role ?? "", ...base };
}

export async function parseJobUrl(rawUrl: unknown, fetcher: SafeFetch = safeFetch): Promise<ParsedJob> {
  const url = validateJobUrl(rawUrl);
  const applicationLink = cleanLink(url);
  const warnings: string[] = [];

  const blockedSite = unsupportedSite(url.hostname);
  if (blockedSite) {
    return result({}, {
      applicationLink,
      source: blockedSite.toLowerCase(),
      confidence: "none",
      warnings: [`${blockedSite} blocks automated access, so enter the company and role yourself.`],
    });
  }

  // 1. Job boards with a public JSON API: the most reliable source.
  const provider = detectProvider(url);
  if (provider) {
    try {
      const response = await fetcher(providerApiUrl(provider), { accept: "application/json", maxBytes: 300_000 });
      const json: unknown = JSON.parse(response.body);

      if (provider.kind === "greenhouse") {
        const job = parseGreenhouseJob(json, provider.board);
        if (job.role) {
          return result(job, {
            applicationLink,
            source: "greenhouse",
            confidence: job.companyFromSlug ? "medium" : "high",
            warnings: job.companyFromSlug ? ["The company name comes from the job board address; check the spelling."] : [],
          });
        }
      } else {
        const job = parseLeverPosting(json, provider.company);
        if (job.role) {
          return result(job, {
            applicationLink,
            source: "lever",
            confidence: "medium",
            warnings: ["The company name comes from the job board address; check the spelling."],
          });
        }
      }
    } catch (err) {
      rethrowIfBlocked(err);
      logger.warn({ host: url.hostname, kind: provider.kind, err: err instanceof Error ? err.message : err }, "Job board API lookup failed");
    }
  }

  // 2. The page itself: structured data first, then meta tags.
  let finalHost = url.hostname;
  try {
    const page = await fetcher(url, { truncate: true, maxBytes: 1_000_000 });
    finalHost = page.finalUrl.hostname;
    const hints = urlHints(page.finalUrl);

    const ld = extractJsonLdJobPosting(page.body);
    if (ld?.role && ld.companyName) {
      return result(ld, { applicationLink, source: "json-ld", confidence: "high", warnings });
    }

    const meta = extractMeta(page.body);
    const split = splitTitle(meta.ogTitle ?? meta.title, meta.siteName);

    if (ld) {
      // Structured data had only one of the two fields; fill the rest as well as we can.
      const companyName = ld.companyName ?? (split.confident ? split.companyName : undefined) ?? hints.companyName;
      const role = ld.role ?? split.role ?? hints.role;
      if (!ld.companyName) warnings.push("The company name was guessed; check it.");
      return result({ companyName, role }, { applicationLink, source: "json-ld", confidence: "medium", warnings });
    }

    if (split.confident && split.role && split.companyName) {
      return result(split, { applicationLink, source: "opengraph", confidence: "medium", warnings });
    }

    if (split.role || hints.role) {
      const usableSite = meta.siteName && !isPlatformName(meta.siteName) ? meta.siteName : undefined;
      warnings.push("The page title couldn't be split reliably, so the whole title is in Role.");
      warnings.push("The company name was guessed; check it.");
      return result(
        { role: split.role ?? hints.role, companyName: usableSite ?? hints.companyName },
        { applicationLink, source: "opengraph", confidence: "low", warnings }
      );
    }
  } catch (err) {
    rethrowIfBlocked(err);
    logger.warn({ host: url.hostname, err: err instanceof Error ? err.message : err }, "Job page fetch failed");
    warnings.push(describeFailure(err));
  }

  // 3. Nothing readable: whatever the address itself suggests, or nothing.
  const hints = urlHints(url);
  const guess: Extracted = { companyName: hints.companyName, role: hints.role };
  if (guess.companyName || guess.role) {
    warnings.push("The company name was guessed from the web address; check it.");
    return result(guess, { applicationLink, source: hints.source, confidence: "low", warnings });
  }
  warnings.push(`Couldn't find job details on ${finalHost}; enter them manually.`);
  return result({}, { applicationLink, source: "url", confidence: "none", warnings });
}

export { FetchError };
