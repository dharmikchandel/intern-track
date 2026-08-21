import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";

const TTL_SECONDS = 60 * 5; // 5 minutes

function statusCountsKey(userId: string) {
  return `analytics:user:${userId}:status_counts`;
}

function funnelKey(userId: string) {
  return `analytics:user:${userId}:funnel`;
}

// Redis is a cache, not the source of truth (Postgres is). If it's slow or
// down, analytics should fall back to computing straight from the DB rather
// than take the whole endpoint down with it.
async function safeCacheGet(key: string): Promise<Record<string, number> | null> {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("⚠️ Redis GET failed, falling back to DB:", (err as Error).message);
    return null;
  }
}

async function safeCacheSet(key: string, value: unknown): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", TTL_SECONDS);
  } catch (err) {
    console.error("⚠️ Redis SET failed, response was still served:", (err as Error).message);
  }
}

export async function getStatusCounts(userId: string) {
  const cacheKey = statusCountsKey(userId);
  const cached = await safeCacheGet(cacheKey);
  if (cached) return cached;

  // DB aggregation
  const grouped = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const result: Record<string, number> = {
    APPLIED: 0,
    OA: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
  };

  grouped.forEach((g: any) => {
    result[g.status] = g._count.status;
  });

  await safeCacheSet(cacheKey, result);

  return result;
}

export async function getFunnel(userId: string) {
  const cacheKey = funnelKey(userId);
  const cached = await safeCacheGet(cacheKey);
  if (cached) return cached;

  // Single DB call: get counts for every status at once, then derive the
  // funnel numbers in memory instead of running three separate COUNT queries.
  const counts = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  let totalApplied = 0;
  let interviewCount = 0;
  let offerCount = 0;

  counts.forEach((item: any) => {
    totalApplied += item._count.status; // Add every status to the total
    
    if (item.status === "INTERVIEW") {
      interviewCount = item._count.status;
    } else if (item.status === "OFFER") {
      offerCount = item._count.status;
    }
  });

  const result = {
    totalApplied,
    interviewCount,
    offerCount,
    interviewRate: totalApplied ? (interviewCount / totalApplied) * 100 : 0,
    offerRate: totalApplied ? (offerCount / totalApplied) * 100 : 0,
  };

  await safeCacheSet(cacheKey, result);

  return result;
}

// Called after every application create/update/delete. Must never throw:
// a Redis hiccup here would otherwise fail an already-successful DB write
// from the caller's point of view. Worst case on failure, the cache just
// serves stale numbers until the 5-minute TTL naturally expires.
export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    pipeline.del(statusCountsKey(userId));
    pipeline.del(funnelKey(userId));
    await pipeline.exec();
  } catch (err) {
    console.error("⚠️ Redis cache invalidation failed:", (err as Error).message);
  }
}
