import type { Prisma } from "@prisma/client";

export const ALL_STATUSES = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type StatusValue = (typeof ALL_STATUSES)[number];

// OFFER and REJECTED are terminal: nothing is left to chase, so they never
// count as "needs follow-up". Shared by the list filter, the board, the
// dashboard count and the digest job so they can't disagree.
export const ACTIVE_STATUSES: StatusValue[] = ["APPLIED", "OA", "INTERVIEW"];

// A follow-up is due once its date is today or earlier. Dates are compared in
// UTC (the form stores date-only values at midnight), so "due" means
// followUpDate < start of tomorrow.
function startOfTomorrowUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

export function followUpDueWhere(now = new Date()): Prisma.ApplicationWhereInput {
  return {
    status: { in: ACTIVE_STATUSES },
    followUpDate: { lt: startOfTomorrowUtc(now) },
  };
}

// Prisma's `contains` passes the term to LIKE/ILIKE unescaped, so a search for
// "100%" or "a_b" would treat % and _ as wildcards. Escape them (and the
// escape character itself) so the search is always literal.
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, "\\$&");
}

export type ApplicationFilters = {
  q?: string | undefined;
  status?: StatusValue | undefined;
  needsFollowUp?: boolean | undefined;
};

// Shared by the list and the board. Conditions go in AND so a status filter
// and the follow-up filter (which also constrains status) can be combined.
export function buildApplicationWhere(
  userId: string,
  { q, status, needsFollowUp }: ApplicationFilters
): Prisma.ApplicationWhereInput {
  const and: Prisma.ApplicationWhereInput[] = [];

  if (q) {
    const term = escapeLike(q);
    and.push({
      OR: [
        { companyName: { contains: term, mode: "insensitive" } },
        { role: { contains: term, mode: "insensitive" } },
      ],
    });
  }
  if (status) and.push({ status });
  if (needsFollowUp) and.push(followUpDueWhere());

  return { userId, ...(and.length && { AND: and }) };
}
