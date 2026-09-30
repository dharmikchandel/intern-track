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

// Query strings are always strings: z.coerce.boolean() would turn "false" into
// true, so booleans are parsed from the literal values explicitly.
const queryBoolean = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const searchTerm = z
  .string()
  .trim()
  .max(100)
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const MAX_PAGE_SIZE = 100;

export const listApplicationsQuerySchema = z.object({
  status: applicationStatusEnum.optional(),
  q: searchTerm,
  needsFollowUp: queryBoolean,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  // Explicit allow-list: this value is used as an orderBy key.
  sort: z
    .enum(["appliedDate", "createdAt", "updatedAt", "companyName", "role", "status"])
    .optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const boardQuerySchema = z.object({
  q: searchTerm,
  needsFollowUp: queryBoolean,
  perColumn: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type BoardQuery = z.infer<typeof boardQuerySchema>;
