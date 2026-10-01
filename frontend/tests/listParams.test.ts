// Run from /frontend:
//   ../backend/node_modules/.bin/tsx --test tests/listParams.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultOrderFor, parseListParams, withListParams } from "../src/features/applications/listParams.ts";

const url = (s: string) => new URLSearchParams(s);

describe("parseListParams", () => {
    it("returns defaults for an empty URL", () => {
        assert.deepEqual(parseListParams(url("")), {
            view: null, q: "", status: "", followUp: false, sort: "appliedDate", order: "desc", page: 1,
        });
    });

    it("reads every param", () => {
        const p = parseListParams(url("view=board&q=stripe&status=OA&followUp=1&sort=role&order=desc&page=3"));
        assert.deepEqual(p, { view: "board", q: "stripe", status: "OA", followUp: true, sort: "role", order: "desc", page: 3 });
    });

    it("falls back to defaults for junk instead of breaking", () => {
        const p = parseListParams(url("view=grid&status=NOPE&sort=password&order=sideways&page=-4&followUp=yes"));
        assert.deepEqual(p, { view: null, q: "", status: "", followUp: false, sort: "appliedDate", order: "desc", page: 1 });
        assert.equal(parseListParams(url("page=abc")).page, 1);
    });

    it("uses each column's natural order when none is given", () => {
        assert.equal(parseListParams(url("sort=companyName")).order, "asc");
        assert.equal(parseListParams(url("sort=appliedDate")).order, "desc");
        assert.equal(defaultOrderFor("status"), "asc");
    });

    it("trims and caps the search text", () => {
        assert.equal(parseListParams(url("q=%20%20acme%20")).q, "acme");
        assert.equal(parseListParams(url(`q=${"x".repeat(300)}`)).q.length, 100);
    });

    it("no longer accepts updatedAt as a list sort (it has no column)", () => {
        assert.equal(parseListParams(url("sort=updatedAt")).sort, "appliedDate");
    });
});

describe("withListParams", () => {
    it("leaves defaults out of the URL", () => {
        assert.equal(withListParams(url(""), { sort: "appliedDate", order: "desc", page: 1 }).toString(), "");
        assert.equal(withListParams(url("sort=role"), { sort: "appliedDate" }).toString(), "");
    });

    it("switching column resets to that column's natural order, unless an order is given too", () => {
        assert.equal(withListParams(url("sort=role&order=desc"), { sort: "appliedDate" }).toString(), "");
        assert.equal(withListParams(url("sort=appliedDate"), { sort: "companyName" }).toString(), "sort=companyName");
        assert.equal(withListParams(url(""), { sort: "role", order: "desc" }).toString(), "sort=role&order=desc");
    });

    it("round-trips a full state", () => {
        const next = withListParams(url(""), { view: "list", q: "stripe", status: "INTERVIEW", followUp: true, sort: "companyName", order: "desc", page: 2 });
        assert.equal(next.toString(), "view=list&q=stripe&status=INTERVIEW&followUp=1&sort=companyName&order=desc&page=2");
        assert.deepEqual(parseListParams(next), { view: "list", q: "stripe", status: "INTERVIEW", followUp: true, sort: "companyName", order: "desc", page: 2 });
    });

    it("goes back to page 1 when a filter or the sort changes", () => {
        assert.equal(withListParams(url("page=4"), { q: "acme" }).get("page"), null);
        assert.equal(withListParams(url("page=4"), { status: "OFFER" }).get("page"), null);
        assert.equal(withListParams(url("page=4"), { sort: "role" }).get("page"), null);
        assert.equal(withListParams(url("page=4"), { followUp: true }).get("page"), null);
    });

    it("keeps the page when only the page (or the view) changes", () => {
        assert.equal(withListParams(url("q=a&page=2"), { page: 3 }).get("page"), "3");
        assert.equal(withListParams(url("q=a&page=2"), { view: "board" }).get("page"), "2");
    });

    it("clears a filter by setting it empty, keeping the rest", () => {
        const next = withListParams(url("q=a&status=OA&sort=role"), { q: "", status: "", followUp: false });
        assert.equal(next.toString(), "sort=role");
    });

    it("lets an old dashboard link keep working", () => {
        assert.equal(parseListParams(url("followUp=1")).followUp, true);
    });
});
