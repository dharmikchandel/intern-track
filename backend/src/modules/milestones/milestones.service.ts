import { prisma } from "../../config/prisma.js";
import { getStatusCounts } from "../analytics/analytics.service.js";
import { buildMilestones, type StageEvents } from "./milestones.stats.js";

// Three independent reads, run in parallel:
//  1. applications per applied day (one grouped row per day, not per application)
//     -> totals, streaks and "the day you reached N applications"
//  2. the earliest recorded move into OA / Interview / Offer, from the activity
//     feed (not updatedAt, which changes on every edit)
//  3. current status counts (already cached in Redis by the dashboard)
// Nothing is cached here: the result depends on the caller's `today`, and the
// queries are index-backed and cheap.
export async function getMilestones(userId: string, today: string) {
  const [perDayRows, stageRows, statusCounts] = await Promise.all([
    // appliedDate is a timestamp without time zone holding UTC, so to_char on it
    // directly gives the UTC calendar day.
    prisma.$queryRaw<{ day: string; count: number }[]>`
      SELECT to_char("appliedDate", 'YYYY-MM-DD') AS day, count(*)::int AS count
      FROM "Application"
      WHERE "userId" = ${userId}
      GROUP BY 1
    `,
    prisma.$queryRaw<{ status: string; day: string }[]>`
      SELECT metadata->>'to' AS status, to_char(min("createdAt"), 'YYYY-MM-DD') AS day
      FROM "ApplicationActivity"
      WHERE "userId" = ${userId}
        AND "type" = 'STATUS_CHANGED'
        AND metadata->>'to' IN ('OA', 'INTERVIEW', 'OFFER')
      GROUP BY 1
    `,
    getStatusCounts(userId),
  ]);

  const stageEvents: StageEvents = {};
  for (const row of stageRows) {
    if (row.status === "OA" || row.status === "INTERVIEW" || row.status === "OFFER") stageEvents[row.status] = row.day;
  }

  return buildMilestones({
    perDay: perDayRows,
    today,
    stageEvents,
    statusCounts: statusCounts as Record<"APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED", number>,
  });
}
