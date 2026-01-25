import { prisma } from "../../config/prisma.ts";
import { invalidateAnalyticsCache } from "../analytics/analytics.service.ts";

export async function createApplication(userId: string, data: any) {
  const app = prisma.application.create({
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
  await invalidateAnalyticsCache(userId);
  return app;
}

export async function getApplicationById(userId: string, id: string) {
  const app = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!app) throw new Error("NOT_FOUND");
  return app;
}

export async function updateApplication(userId: string, id: string, data: any) {
  // ownership check
  await getApplicationById(userId, id);

  const app = prisma.application.update({
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
  await invalidateAnalyticsCache(userId);
  return app;
}

export async function deleteApplication(userId: string, id: string) {
  await getApplicationById(userId, id);

  await prisma.application.delete({ where: { id } });
  await invalidateAnalyticsCache(userId);
  return { success: true };
}

export async function listApplications(
  userId: string,
  query: {
    status?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: string | undefined;
  }
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (query.status) where.status = query.status;

  const sortField = query.sort ?? "appliedDate";
  const order = query.order ?? "desc";

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: order },
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
