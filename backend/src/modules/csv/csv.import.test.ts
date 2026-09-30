import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../utils/AppError.js";
import { csvLine } from "./csv.codec.js";
import { analyzeCsv, duplicateKey, mapColumns, parseDay } from "./csv.import.js";

const NOW = new Date("2026-10-01T12:00:00Z");
const run = (csv: string, dateFormat: "iso" | "mdy" | "dmy" = "iso") => analyzeCsv(csv, { dateFormat, now: NOW });
const HEADER = "Company,Role,Status,Applied Date,Link,Notes,Follow-up Date\n";

describe("column mapping", () => {
  it("accepts common header spellings and reports what it ignored", () => {
    const { mapping, index } = mapColumns(["Employer", "Job Title", "date_applied", "Stage", "Salary", "URL"]);
    assert.deepEqual(index, { companyName: 0, role: 1, appliedDate: 2, status: 3, applicationLink: 5 });
    assert.equal(mapping[4]!.field, null); // Salary: unknown, ignored
  });

  it("uses the first of two columns that mean the same thing", () => {
    const { mapping, index } = mapColumns(["Company", "Role", "Applied Date", "Date"]);
    assert.equal(index.appliedDate, 2);
    assert.equal(mapping[3]!.field, null);
  });

  it("names every missing required column", () => {
    assert.throws(
      () => mapColumns(["Company", "Notes"]),
      (e: unknown) => e instanceof AppError && e.code === "CSV_MISSING_COLUMNS" && /Role, Applied Date/.test(e.message)
    );
  });
});

describe("dates", () => {
  it("parses ISO in every mode, with or without a time part", () => {
    for (const f of ["iso", "mdy", "dmy"] as const) {
      assert.equal(parseDay("2026-09-14", f), "2026-09-14");
      assert.equal(parseDay("2026-9-4", f), "2026-09-04");
      assert.equal(parseDay("2026-09-14T23:30:00-07:00", f), "2026-09-14"); // the day as written
      assert.equal(parseDay("2026/09/14 08:00", f), "2026-09-14");
    }
  });

  it("never guesses day/month order: slash dates need the user to choose", () => {
    assert.equal(parseDay("03/04/2026", "iso"), null);
    assert.equal(parseDay("03/04/2026", "mdy"), "2026-03-04");
    assert.equal(parseDay("03/04/2026", "dmy"), "2026-04-03");
    assert.equal(parseDay("9/14/2026 0:00", "mdy"), "2026-09-14");
    assert.equal(parseDay("14.09.26", "dmy"), "2026-09-14");
  });

  it("rejects dates that don't exist instead of rolling them over", () => {
    for (const bad of ["2026-02-30", "2026-13-01", "2026-00-10", "2025-02-29", "0050-01-01", "tomorrow", "", "2026-09"]) {
      assert.equal(parseDay(bad, "iso"), null, bad);
    }
    assert.equal(parseDay("2024-02-29", "iso"), "2024-02-29"); // leap day
    assert.equal(parseDay("31/04/2026", "dmy"), null);
  });
});

