import { prisma } from "../../config/prisma.ts";
import { redis } from "../../config/redis.ts";

const TTL_SECONDS = 60 * 5; // 5 minutes

function statusCountsKey(userId: string) {
  return `analytics:user:${userId}:status_counts`;
}

function funnelKey(userId: string) {
  return `analytics:user:${userId}:funnel`;
}

export async function getStatusCounts(userId: string) {
  const cacheKey = statusCountsKey(userId);

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

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

  grouped.forEach((g) => {
    result[g.status] = g._count.status;
  });

  await redis.set(cacheKey, JSON.stringify(result), "EX", TTL_SECONDS);

  return result;
}

export async function getFunnel(userId: string) {
  const cacheKey = funnelKey(userId);

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const totalApplied = await prisma.application.count({
    where: { userId },
  });

  const interviewCount = await prisma.application.count({
    where: { userId, status: "INTERVIEW" },
  });

  const offerCount = await prisma.application.count({
    where: { userId, status: "OFFER" },
  });

  const result = {
    totalApplied,
    interviewCount,
    offerCount,
    interviewRate: totalApplied ? (interviewCount / totalApplied) * 100 : 0,
    offerRate: totalApplied ? (offerCount / totalApplied) * 100 : 0,
  };

  await redis.set(cacheKey, JSON.stringify(result), "EX", TTL_SECONDS);

  return result;
}

export async function invalidateAnalyticsCache(userId: string) {
  await redis.del(statusCountsKey(userId), funnelKey(userId));
}
