import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { inWindow, ping, run } from "./worker.js";

const at = (iso) => new Date(iso);
const ENV = { API_URL: "https://api.example.com/", WINDOW_START_HOUR_IST: "8", WINDOW_END_HOUR_IST: "24" };

describe("IST window 08:00 to midnight", () => {
  it("is open from 08:00 IST (02:30 UTC) through 23:50 IST (18:20 UTC)", () => {
    assert.equal(inWindow(at("2026-10-01T02:30:00Z"), 8, 24), true); // 08:00 IST
    assert.equal(inWindow(at("2026-10-01T12:00:00Z"), 8, 24), true); // 17:30 IST
    assert.equal(inWindow(at("2026-10-01T18:20:00Z"), 8, 24), true); // 23:50 IST
  });
  it("is closed from midnight IST (18:30 UTC) until 07:59 IST (02:29 UTC)", () => {
    assert.equal(inWindow(at("2026-10-01T18:30:00Z"), 8, 24), false); // 00:00 IST
    assert.equal(inWindow(at("2026-10-01T21:00:00Z"), 8, 24), false); // 02:30 IST
    assert.equal(inWindow(at("2026-10-01T02:29:00Z"), 8, 24), false); // 07:59 IST
  });
  it("uses IST, not UTC, across the UTC date change", () => {
    assert.equal(inWindow(at("2026-09-30T23:50:00Z"), 8, 24), false); // 05:20 IST on Oct 1
    assert.equal(inWindow(at("2026-10-01T00:10:00Z"), 8, 24), false); // 05:40 IST
  });
});

describe("ping", () => {
  it("calls /api/v1/health once and reports success", async () => {
    const fetchImpl = mock.fn(async () => new Response("{}", { status: 200 }));
    const result = await ping(ENV, fetchImpl);
    assert.equal(result.ok, true);
    assert.equal(fetchImpl.mock.callCount(), 1);
    assert.equal(fetchImpl.mock.calls[0].arguments[0], "https://api.example.com/api/v1/health"); // trailing slash handled
  });

  it("retries once after a failure and succeeds", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let n = 0;
    const fetchImpl = async () => (++n === 1 ? new Response("waking", { status: 503 }) : new Response("{}", { status: 200 }));
    const p = ping(ENV, fetchImpl);
    await Promise.resolve();
    await new Promise((r) => setImmediate(r));
    t.mock.timers.tick(5_000);
    const result = await p;
    assert.deepEqual([result.ok, result.attempt], [true, 2]);
  });

  it("gives up after two failed attempts with the reason", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const fetchImpl = async () => {
      throw new Error("connect ETIMEDOUT");
    };
    const p = ping(ENV, fetchImpl);
    await new Promise((r) => setImmediate(r));
    t.mock.timers.tick(5_000);
    const result = await p;
    assert.deepEqual(result, { ok: false, error: "connect ETIMEDOUT" });
  });
});

describe("run", () => {
  it("does not call the backend outside the window", async () => {
    const fetchImpl = mock.fn(async () => new Response("{}"));
    const result = await run(ENV, at("2026-10-01T21:00:00Z"), fetchImpl);
    assert.deepEqual(result, { skipped: true });
    assert.equal(fetchImpl.mock.callCount(), 0);
  });

  it("pings inside the window", async () => {
    const fetchImpl = mock.fn(async () => new Response("{}", { status: 200 }));
    const result = await run(ENV, at("2026-10-01T10:00:00Z"), fetchImpl);
    assert.equal(result.ok, true);
    assert.equal(fetchImpl.mock.callCount(), 1);
  });

  it("throws on failure so the cron run shows as failed", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const fetchImpl = async () => new Response("down", { status: 502 });
    const p = run(ENV, at("2026-10-01T10:00:00Z"), fetchImpl);
    const assertion = assert.rejects(p, /keepalive ping failed: status 502/);
    await new Promise((r) => setImmediate(r));
    t.mock.timers.tick(5_000);
    await assertion;
  });

  it("honours a custom window from the environment", async () => {
    const fetchImpl = mock.fn(async () => new Response("{}"));
    const env = { ...ENV, WINDOW_START_HOUR_IST: "10", WINDOW_END_HOUR_IST: "12" };
    assert.deepEqual(await run(env, at("2026-10-01T02:30:00Z"), fetchImpl), { skipped: true }); // 08:00 IST
    assert.equal((await run(env, at("2026-10-01T05:00:00Z"), fetchImpl)).ok, true); // 10:30 IST
  });
});
