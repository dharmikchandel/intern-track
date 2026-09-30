import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { LookupFunction } from "node:net";
import type { Readable } from "node:stream";
import { AppError } from "../../utils/AppError.js";
import { FetchBlockedError, isPublicAddress, validateJobUrl } from "./ssrf.js";

// Network / protocol failure while fetching a page (timeouts, bad status,
// wrong content type, oversize body...). Callers treat it as "could not read
// that page" and fall back to what the URL alone tells us.
export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchError";
  }
}

export type Resolver = (hostname: string, family: number) => Promise<{ address: string; family: number }[]>;

export interface SafeFetchDeps {
  resolve?: Resolver;
  isAllowed?: (ip: string) => boolean;
  /** Total budget across every redirect hop. */
  timeoutMs?: number;
  maxRedirects?: number;
  /** Tests only: lets local servers on ephemeral ports be used. Never set in production code. */
  allowCustomPorts?: boolean;
}

export interface SafeFetchOptions {
  maxBytes?: number;
  /** HTML can be cut off (the useful tags are near the top); JSON cannot. */
  truncate?: boolean;
  accept?: string;
}

export interface SafeFetchResult {
  finalUrl: URL;
  status: number;
  contentType: string;
  body: string;
  truncated: boolean;
}

export type SafeFetch = (url: URL, options?: SafeFetchOptions) => Promise<SafeFetchResult>;

const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "application/json", "application/ld+json"];
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

const defaultResolve: Resolver = (hostname, family) =>
  dns.promises.lookup(hostname, { all: true, family, verbatim: true });