describe("row validation", () => {
  it("accepts a full row and normalises it", () => {
    const { valid, errors } = run(HEADER + `Acme Corp,SWE Intern,interviewing,2026-09-14,https://acme.com/jobs/1,Phone screen went well,2026-09-28\n`);
    assert.deepEqual(errors, []);
    assert.deepEqual(valid[0]!.value, {
      companyName: "Acme Corp",
      role: "SWE Intern",
      status: "INTERVIEW",
      appliedDate: "2026-09-14",
      applicationLink: "https://acme.com/jobs/1",
      notes: "Phone screen went well",
      followUpDate: "2026-09-28",
    });
  });

  it("defaults status to APPLIED and optional columns to null when blank or absent", () => {
    const { valid } = run("Company,Role,Applied Date\nAcme,SWE,2026-09-14\n");
    assert.equal(valid[0]!.value.status, "APPLIED");
    assert.equal(valid[0]!.value.applicationLink, null);
    assert.equal(valid[0]!.value.notes, null);
    assert.equal(valid[0]!.value.followUpDate, null);
  });

  it("maps status synonyms and rejects unknown ones without guessing", () => {
    const statuses = ["Online Assessment", "OFFERED", "Rejected", "oa", "Applied"];
    const csv = "Company,Role,Status,Applied Date\n" + statuses.map((s, i) => `C${i},R,${s},2026-09-14`).join("\n");
    assert.deepEqual(run(csv).valid.map((v) => v.value.status), ["OA", "OFFER", "REJECTED", "OA", "APPLIED"]);
    const bad = run("Company,Role,Status,Applied Date\nA,B,Ghosted,2026-09-14\n");
    assert.match(bad.errors[0]!.message, /Unknown status "Ghosted"/);
  });

  it("reports every problem in a row, with the spreadsheet row number", () => {
    const { errors, valid } = run(HEADER + "OK Inc,Dev,,2026-09-14,,,\n,,Nope,2026-02-30,ftp://x.y,,notadate\n");
    assert.equal(valid.length, 1);
    assert.equal(errors.length, 1);
    assert.equal(errors[0]!.row, 3);
    for (const fragment of ["Company is empty", "Role is empty", "Unknown status", "not a valid date", "Link must start with http"]) {
      assert.ok(errors[0]!.message.includes(fragment), `${fragment} in: ${errors[0]!.message}`);
    }
  });

  it("only allows web links", () => {
    for (const link of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "example.com/jobs", "not a url"]) {
      const { errors } = run(`Company,Role,Applied Date,Link\nA,B,2026-09-14,${link}\n`);
      assert.equal(errors.length, 1, link);
    }
    assert.equal(run("Company,Role,Applied Date,Link\nA,B,2026-09-14,http://x.com/a?b=1\n").valid.length, 1);
  });

  it("applies sanity limits to dates and text lengths", () => {
    const cases: [string, string][] = [
      ["2026-10-03", "out of range"], // more than a day ahead
      ["1999-12-31", "out of range"],
    ];
    for (const [date, expected] of cases) {
      const { errors } = run(`Company,Role,Applied Date\nA,B,${date}\n`);
      assert.match(errors[0]!.message, new RegExp(expected), date);
    }
    assert.equal(run("Company,Role,Applied Date\nA,B,2026-10-02\n").valid.length, 1); // one day of slack
    assert.match(run(`Company,Role,Applied Date\n${"x".repeat(201)},B,2026-09-14\n`).errors[0]!.message, /Company is longer/);
    assert.match(run(`Company,Role,Applied Date,Notes\nA,B,2026-09-14,${"n".repeat(5001)}\n`).errors[0]!.message, /Notes are longer/);
    assert.match(run(`Company,Role,Applied Date,Follow-up Date\nA,B,2026-09-14,2099-01-01\n`).errors[0]!.message, /out of range/);
  });

  it("flags rows with more values than the header", () => {
    const { errors } = run("Company,Role,Applied Date\nA,B,2026-09-14,extra\n");
    assert.match(errors[0]!.message, /4 values but the header has 3/);
  });

  it("strips control characters (a NUL would make Postgres reject the insert) and flattens single-line fields", () => {
    const { valid } = run(csvLine(["Company", "Role", "Applied Date", "Notes"]) + csvLine(["Ac\u0000me\u0007", "SWE\nIntern\t2", "2026-09-14", "line1\r\nline2\u0000"]));
    assert.equal(valid[0]!.value.companyName, "Acme");
    assert.equal(valid[0]!.value.role, "SWE Intern 2");
    assert.equal(valid[0]!.value.notes, "line1\nline2");
  });

  it("stores a formula-looking cell as plain text and undoes the export guard", () => {
    // raw file text, as our own export would have written it
    const { valid } = run("Company,Role,Applied Date,Notes\n'=HYPERLINK(1),'-lead,2026-09-14,'- bullet point\n");
    assert.equal(valid[0]!.value.companyName, "=HYPERLINK(1)");
    assert.equal(valid[0]!.value.role, "-lead");
    assert.equal(valid[0]!.value.notes, "- bullet point");
    // and text that genuinely starts with a quote + trigger survives a full export/import cycle
    const cycled = run(csvLine(["Company", "Role", "Applied Date"]) + csvLine(["'=x", "=y", "2026-09-14"]));
    assert.equal(cycled.valid[0]!.value.companyName, "'=x");
    assert.equal(cycled.valid[0]!.value.role, "=y");
  });

  it("uses the chosen date format for every date column", () => {
    const { valid, errors } = run("Company,Role,Applied Date,Follow-up Date\nA,B,14/09/2026,28/09/2026\n", "dmy");
    assert.deepEqual(errors, []);
    assert.equal(valid[0]!.value.followUpDate, "2026-09-28");
    assert.match(run("Company,Role,Applied Date\nA,B,14/09/2026\n", "iso").errors[0]!.message, /use YYYY-MM-DD/);
  });

  it("works with semicolon files and a BOM", () => {
    const { valid } = run("﻿Company;Role;Applied Date\nAcme;SWE;2026-09-14\n");
    assert.equal(valid.length, 1);
  });
});

describe("duplicates", () => {
  it("keys on company, role and day, ignoring case and spacing", () => {
    const a = duplicateKey({ companyName: "Acme  Corp", role: "SWE Intern", appliedDate: "2026-09-14" });
    assert.equal(a, duplicateKey({ companyName: " acme corp", role: "swe   intern ", appliedDate: "2026-09-14" }));
    assert.notEqual(a, duplicateKey({ companyName: "Acme Corp", role: "SWE Intern", appliedDate: "2026-09-15" }));
    assert.notEqual(a, duplicateKey({ companyName: "Acme Corp", role: "SWE", appliedDate: "2026-09-14" }));
  });
});

describe("whole file", () => {
  it("separates good rows from bad ones and keeps going", () => {
    const { totalRows, valid, errors } = run("Company,Role,Applied Date\nA,B,2026-09-14\nBAD,,2026-09-14\nC,D,2026-09-15\n");
    assert.equal(totalRows, 3);
    assert.deepEqual(valid.map((v) => v.row), [2, 4]);
    assert.deepEqual(errors.map((e) => e.row), [3]);
  });

  it("validates 2,000 rows quickly", () => {
    const body = Array.from({ length: 2000 }, (_, i) => `Company ${i},Role ${i},applied,2026-09-${String((i % 28) + 1).padStart(2, "0")},https://x.com/${i},"notes, with comma ${i}",`).join("\n");
    const start = Date.now();
    const result = run(HEADER + body);
    const ms = Date.now() - start;
    assert.equal(result.valid.length, 2000);
    assert.ok(ms < 500, `took ${ms} ms`);
  });
});
