import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { invalidateAnalyticsCache } from "../analytics/analytics.service.js";
import type { BoardQuery, ListApplicationsQuery } from "./application.schema.js";
import { diffActivities } from "./application.activity.js";
import { ALL_STATUSES, buildApplicationWhere } from "./application.filters.js";
import { getUserTimezone } from "../profile/profile.service.js";

export async function createApplication(userId: string, data: any) {
  // The application and its APPLICATION_CREATED event commit together, so a
  // feed can never be missing its first entry.
  const app = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        userId,
        companyName: data.companyName,
        role: data.role,
        status: data.status,
        appliedDate: new Date(data.appliedDate),
        applicationLink: data.applicationLink,
        notes: data.notes,
        ...(data.followUpDate && {
          followUpDate: new Date(data.followUpDate),
        }),
      },
    });
    await tx.applicationActivity.create({
      data: {
        applicationId: created.id,
        userId,
        type: "APPLICATION_CREATED",
        metadata: { status: created.status },
      },
    });
    return created;
  });
  // Invalidate only after the write commits, so a concurrent analytics read
  // can never cache stale (pre-write) numbers.
  await invalidateAnalyticsCache(userId);
  return app;
}

export async function getApplicationById(userId: string, id: string) {
  const app = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!app) throw new AppError("Application not found", 404, "NOT_FOUND");
  return app;
}

export async function updateApplication(userId: string, id: string, data: any) {
  const app = await prisma.$transaction(async (tx) => {
    // ownership check + the "before" snapshot the activity diff needs
    const existing = await tx.application.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError("Application not found", 404, "NOT_FOUND");

    const updated = await tx.application.update({
      where: { id },
      data: {
        ...data,
        appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
        followUpDate:
          data.followUpDate === null
            ? null
            : data.followUpDate
              ? new Date(data.followUpDate)
              : undefined,
      },
    });

    const events = diffActivities(existing, data);
    if (events.length > 0) {
      await tx.applicationActivity.createMany({
        data: events.map((e) => ({ applicationId: id, userId, ...e })),
      });
    }
    return updated;
  });
  await invalidateAnalyticsCache(userId);
  return app;
}

export async function deleteApplication(userId: string, id: string) {
  await getApplicationById(userId, id);

  await prisma.application.delete({ where: { id } });
  await invalidateAnalyticsCache(userId);
  return { success: true };
}

export async function listApplications(userId: string, query: ListApplicationsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 8;
  const skip = (page - 1) * limit;

  const where = buildApplicationWhere(userId, query, query.needsFollowUp ? await getUserTimezone(userId) : null);

  const sortField = query.sort ?? "appliedDate";
  const order = query.order ?? "desc";

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      // id breaks ties so pages never repeat or skip rows when many
      // applications share a sort value (e.g. the same status).
      orderBy: [{ [sortField]: order }, { id: "asc" }],
    }),
    prisma.application.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Cards inside a column are ordered by urgency: soonest follow-up first,
// then most recently applied. There is no manual ordering (no position field).
const BOARD_ORDER: Prisma.ApplicationOrderByWithRelationInput[] = [
  { followUpDate: { sort: "asc", nulls: "last" } },
  { appliedDate: "desc" },
  { id: "asc" },
];

// One bounded slice per status column plus the true per-column total, so the
// board never loads a user's whole history.
export async function getBoard(userId: string, query: BoardQuery) {
  const perColumn = query.perColumn ?? 25;
  const where = buildApplicationWhere(userId, query, query.needsFollowUp ? await getUserTimezone(userId) : null);

  const [counts, ...slices] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ...ALL_STATUSES.map((status) =>
      prisma.application.findMany({
        where: { AND: [where, { status }] },
        orderBy: BOARD_ORDER,
        take: perColumn,
      })
    ),
  ]);

  const totals = new Map(counts.map((c) => [c.status, c._count._all]));

  return {
    perColumn,
    columns: ALL_STATUSES.map((status, i) => ({
      status,
      total: totals.get(status) ?? 0,
      items: slices[i]!,
    })),
  };
}

export async function listActivity(userId: string, applicationId: string, limit = 50) {
  await getApplicationById(userId, applicationId); // 404 for someone else's application

  return prisma.applicationActivity.findMany({
    where: { applicationId, userId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    select: { id: true, type: true, metadata: true, createdAt: true },
  });
}
