import { z } from "zod";

export const applicationStatusEnum = z.enum([
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  companyName: z.string().min(1),
  role: z.string().min(1),
  status: applicationStatusEnum.optional(), // default handled by DB
  appliedDate: z.iso.datetime(),
  applicationLink: z.url().optional(),
  notes: z.string().optional(),
  followUpDate: z.iso.datetime().optional(),
});

export const updateApplicationSchema = z.object({
  companyName: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  status: applicationStatusEnum.optional(),
  appliedDate: z.iso.datetime().optional(),
  applicationLink: z.url().optional().nullable(),
  notes: z.string().optional().nullable(),
  followUpDate: z.iso.datetime().optional().nullable(),
});

export const listApplicationsQuerySchema = z
  .object({
    status: applicationStatusEnum.optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    sort: z.enum(["appliedDate", "createdAt"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  })
  .pipe(
    z.object({
      status: applicationStatusEnum.optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
      sort: z.enum(["appliedDate", "createdAt"]).optional(),
      order: z.enum(["asc", "desc"]).optional(),
    })
  );

export type ListApplicationsQuery = z.infer<
  typeof listApplicationsQuerySchema
>;
