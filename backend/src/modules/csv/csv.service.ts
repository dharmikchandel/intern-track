import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { toUtcDay } from "../../utils/days.js";
import { invalidateAnalyticsCache } from "../analytics/analytics.service.js";
import { buildApplicationWhere, type ApplicationFilters } from "../applications/application.filters.js";
import { getUserTimezone } from "../profile/profile.service.js";
import { csvLine } from "./csv.codec.js";
import { analyzeCsv, dayToDate, duplicateKey, type Analysis, type ColumnMapping, type DateFormat, type ImportRow, type RowError } from "./csv.import.js";

// Both the prisma client and a transaction client can run these queries.
type Db = Pick<Prisma.TransactionClient, "application">;

const MAX_LISTED_ERRORS = 50;
const MAX_LISTED_DUPLICATES = 20;
const SAMPLE_SIZE = 5;

export interface ImportSummary {
  dryRun: boolean;
  columns: ColumnMapping[];
  totalRows: number;
  /** Rows that will be (or were) added. */
  importable: number;
  duplicates: number;
  invalid: number;
  /** Rows actually written: 0 for a dry run. */
  imported: number;
  errors: RowError[];
  duplicateRows: { row: number; companyName: string; role: string; appliedDate: string }[];
  sample: ImportRow[];
}

// Which rows already exist for this user? Only applications inside the file's
// own date range are fetched (the (userId, appliedDate) index), and both sides
// go through the same duplicateKey() so SQL and JS can never disagree on
// what "the same" means.
async function existingKeys(db: Db, userId: string, rows: Analysis["valid"]): Promise<Set<string>> {
  if (rows.length === 0) return new Set();
  const days = rows.map((r) => r.value.appliedDate).sort();
  const existing = await db.application.findMany({
    where: { userId, appliedDate: { gte: dayToDate(days[0]!), lte: dayToDate(days[days.length - 1]!) } },
    select: { companyName: true, role: true, appliedDate: true },
  });
  return new Set(existing.map((e) => duplicateKey({ companyName: e.companyName, role: e.role, appliedDate: toUtcDay(e.appliedDate) })));
}

// Splits valid rows into new ones and duplicates (of the database, or of an
// earlier row in the same file).
async function classify(db: Db, userId: string, analysis: Analysis) {
  const seen = await existingKeys(db, userId, analysis.valid);
  const fresh: Analysis["valid"] = [];
  const duplicates: Analysis["valid"] = [];
  for (const row of analysis.valid) {
    if (seen.has(row.key)) duplicates.push(row);
    else {
      seen.add(row.key);
      fresh.push(row);
    }
  }
  return { fresh, duplicates };
}

export async function importApplications(
  userId: string,
  csvText: string,
  options: { dryRun: boolean; dateFormat: DateFormat }
): Promise<ImportSummary> {
  const started = Date.now();
  const analysis = analyzeCsv(csvText, { dateFormat: options.dateFormat, now: new Date() });

  let fresh: Analysis["valid"];
  let duplicates: Analysis["valid"];
  let imported = 0;

  if (options.dryRun || analysis.valid.length === 0) {
    ({ fresh, duplicates } = await classify(prisma, userId, analysis));
  } else {
    // One transaction: the applications and their "created" events commit
    // together or not at all. The advisory lock makes two overlapping imports
    // by the same user queue up, so the duplicate check below can't be
    // invalidated by the other one committing in between.
    ({ fresh, duplicates } = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
        const split = await classify(tx, userId, analysis);

        if (split.fresh.length > 0) {
          const ids = split.fresh.map(() => randomUUID());
          await tx.application.createMany({
            data: split.fresh.map(({ value: v }, i) => ({
              id: ids[i]!,
              userId,
              companyName: v.companyName,
              role: v.role,
              status: v.status,
              appliedDate: dayToDate(v.appliedDate),
              applicationLink: v.applicationLink,
              notes: v.notes,
              followUpDate: v.followUpDate ? dayToDate(v.followUpDate) : null,
            })),
          });
          await tx.applicationActivity.createMany({
            data: split.fresh.map(({ value: v }, i) => ({
              applicationId: ids[i]!,
              userId,
              type: "APPLICATION_CREATED" as const,
              metadata: { status: v.status, source: "import" },
            })),
          });
        }
        return split;
      },
      { timeout: 20_000 }
    ));
    imported = fresh.length;
    if (imported > 0) await invalidateAnalyticsCache(userId);
  }

  if (!options.dryRun) {
    logger.info(
      { userId, rows: analysis.totalRows, imported, duplicates: duplicates.length, invalid: analysis.errors.length, ms: Date.now() - started },
      "csv import"
    );
  }

  return {
    dryRun: options.dryRun,
    columns: analysis.columns,
    totalRows: analysis.totalRows,
    importable: fresh.length,
    duplicates: duplicates.length,
    invalid: analysis.errors.length,
    imported,
    errors: analysis.errors.slice(0, MAX_LISTED_ERRORS),
    duplicateRows: duplicates
      .slice(0, MAX_LISTED_DUPLICATES)
      .map((d) => ({ row: d.row, companyName: d.value.companyName, role: d.value.role, appliedDate: d.value.appliedDate })),
    sample: fresh.slice(0, SAMPLE_SIZE).map((f) => f.value),
  };
}

// ---- export ----------------------------------------------------------------

export const EXPORT_HEADER = ["Company", "Role", "Status", "Applied Date", "Link", "Notes", "Follow-up Date"];
const EXPORT_BATCH = 500;

// Yields the CSV in chunks (one per database batch) so memory stays flat no
// matter how many applications a user has. Cursor pagination in the same order
// as the list page, so it reuses the (userId, appliedDate) index.
export async function* exportChunks(userId: string, filters: ApplicationFilters): AsyncGenerator<string> {
  const where = buildApplicationWhere(userId, filters, filters.needsFollowUp ? await getUserTimezone(userId) : null);
  let cursor: string | undefined;
  let total = 0;
  const started = Date.now();
  let first = true;

  for (;;) {
    const batch = await prisma.application.findMany({
      where,
      orderBy: [{ appliedDate: "desc" }, { id: "asc" }],
      take: EXPORT_BATCH,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: { id: true, companyName: true, role: true, status: true, appliedDate: true, applicationLink: true, notes: true, followUpDate: true },
    });

    // The byte-order mark makes Excel read the file as UTF-8 (accents, CJK).
    // It goes out with the first batch, so a database failure on the first
    // read is still an ordinary error response rather than a half-sent file.
    let chunk = first ? "﻿" + csvLine(EXPORT_HEADER) : "";
    first = false;
    for (const a of batch) {
      chunk += csvLine([
        a.companyName,
        a.role,
        a.status,
        toUtcDay(a.appliedDate),
        a.applicationLink ?? "",
        a.notes ?? "",
        a.followUpDate ? toUtcDay(a.followUpDate) : "",
      ]);
    }
    total += batch.length;
    yield chunk;

    if (batch.length < EXPORT_BATCH) break;
    cursor = batch[batch.length - 1]!.id;
  }

  logger.info({ userId, rows: total, ms: Date.now() - started }, "csv export");
}
