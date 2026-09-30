// Keeps the free-tier Render backend from sleeping by pinging its health
// endpoint every 10 minutes, but only between 08:00 and midnight IST: Render
// sleeps a free service after ~15 minutes without traffic, so that is exactly
// the window in which a cold start would be noticed, and it keeps the monthly
// instance-hours well under the 750 free hours.
//
// /health does not touch the database, so a ping is as cheap as a request gets.
// The database and Redis are kept alive by a separate daily job
// (.github/workflows/keepalive.yml).

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const PING_TIMEOUT_MS = 60_000; // a cold start can take ~a minute

// Hours are IST, end exclusive: 8 to 24 means 08:00 up to midnight.
export function inWindow(date, startHour, endHour) {
  const hour = new Date(date.getTime() + IST_OFFSET_MS).getUTCHours();
  return hour >= startHour && hour < endHour;
}

export async function ping(env, fetchImpl = fetch) {
  const url = `${env.API_URL.replace(/\/+$/, "")}/api/v1/health`;
  let lastError = "unknown";

  // One retry: the first request may be the one that wakes the instance.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(PING_TIMEOUT_MS), headers: { "user-agent": "trackr-keepalive" } });
      const ms = Date.now() - started;
      if (res.ok) return { ok: true, status: res.status, ms, attempt };
      lastError = `status ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  return { ok: false, error: lastError };
}

export async function run(env, now, fetchImpl = fetch) {
  const start = Number(env.WINDOW_START_HOUR_IST ?? 8);
  const end = Number(env.WINDOW_END_HOUR_IST ?? 24);
  if (!inWindow(now, start, end)) {
    console.log(JSON.stringify({ event: "skipped", reason: "outside window" }));
    return { skipped: true };
  }
  const result = await ping(env, fetchImpl);
  console.log(JSON.stringify({ event: "ping", ...result }));
  // Throwing marks the cron run as failed in the Cloudflare dashboard.
  if (!result.ok) throw new Error(`keepalive ping failed: ${result.error}`);
  return result;
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(run(env, new Date(controller.scheduledTime)));
  },
};
