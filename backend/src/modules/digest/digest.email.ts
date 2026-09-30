import { env } from "../../config/env.js";

export type DigestItem = {
  id: string;
  companyName: string;
  role: string;
  followUpDate: Date;
};

// Company/role are user-typed, so they must never reach the email HTML raw.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole UTC days since the follow-up date; 0 means it is due today.
export function daysOverdue(followUpDate: Date, now: Date): number {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((startOfToday - followUpDate.getTime()) / DAY_MS));
}

function overdueLabel(days: number) {
  if (days === 0) return "due today";
  return `${days} day${days === 1 ? "" : "s"} overdue`;
}

export function buildDigestEmail(opts: {
  items: DigestItem[];
  total: number;
  unsubscribeUrl: string;
  now: Date;
}) {
  const { items, total, unsubscribeUrl, now } = opts;

  const subject = total === 1 ? "1 application needs a follow-up" : `${total} applications need a follow-up`;

  const rows = items
    .map((item) => {
      const link = `${env.FRONTEND_URL}/applications/${encodeURIComponent(item.id)}`;
      return `<li style="margin-bottom:8px"><a href="${link}"><strong>${escapeHtml(item.companyName)}</strong></a> - ${escapeHtml(item.role)} <span style="color:#b91c1c">(${overdueLabel(daysOverdue(item.followUpDate, now))})</span></li>`;
    })
    .join("");

  const more = total > items.length ? `<p>...and ${total - items.length} more in your <a href="${env.FRONTEND_URL}/applications">applications</a>.</p>` : "";

  const html = `<p>${total === 1 ? "One application is" : `${total} applications are`} past its follow-up date.</p>
<ul style="padding-left:18px">${rows}</ul>${more}
<p style="color:#64748b;font-size:12px">You get this at most once a week. <a href="${unsubscribeUrl}">Unsubscribe from follow-up reminders</a>.</p>`;

  return { subject, html };
}
