import { env } from "../../config/env.js";

// Email clients ignore most modern CSS, so every template renders through this
// one shell: nested tables, inline styles, bgcolor attributes for Outlook, and
// a system font stack (web fonts don't load in most inboxes). The look mirrors
// the app: paper ground, ink borders, hard shadow, Signal Blue action.
export const COLORS = {
  paper: "#F6F4EE",
  ink: "#000000",
  text: "#1E293B",
  muted: "#64748B",
  blue: "#3B82F6",
  blueTint: "#DBEAFE",
  redDeep: "#B91C1C",
  redTint: "#FEE2E2",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// User-typed values (company, role) must never reach the HTML raw.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailCta = { label: string; url: string };

export type EmailLayout = {
  // Grey preview text shown next to the subject in the inbox list.
  preheader: string;
  heading: string;
  // Trusted HTML (callers escape anything user-typed).
  bodyHtml: string;
  cta?: EmailCta;
  // Shown under the button; defaults to a copy-paste fallback for the CTA link.
  afterCtaHtml?: string;
  // Why the person got this email, plus any unsubscribe link.
  footerHtml: string;
};

export function paragraph(html: string, opts: { muted?: boolean } = {}) {
  const color = opts.muted ? COLORS.muted : COLORS.text;
  return `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${color};">${html}</p>`;
}

export function callout(html: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;"><tr><td bgcolor="${COLORS.blueTint}" style="background:${COLORS.blueTint};border:2px solid ${COLORS.ink};border-radius:6px;padding:12px 16px;font-size:14px;line-height:22px;color:${COLORS.ink};">${html}</td></tr></table>`;
}

function button({ label, url }: EmailCta) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td bgcolor="${COLORS.blue}" style="background:${COLORS.blue};border:2px solid ${COLORS.ink};border-radius:8px;box-shadow:3px 3px 0 ${COLORS.ink};"><a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:16px;font-weight:800;line-height:20px;color:${COLORS.ink};text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
}

export function renderEmail(layout: EmailLayout): string {
  const { preheader, heading, bodyHtml, cta, footerHtml } = layout;

  const afterCta =
    layout.afterCtaHtml ??
    (cta
      ? `<p style="margin:0;font-size:13px;line-height:20px;color:${COLORS.muted};">Button not working? Copy this link into your browser:<br><a href="${escapeHtml(cta.url)}" style="color:${COLORS.ink};word-break:break-all;">${escapeHtml(cta.url)}</a></p>`
      : "");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLORS.paper};">${escapeHtml(preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.paper}" style="background:${COLORS.paper};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${FONT};">
    <tr><td style="padding:0 0 20px;">
      <span style="display:inline-block;background:${COLORS.blue};border:2px solid ${COLORS.ink};border-radius:6px;box-shadow:2px 2px 0 ${COLORS.ink};padding:5px 12px;font-size:18px;font-weight:800;letter-spacing:0.5px;color:${COLORS.ink};">TRACKr</span>
    </td></tr>
    <tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border:2px solid ${COLORS.ink};border-radius:10px;box-shadow:5px 5px 0 ${COLORS.ink};padding:32px 28px;">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:30px;font-weight:800;color:${COLORS.ink};">${escapeHtml(heading)}</h1>
      ${bodyHtml}
      ${cta ? button(cta) : ""}
      ${afterCta}
    </td></tr>
    <tr><td style="padding:24px 4px 0;font-size:12px;line-height:19px;color:${COLORS.muted};">
      ${footerHtml}
      <p style="margin:12px 0 0;">TRACKr &middot; <a href="${escapeHtml(env.FRONTEND_URL)}" style="color:${COLORS.muted};">${escapeHtml(env.FRONTEND_URL.replace(/^https?:\/\//, ""))}</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
