import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { logger } from "../../config/logger.js";

const CHECK_TIMEOUT_MS = 10_000;

// `reason` is deliberately generic: the response is printed into the scheduler's
// job log (public on a public repo) and driver errors contain the database host.
// The full error goes to the server log instead.
type Check = { ok: boolean; ms: number; reason?: "timed out" | "unreachable" };

// A paused Supabase project or an unreachable Redis can hang rather than fail
// fast, so every probe gets its own deadline.
async function probe(name: string, run: () => Promise<unknown>): Promise<Check> {
  const started = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      run(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), CHECK_TIMEOUT_MS);
      }),
    ]);
    return { ok: true, ms: Date.now() - started };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "timed out";
    logger.error({ err, check: name }, "keepalive probe failed");
    return { ok: false, ms: Date.now() - started, reason: timedOut ? "timed out" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

// Free-tier databases pause (Supabase) or get reclaimed (Redis) after a stretch
// with no activity. One trivial query against each, once a day, counts as
// activity. 503 when either fails so the scheduler's job goes red and the
// owner finds out before the database actually pauses.
export async function keepalive(_req: Request, res: Response) {
  const [db, cache] = await Promise.all([probe("postgres", () => prisma.$queryRaw`SELECT 1`), probe("redis", () => redis.ping())]);
  const ok = db.ok && cache.ok;

  logger[ok ? "info" : "warn"]({ db, redis: cache }, "keepalive");
  return res.status(ok ? 200 : 503).json({ ok, db, redis: cache });
}
