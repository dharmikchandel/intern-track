import { env } from "../../config/env.js";
import { COLORS, escapeHtml, paragraph, renderEmail } from "../mail/mail.layout.js";

export type DigestItem = {
  id: string;
  companyName: string;
  role: string;
  followUpDate: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole UTC days since the follow-up date; 0 means it is due today.
export function daysOverdue(followUpDate: Date, now: Date): number {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((startOfToday - followUpDate.getTime()) / DAY_MS));
}

function overdueLabel(days: number) {
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} overdue`;
}

function itemRow(item: DigestItem, days: number, isLast: boolean) {
  const link = `${env.FRONTEND_URL}/applications/${encodeURIComponent(item.id)}`;
  const due = days === 0;
  const pillBg = due ? COLORS.blueTint : COLORS.redTint;
  const border = isLast ? "" : `border-bottom:1px solid #E2E8F0;`;
  return `<tr>
<td style="padding:14px 0;${border}">
  <a href="${escapeHtml(link)}" style="font-size:16px;line-height:22px;font-weight:800;color:${COLORS.ink};text-decoration:none;">${escapeHtml(item.companyName)}</a>
  <div style="font-size:14px;line-height:20px;color:${COLORS.muted};">${escapeHtml(item.role)}</div>
</td>
<td align="right" valign="top" style="padding:14px 0;white-space:nowrap;${border}">
  <span style="display:inline-block;background:${pillBg};border:2px solid ${COLORS.ink};border-radius:6px;padding:2px 8px;font-size:12px;line-height:16px;font-weight:700;color:${COLORS.ink};">${overdueLabel(days)}</span>
</td>
</tr>`;
}

export function buildDigestEmail(opts: {
  items: DigestItem[];
  total: number;
  unsubscribeUrl: string;
  now: Date;
}) {
  const { items, total, unsubscribeUrl, now } = opts;

  const subject = total === 1 ? "1 application needs a follow-up" : `${total} applications need a follow-up`;
  const applicationsUrl = `${env.FRONTEND_URL}/applications`;
  const lead = total === 1 ? "One application is past its follow-up date." : `${total} applications are past their follow-up date.`;

  const rows = items.map((item, i) => itemRow(item, daysOverdue(item.followUpDate, now), i === items.length - 1)).join("");
  const moreCount = total - items.length;
  const first = items[0];

  const bodyHtml =
    paragraph(`${lead} A short note now keeps the conversation warm.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-top:2px solid ${COLORS.ink};">${rows}</table>` +
    (moreCount > 0 ? paragraph(`Plus ${moreCount} more in your list.`, { muted: true }) : "");

  const html = renderEmail({
    preheader: first ? `${first.companyName}${total > 1 ? ` and ${total - 1} more` : ""} waiting on your follow-up.` : lead,
    heading: "Time to follow up",
    bodyHtml,
    cta: { label: "Open your applications", url: applicationsUrl },
    afterCtaHtml: "",
    footerHtml: `<p style="margin:0;">You get this reminder at most once a week, only when something is overdue. <a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLORS.muted};">Unsubscribe from follow-up reminders</a>.</p>`,
  });

  const lines = items.map((item) => `- ${item.companyName}, ${item.role} (${overdueLabel(daysOverdue(item.followUpDate, now)).toLowerCase()})`);
  const text = `Time to follow up

${lead}

${lines.join("\n")}${moreCount > 0 ? `\nPlus ${moreCount} more in your list.` : ""}

Open your applications: ${applicationsUrl}

You get this reminder at most once a week, only when something is overdue.
Unsubscribe from follow-up reminders: ${unsubscribeUrl}`;

  return { subject, html, text };
}
