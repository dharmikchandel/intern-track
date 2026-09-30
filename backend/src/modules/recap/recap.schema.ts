import { z } from "zod";

// Calendar days (YYYY-MM-DD). The bounds and ordering are checked in parsePeriod.
export const periodSchema = z.object({
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
});
