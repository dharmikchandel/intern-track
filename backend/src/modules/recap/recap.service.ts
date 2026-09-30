import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
  buildStats,
  generateSlug,
  SLUG_PATTERN,
  toPublicRecap,
  toUtcDay,
  type DayCount,
  type Period,
  type RecapStats,
} from "./recap.stats.js";

// A recap with fewer applications than this says too little to be worth
// sharing and is easier to tie back to a person.
export const MIN_APPLICATIONS_TO_SHARE = 5;
export const MAX_ACTIVE_SHARES = 10;

// The three headline counts in ONE query (a join, not per-row subqueries).
//
// "Reached interview / offer" = the application's current status says so, OR the
// activity history shows it was ever moved there (so a rejected application that
// had an interview still counts). Older changes were never recorded, so history
// only ever adds to what the current status shows.
//
// Why raw SQL and not three Prisma counts with `activities: { some: ... }`: that
// form compiles to correlated EXISTS subqueries inside an OR. Postgres then
// estimates a huge cost, turns on JIT compilation (~170 ms of fixed overhead,
// measured) and, on the first runs of a prepared statement, can scan the whole
// activity table. This join is ~5 ms and its cost doesn't depend on how many
// other users' events exist. Dates are passed as text and cast to `timestamp`
// so the result can't depend on the database session's timezone.
async function headlineCounts(userId: string, period: Period) {
  const start = period.start.toISOString();
  const endExclusive = period.endExclusive.toISOString();

  const [row] = await prisma.$queryRaw<{ applications: number; reached_interview: number; offers: number }[]>`
    SELECT
      count(*)::int AS applications,
      (count(*) FILTER (WHERE a."status" IN ('INTERVIEW', 'OFFER') OR h.interview))::int AS reached_interview,
      (count(*) FILTER (WHERE a."status" = 'OFFER' OR h.offer))::int AS offers
    FROM "Application" a
    LEFT JOIN (
      SELECT "applicationId",
             bool_or(metadata->>'to' IN ('INTERVIEW', 'OFFER')) AS interview,
             bool_or(metadata->>'to' = 'OFFER') AS offer
      FROM "ApplicationActivity"
      WHERE "userId" = ${userId} AND "type" = 'STATUS_CHANGED'
      GROUP BY "applicationId"
    ) h ON h."applicationId" = a."id"
    WHERE a."userId" = ${userId}
      AND a."appliedDate" >= ${start}::timestamp
      AND a."appliedDate" < ${endExclusive}::timestamp
  `;
  return { applications: row?.applications ?? 0, reachedInterview: row?.reached_interview ?? 0, offers: row?.offers ?? 0 };
}

export async function computeRecap(userId: string, period: Period): Promise<RecapStats> {
  const [counts, appliedDates] = await Promise.all([
    headlineCounts(userId, period),
    // One row per distinct applied timestamp (usually one per day), not per application.
    prisma.application.groupBy({
      by: ["appliedDate"],
      where: { userId, appliedDate: { gte: period.start, lt: period.endExclusive } },
      _count: { _all: true },
    }),
  ]);

  // Merge timestamps that fall on the same UTC day.
  const perDay = new Map<string, number>();
  for (const row of appliedDates) {
    const day = toUtcDay(row.appliedDate);
    perDay.set(day, (perDay.get(day) ?? 0) + row._count._all);
  }
  const dayCounts: DayCount[] = [...perDay.entries()].map(([day, count]) => ({ day, count }));

  return buildStats({ ...counts, dayCounts });
}

export async function previewRecap(userId: string, period: Period) {
  const stats = await computeRecap(userId, period);
  return { stats, canShare: stats.applications >= MIN_APPLICATIONS_TO_SHARE, minApplications: MIN_APPLICATIONS_TO_SHARE };
}

export async function createShare(userId: string, period: Period) {
  const active = await prisma.recapShare.count({ where: { userId, revokedAt: null } });
  if (active >= MAX_ACTIVE_SHARES) {
    throw new AppError(`You can have at most ${MAX_ACTIVE_SHARES} active share links. Revoke one first.`, 400, "SHARE_LIMIT");
  }

  const stats = await computeRecap(userId, period);
  if (stats.applications < MIN_APPLICATIONS_TO_SHARE) {
    throw new AppError(`Add at least ${MIN_APPLICATIONS_TO_SHARE} applications in this period before sharing a recap.`, 400, "NOT_ENOUGH_DATA");
  }

  const share = await prisma.recapShare.create({
    data: {
      userId,
      slug: generateSlug(),
      periodStart: period.start,
      periodEnd: period.end,
      stats: stats as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, slug: true, periodStart: true, periodEnd: true, createdAt: true },
  });
  return { ...share, stats };
}

export async function listShares(userId: string) {
  return prisma.recapShare.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, periodStart: true, periodEnd: true, createdAt: true },
  });
}

export async function revokeShare(userId: string, id: string) {
  // updateMany scoped to the owner and to not-yet-revoked: someone else's id,
  // an unknown id and an already-revoked share all look the same (404).
  const result = await prisma.recapShare.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (result.count === 0) throw new AppError("Share link not found", 404, "NOT_FOUND");
  return { success: true };
}

export async function getPublicRecap(slug: string) {
  // Reject malformed slugs without touching the database.
  if (!SLUG_PATTERN.test(slug)) throw new AppError("Recap not found", 404, "NOT_FOUND");

  const row = await prisma.recapShare.findFirst({
    where: { slug, revokedAt: null },
    select: { periodStart: true, periodEnd: true, createdAt: true, stats: true },
  });
  // Unknown and revoked are indistinguishable on purpose.
  if (!row) throw new AppError("Recap not found", 404, "NOT_FOUND");
  return toPublicRecap(row);
}
