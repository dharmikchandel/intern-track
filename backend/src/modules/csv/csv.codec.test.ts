import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { csvCell, csvLine, guardFormula, parseCsv, sniffDelimiter, unguardFormula } from "./csv.codec.js";
import { AppError } from "../../utils/AppError.js";

const rows = (text: string) => parseCsv(text).records.map((r) => r.cells);

describe("parseCsv", () => {
  it("parses a simple file and reports spreadsheet row numbers", () => {
    const parsed = parseCsv("a,b\n1,2\n3,4\n");
    assert.deepEqual(parsed.header, ["a", "b"]);
    assert.deepEqual(parsed.records.map((r) => r.number), [2, 3]);
    assert.deepEqual(rows("a,b\n1,2\n3,4\n"), [["1", "2"], ["3", "4"]]);
  });

  it("handles CRLF, lone CR and a missing final newline", () => {
    assert.deepEqual(rows("a,b\r\n1,2\r\n3,4"), [["1", "2"], ["3", "4"]]);
    assert.deepEqual(rows("a,b\r1,2\r3,4"), [["1", "2"], ["3", "4"]]);
  });

  it("handles quotes: commas, escaped quotes and newlines inside a field", () => {
    const parsed = parseCsv('a,b\n"x, y","say ""hi"""\n"line1\nline2",z\n');
    assert.deepEqual(parsed.records.map((r) => r.cells), [["x, y", 'say "hi"'], ["line1\nline2", "z"]]);
    // the multi-line record still counts as one spreadsheet row
    assert.deepEqual(parsed.records.map((r) => r.number), [2, 3]);
  });

  it("strips a UTF-8 byte-order mark", () => {
    const parsed = parseCsv("﻿Company,Role\nX,Y");
    assert.deepEqual(parsed.header, ["Company", "Role"]);
  });

  it("skips blank lines and rows of only empty cells, keeping numbering", () => {
    const parsed = parseCsv("a,b\n1,2\n\n,\n3,4\n,,,\n");
    assert.deepEqual(parsed.records.map((r) => r.cells), [["1", "2"], ["3", "4"]]);
    assert.deepEqual(parsed.records.map((r) => r.number), [2, 5]);
  });

  it("keeps empty cells and short rows as they are", () => {
    assert.deepEqual(rows("a,b,c\n1,,3\n4\n"), [["1", "", "3"], ["4"]]);
  });

  it("treats a quote in the middle of an unquoted field as text", () => {
    assert.deepEqual(rows('a,b\n5" pipe,x\n'), [['5" pipe', "x"]]);
  });

  it("rejects a quote that never closes instead of swallowing the rest of the file", () => {
    assert.throws(() => parseCsv('a,b\n1,"oops\n2,3\n'), (e: unknown) => e instanceof AppError && e.code === "CSV_MALFORMED");
  });

  it("rejects an empty file", () => {
    for (const text of ["", "\n\n", "﻿"]) {
      assert.throws(() => parseCsv(text), (e: unknown) => e instanceof AppError && e.code === "CSV_EMPTY");
    }
  });

  it("enforces the row limit (header not counted) and the column limit", () => {
    const body = (n: number) => "h\n" + Array.from({ length: n }, (_, i) => `r${i}`).join("\n");
    assert.equal(parseCsv(body(10), 10).records.length, 10);
    assert.throws(() => parseCsv(body(11), 10), (e: unknown) => e instanceof AppError && e.code === "CSV_TOO_MANY_ROWS");
    assert.throws(() => parseCsv("a\n" + ",".repeat(60) + "x"), (e: unknown) => e instanceof AppError && e.code === "CSV_MALFORMED");
  });

  it("detects semicolon and tab separated files, ignoring separators inside quotes", () => {
    assert.equal(sniffDelimiter("a;b;c\n1;2;3"), ";");
    assert.equal(sniffDelimiter("a\tb\tc"), "\t");
    assert.equal(sniffDelimiter('"a,b,c";d\n'), ";");
    assert.equal(sniffDelimiter("only"), ",");
    assert.deepEqual(rows("Company;Role\nAcme;SWE, intern\n"), [["Acme", "SWE, intern"]]);
  });

  it("stays linear on hostile input", () => {
    const start = Date.now();
    // an unterminated quote run is a clean, typed rejection, not a hang or a crash
    assert.throws(() => parseCsv("a,b\n" + '"'.repeat(500_001) + "\n"), (e: unknown) => e instanceof AppError && e.code === "CSV_MALFORMED");
    assert.equal(parseCsv("a,b\n" + '"'.repeat(500_000) + "\n").records.length, 1);
    parseCsv("a\n" + "x,".repeat(20) + "\n" + "\n".repeat(400_000));
    parseCsv("a,b\n" + `"${"q".repeat(900_000)}",z\n`);
    assert.ok(Date.now() - start < 1500, `took ${Date.now() - start} ms`);
  });
});

describe("formula guard", () => {
  it("prefixes cells a spreadsheet would run as a formula", () => {
    for (const bad of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx", '=HYPERLINK("http://evil","x")']) {
      assert.equal(guardFormula(bad), `'${bad}`, bad);
    }
  });

  it("leaves ordinary text alone", () => {
    for (const ok of ["Acme", "  =x", "a=b", "'quoted", "", "1-2", "C++"]) assert.equal(guardFormula(ok), ok, ok);
  });

  it("is exactly undone by unguardFormula, for any text", () => {
    const alphabet = ["=", "+", "-", "@", "'", "\t", "\r", "a", " ", '"', ",", "\n", "é"];
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 5000; i++) {
      const len = Math.floor(rand() * 6);
      const s = Array.from({ length: len }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("");
      assert.equal(unguardFormula(guardFormula(s)), s, JSON.stringify(s));
    }
  });
});

describe("writing", () => {
  it("quotes only when needed and doubles inner quotes", () => {
    assert.equal(csvCell("plain"), "plain");
    assert.equal(csvCell("a,b"), '"a,b"');
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell("two\nlines"), '"two\nlines"');
    assert.equal(csvLine(["a", "b,c"]), 'a,"b,c"\r\n');
  });

  it("round-trips arbitrary text through write -> parse -> unguard", () => {
    const alphabet = ["=", "+", "-", "@", "'", "\t", "\r", "\n", "a", "b", " ", '"', ",", ";", "é", "日"];
    let seed = 987;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 3000; i++) {
      const cells = Array.from({ length: 3 }, () =>
        Array.from({ length: Math.floor(rand() * 7) }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("")
      );
      // a row with only blanks is (deliberately) skipped by the reader
      if (cells.every((c) => c.trim() === "")) continue;
      const text = csvLine(["h1", "h2", "h3"]) + csvLine(cells);
      const parsed = parseCsv(text);
      const back = parsed.records[0]!.cells.map(unguardFormula);
      assert.deepEqual(back, cells, JSON.stringify(cells));
    }
  });
});
