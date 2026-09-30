import type { ApplicationStatus } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";
import { addDays, dayToMs, toUtcDay } from "../../utils/days.js";
import { parseCsv, unguardFormula } from "./csv.codec.js";

// Turns CSV text into validated application rows, or per-row error messages.
// Pure: no database, no clock except the `now` you pass in.

export type ImportField = "companyName" | "role" | "status" | "appliedDate" | "applicationLink" | "notes" | "followUpDate";
export type DateFormat = "iso" | "mdy" | "dmy";

const REQUIRED: ImportField[] = ["companyName", "role", "appliedDate"];

// Header names people (and other trackers) actually use, compared after
// lower-casing and dropping everything that isn't a letter or digit, so
// "Applied Date", "applied_date" and "Applied-date" are all the same header.
const ALIASES: Record<ImportField, string[]> = {
  companyName: ["company", "companyname", "employer", "organization", "organisation"],
  role: ["role", "title", "jobtitle", "position", "jobrole"],
  status: ["status", "stage"],
  appliedDate: ["applieddate", "dateapplied", "applied", "appliedon", "applicationdate", "date"],
  applicationLink: ["applicationlink", "link", "url", "joburl", "joblink", "postingurl"],
  notes: ["notes", "note", "comments", "comment"],
  followUpDate: ["followupdate", "followup", "followupon", "followupby"],
};

const FIELD_LABELS: Record<ImportField, string> = {
  companyName: "Company",
  role: "Role",
  status: "Status",
  appliedDate: "Applied Date",
  applicationLink: "Link",
  notes: "Notes",
  followUpDate: "Follow-up Date",
};

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

export interface ColumnMapping {
  header: string;
  field: ImportField | null;
}

// First column wins when two headers mean the same field; the rest, and
// anything unrecognised, are reported as ignored rather than guessed at.
export function mapColumns(header: string[]): { mapping: ColumnMapping[]; index: Partial<Record<ImportField, number>> } {
  const index: Partial<Record<ImportField, number>> = {};
  const mapping = header.map((h, i): ColumnMapping => {
    const key = normalizeHeader(h);
    const field = (Object.keys(ALIASES) as ImportField[]).find((f) => ALIASES[f].includes(key)) ?? null;
    if (field && index[field] === undefined) {
      index[field] = i;
      return { header: h, field };
    }
    return { header: h, field: null };
  });

  const missing = REQUIRED.filter((f) => index[f] === undefined);
  if (missing.length > 0) {
    throw new AppError(
      `The file is missing a required column: ${missing.map((f) => FIELD_LABELS[f]).join(", ")}. ` +
        `Expected headers: ${Object.values(FIELD_LABELS).join(", ")}.`,
      400,
      "CSV_MISSING_COLUMNS"
    );
  }
  return { mapping, index };
}

// ---- field cleaning --------------------------------------------------------

// Control characters are dropped: a NUL byte makes Postgres reject the whole
// insert, and the rest are invisible junk from copy-paste. Tabs and newlines
// survive in notes only.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function cleanText(raw: string, multiline: boolean): string {
  let s = unguardFormula(raw).replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "");
  s = multiline ? s : s.replace(/\s*\n\s*/g, " ").replace(/\t/g, " ");
  return s.trim();
}

const shorten = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n)}...` : s);

const STATUS_WORDS: Record<string, ApplicationStatus> = {
  applied: "APPLIED",
  oa: "OA",
  onlineassessment: "OA",
  assessment: "OA",
  interview: "INTERVIEW",
  interviewing: "INTERVIEW",
  offer: "OFFER",
  offered: "OFFER",
  rejected: "REJECTED",
  rejection: "REJECTED",
};

// ---- dates -----------------------------------------------------------------

const ISO_DATE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/;
const SLASH_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})(?:[T ].*)?$/;

// Returns YYYY-MM-DD, or null when the text isn't a real calendar date in the
// chosen format. "03/04/2026" is March 4 or April 3 depending on who made the
// file, so day/month order is never guessed: the user picks it, and ISO dates
// (unambiguous) always work. Any time-of-day after the date is ignored.
export function parseDay(raw: string, format: DateFormat): string | null {
  let y: number, m: number, d: number;

  const iso = ISO_DATE.exec(raw);
  const slash = SLASH_DATE.exec(raw);
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])] as [number, number, number];
  } else if (slash && format !== "iso") {
    const [a, b, yy] = [Number(slash[1]), Number(slash[2]), slash[3]!];
    [m, d] = format === "mdy" ? [a, b] : [b, a];
    y = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  } else {
    return null;
  }

  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  // Date.UTC rolls Feb 30 over to Mar 2; reject anything that didn't round-trip.
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return toUtcDay(check);
}

const MIN_DAY = "2000-01-01";

// ---- rows ------------------------------------------------------------------

export interface ImportRow {
  companyName: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string; // YYYY-MM-DD
  applicationLink: string | null;
  notes: string | null;
  followUpDate: string | null;
}

// Two rows are the same application when company, role and applied day match
// (case, spacing and accents-as-typed aside). Including the day means importing
// the same file twice adds nothing, while applying to the same role again on
// another day is still allowed.
export function duplicateKey(row: { companyName: string; role: string; appliedDate: string }): string {
  const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  return `${norm(row.companyName)}|${norm(row.role)}|${row.appliedDate}`;
}

function parseLink(value: string): string | { error: string } {
  if (value.length > 2048) return { error: "Link is too long" };
  try {
    const url = new URL(value);
    // Only web links: anything else (javascript:, data:, file:) is refused.
    if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Link must start with http:// or https://" };
    return value;
  } catch {
    return { error: `"${shorten(value)}" is not a valid link (include https://)` };
  }
}