export function createSafeFetch(deps: SafeFetchDeps = {}): SafeFetch {
  const resolve = deps.resolve ?? defaultResolve;
  const isAllowed = deps.isAllowed ?? isPublicAddress;
  const timeoutMs = deps.timeoutMs ?? 8000;
  const maxRedirects = deps.maxRedirects ?? 3;
  const allowCustomPorts = deps.allowCustomPorts ?? false;

  // Runs inside the socket's own connect step, so the address that was checked
  // is the address that gets connected to. There is no second lookup an
  // attacker's DNS server could answer differently (DNS rebinding). Every
  // returned address must be public, so a mixed public+private answer is
  // rejected instead of trusting whichever one happens to be picked.
  const lookup: LookupFunction = (hostname, options, callback) => {
    const family = options.family === "IPv4" ? 4 : options.family === "IPv6" ? 6 : (options.family ?? 0);
    resolve(hostname, family).then(
      (addresses) => {
        if (addresses.length === 0) return callback(new FetchError("host not found") as NodeJS.ErrnoException, "", 4);
        if (addresses.some((a) => !isAllowed(a.address))) {
          return callback(new FetchBlockedError() as unknown as NodeJS.ErrnoException, "", 4);
        }
        const wanted = family ? addresses.filter((a) => a.family === family) : addresses;
        const usable = wanted.length > 0 ? wanted : addresses;
        if (options.all) callback(null, usable);
        else callback(null, usable[0]!.address, usable[0]!.family);
      },
      (err) => callback(new FetchError(`dns lookup failed: ${err?.code ?? err?.message}`) as NodeJS.ErrnoException, "", 4)
    );
  };

  type Hop = { redirectTo: string } | { result: SafeFetchResult };

  function requestOnce(url: URL, deadline: number, opts: Required<Omit<SafeFetchOptions, "accept">> & { accept: string }): Promise<Hop> {
    return new Promise<Hop>((resolveHop, rejectHop) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return rejectHop(new FetchError("timed out"));

      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };
      const fail = (err: Error) => settle(() => rejectHop(err));

      const isHttps = url.protocol === "https:";
      const req = (isHttps ? https : http).request(
        {
          host: url.hostname.replace(/^\[|\]$/g, ""),
          port: url.port ? Number(url.port) : isHttps ? 443 : 80,
          path: url.pathname + url.search,
          method: "GET",
          agent: false,
          lookup,
          // No cookies or credentials are ever sent.
          headers: {
            "User-Agent": "TRACKr-JobCapture/1.0",
            Accept: opts.accept,
            "Accept-Encoding": "gzip, deflate, br",
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;

          if (REDIRECT_STATUSES.includes(status)) {
            res.resume();
            const location = res.headers.location;
            if (!location) return fail(new FetchError("redirect without a location"));
            return settle(() => resolveHop({ redirectTo: location }));
          }
          if (status < 200 || status >= 300) {
            res.resume();
            return fail(new FetchError(`unexpected status ${status}`));
          }

          const contentType = String(res.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
          if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
            res.resume();
            return fail(new FetchError(`unsupported content type ${contentType || "(none)"}`));
          }

          const encoding = String(res.headers["content-encoding"] ?? "identity").toLowerCase();
          let body: Readable = res;
          if (encoding === "gzip" || encoding === "x-gzip") body = res.pipe(zlib.createGunzip());
          else if (encoding === "deflate") body = res.pipe(zlib.createInflate());
          else if (encoding === "br") body = res.pipe(zlib.createBrotliDecompress());
          else if (encoding !== "identity" && encoding !== "") {
            res.resume();
            return fail(new FetchError(`unsupported content encoding ${encoding}`));
          }
          res.on("error", (err) => fail(new FetchError(err.message)));

          // The cap applies to DECOMPRESSED bytes, so a small compressed
          // payload that expands enormously can't exhaust memory.
          const chunks: Buffer[] = [];
          let size = 0;
          const finish = (truncated: boolean) =>
            settle(() =>
              resolveHop({
                result: { finalUrl: url, status, contentType, body: Buffer.concat(chunks).toString("utf8"), truncated },
              })
            );

          body.on("data", (chunk: Buffer) => {
            if (settled) return;
            size += chunk.length;
            if (size > opts.maxBytes) {
              if (!opts.truncate) {
                req.destroy();
                return fail(new FetchError("response too large"));
              }
              chunks.push(chunk.subarray(0, chunk.length - (size - opts.maxBytes)));
              req.destroy();
              return finish(true);
            }
            chunks.push(chunk);
          });
          body.on("end", () => finish(false));
          body.on("error", (err) => fail(new FetchError(err.message)));
        }
      );

      // Second layer: whatever the socket actually connected to must be public
      // too. This is also what covers IP-literal hosts, which skip `lookup`.
      req.on("socket", (socket) => {
        socket.on("connect", () => {
          if (!isAllowed(socket.remoteAddress ?? "")) req.destroy(new FetchBlockedError());
        });
      });

      const timer = setTimeout(() => {
        req.destroy();
        fail(new FetchError("timed out"));
      }, remaining);

      req.on("error", (err) => {
        if (err instanceof FetchBlockedError || err.name === "FetchBlockedError") return fail(new FetchBlockedError());
        fail(err instanceof FetchError ? err : new FetchError(err.message));
      });
      req.end();
    });
  }

  return async (start, options = {}) => {
    const opts = {
      maxBytes: options.maxBytes ?? 1_000_000,
      truncate: options.truncate ?? false,
      accept: options.accept ?? "text/html,application/xhtml+xml,application/json;q=0.9",
    };
    const deadline = Date.now() + timeoutMs;
    let url = start;

    for (let hop = 0; ; hop++) {
      // Every hop, including the first, goes through the same URL rules.
      try {
        validateJobUrl(url.href, isAllowed, { allowCustomPorts });
      } catch (err) {
        if (err instanceof AppError) throw new FetchBlockedError();
        throw err;
      }

      const outcome = await requestOnce(url, deadline, opts);
      if ("result" in outcome) return outcome.result;

      if (hop >= maxRedirects) throw new FetchError("too many redirects");
      try {
        url = new URL(outcome.redirectTo, url);
      } catch {
        throw new FetchError("invalid redirect location");
      }
    }
  };
}

export const safeFetch = createSafeFetch();
