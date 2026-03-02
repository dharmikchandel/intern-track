import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";

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

  // const totalApplied = await prisma.application.count({
  //   where: { userId },
  // });

  // const interviewCount = await prisma.application.count({
  //   where: { userId, status: "INTERVIEW" },
  // });

  // const offerCount = await prisma.application.count({
  //   where: { userId, status: "OFFER" },
  // });

  // 1. Single DB Call: Get counts for ALL statuses at once
  const counts = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  // 2. Process the results in memory
  let totalApplied = 0;
  let interviewCount = 0;
  let offerCount = 0;

  counts.forEach((item) => {
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

  await redis.set(cacheKey, JSON.stringify(result), "EX", TTL_SECONDS);

  return result;
}

export async function invalidateAnalyticsCache(userId: string) {
  // await redis.del(statusCountsKey(userId), funnelKey(userId));
  const pipeline = redis.pipeline();
  pipeline.del(statusCountsKey(userId));
  pipeline.del(funnelKey(userId));
  await pipeline.exec();
}