export interface RowContext {
  index: Partial<Record<ImportField, number>>;
  dateFormat: DateFormat;
  now: Date;
}

export function validateRow(cells: string[], ctx: RowContext): { value: ImportRow } | { errors: string[] } {
  const errors: string[] = [];
  const get = (f: ImportField, multiline = false) => {
    const i = ctx.index[f];
    return i === undefined ? "" : cleanText(cells[i] ?? "", multiline);
  };

  const companyName = get("companyName");
  if (!companyName) errors.push("Company is empty");
  else if (companyName.length > 200) errors.push("Company is longer than 200 characters");

  const role = get("role");
  if (!role) errors.push("Role is empty");
  else if (role.length > 200) errors.push("Role is longer than 200 characters");

  let status: ApplicationStatus = "APPLIED";
  const rawStatus = get("status");
  if (rawStatus) {
    const found = STATUS_WORDS[rawStatus.toLowerCase().replace(/[^a-z]/g, "")];
    if (found) status = found;
    else errors.push(`Unknown status "${shorten(rawStatus)}" (use Applied, OA, Interview, Offer or Rejected)`);
  }

  const dateHint = ctx.dateFormat === "iso" ? "use YYYY-MM-DD" : ctx.dateFormat === "mdy" ? "use MM/DD/YYYY" : "use DD/MM/YYYY";
  const today = toUtcDay(ctx.now);

  let appliedDate = "";
  const rawApplied = get("appliedDate");
  if (!rawApplied) {
    errors.push("Applied date is empty");
  } else {
    const day = parseDay(rawApplied, ctx.dateFormat);
    if (!day) errors.push(`Applied date "${shorten(rawApplied)}" is not a valid date (${dateHint})`);
    // One day of slack: a user ahead of UTC can legitimately pick "tomorrow".
    else if (day < MIN_DAY || day > addDays(today, 1)) errors.push(`Applied date ${day} is out of range`);
    else appliedDate = day;
  }

  let followUpDate: string | null = null;
  const rawFollowUp = get("followUpDate");
  if (rawFollowUp) {
    const day = parseDay(rawFollowUp, ctx.dateFormat);
    if (!day) errors.push(`Follow-up date "${shorten(rawFollowUp)}" is not a valid date (${dateHint})`);
    else if (day < MIN_DAY || day > addDays(today, 5 * 366)) errors.push(`Follow-up date ${day} is out of range`);
    else followUpDate = day;
  }

  let applicationLink: string | null = null;
  const rawLink = get("applicationLink");
  if (rawLink) {
    const link = parseLink(rawLink);
    if (typeof link === "string") applicationLink = link;
    else errors.push(link.error);
  }

  const notes = get("notes", true);
  if (notes.length > 5000) errors.push("Notes are longer than 5,000 characters");

  if (errors.length > 0) return { errors };
  return { value: { companyName, role, status, appliedDate, applicationLink, notes: notes || null, followUpDate } };
}

// ---- whole file ------------------------------------------------------------

export interface RowError {
  row: number;
  message: string;
}

export interface Analysis {
  columns: ColumnMapping[];
  totalRows: number;
  valid: { row: number; value: ImportRow; key: string }[];
  errors: RowError[];
}

export function analyzeCsv(text: string, options: { dateFormat: DateFormat; now: Date }): Analysis {
  const { header, records } = parseCsv(text);
  const { mapping, index } = mapColumns(header);
  const ctx: RowContext = { index, dateFormat: options.dateFormat, now: options.now };

  const valid: Analysis["valid"] = [];
  const errors: RowError[] = [];
  for (const record of records) {
    if (record.cells.length > header.length) {
      errors.push({ row: record.number, message: `Row has ${record.cells.length} values but the header has ${header.length} columns` });
      continue;
    }
    const result = validateRow(record.cells, ctx);
    if ("errors" in result) errors.push({ row: record.number, message: result.errors.join("; ") });
    else valid.push({ row: record.number, value: result.value, key: duplicateKey(result.value) });
  }
  return { columns: mapping, totalRows: records.length, valid, errors };
}

// Midnight UTC of a YYYY-MM-DD day, the same way the create form stores a date.
export const dayToDate = (day: string) => new Date(dayToMs(day));
