import { AppError } from "../../utils/AppError.js";

// Reading and writing CSV (RFC 4180) plus the spreadsheet formula guard. No
// application knowledge lives here: see csv.import.ts for what the columns mean.

export const MAX_CSV_ROWS = 2000;
const MAX_COLUMNS = 50;

export interface CsvRecord {
  /** 1-based row number as a spreadsheet shows it (the header is row 1). */
  number: number;
  cells: string[];
}

export interface ParsedCsv {
  delimiter: string;
  header: string[];
  records: CsvRecord[];
}

const malformed = (message: string) => new AppError(message, 400, "CSV_MALFORMED");

// Excel in many European locales writes ";" (or tabs); look at the header line
// and pick whichever separator it uses most, outside quotes. Ties go to a comma.
export function sniffDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === "\n" || ch === "\r")) break;
    else if (!inQuotes && ch in counts) counts[ch]! += 1;
  }
  let best = ",";
  for (const candidate of [";", "\t"]) if (counts[candidate]! > counts[best]!) best = candidate;
  return best;
}

// A quote only opens a quoted field at the START of a field; "" inside one is a
// literal quote; newlines inside quotes belong to the field. Lenient where
// spreadsheets are (a stray quote mid-field is kept as text), strict where data
// would otherwise be lost silently (a quote that never closes is an error).
// Blank lines and rows of nothing but empty cells (Excel's trailing ",,,,") are skipped.
export function parseCsv(input: string, maxRows = MAX_CSV_ROWS): ParsedCsv {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input; // BOM from Excel
  const delimiter = sniffDelimiter(text);

  const rows: CsvRecord[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let atFieldStart = true;
  let rowNumber = 1;

  const endRow = () => {
    cells.push(field);
    field = "";
    atFieldStart = true;
    if (cells.length > MAX_COLUMNS) throw malformed(`Row ${rowNumber} has more than ${MAX_COLUMNS} columns`);
    if (cells.some((c) => c.trim() !== "")) {
      // header + maxRows data rows
      if (rows.length > maxRows) {
        throw new AppError(`This file has more than ${maxRows} rows. Split it into smaller files.`, 400, "CSV_TOO_MANY_ROWS");
      }
      rows.push({ number: rowNumber, cells });
    }
    cells = [];
    rowNumber += 1;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && atFieldStart) {
      inQuotes = true;
      atFieldStart = false;
    } else if (ch === delimiter) {
      cells.push(field);
      field = "";
      atFieldStart = true;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else {
      field += ch;
      atFieldStart = false;
    }
  }

  if (inQuotes) throw malformed(`A quoted value starting in row ${rowNumber} never ends. Check for a missing closing quote.`);
  if (field !== "" || cells.length > 0) endRow();

  const [headerRow, ...records] = rows;
  if (!headerRow) throw new AppError("The file is empty", 400, "CSV_EMPTY");
  return { delimiter, header: headerRow.cells.map((h) => h.trim()), records };
}

// ---- writing ---------------------------------------------------------------

// Spreadsheets treat a cell starting with = + - @ (or a tab / carriage return)
// as a formula, so a company called `=HYPERLINK(...)` would run when the export
// is opened. Standard defence: prefix the cell with a single quote, which the
// spreadsheet hides. A leading run of quotes is included so the guard can be
// undone exactly on the way back in (see unguardFormula).
const NEEDS_GUARD = /^'*[=+\-@\t\r]/;
const WAS_GUARDED = /^'+[=+\-@\t\r]/;

export function guardFormula(value: string): string {
  return NEEDS_GUARD.test(value) ? `'${value}` : value;
}

// Exact inverse of guardFormula, so export -> import round-trips any text.
export function unguardFormula(value: string): string {
  return WAS_GUARDED.test(value) ? value.slice(1) : value;
}

export function csvCell(value: string): string {
  const safe = guardFormula(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// CRLF line endings, per the RFC (and what Excel expects).
export function csvLine(cells: string[]): string {
  return cells.map(csvCell).join(",") + "\r\n";
}
