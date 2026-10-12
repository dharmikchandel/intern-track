import { Resend } from "resend";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  // Plain-text alternative: improves deliverability and covers text-only clients.
  text?: string;
  // Defaults to EMAIL_FROM (account emails: verify, password reset).
  from?: string;
  headers?: Record<string, string>;
}

// Falls back to logging the email instead of sending when RESEND_API_KEY
// isn't set, so password-reset/email-verification stay testable locally
// (link included) without needing a Resend account set up first.
export async function sendEmail({ to, subject, html, text, from = env.EMAIL_FROM, headers }: SendEmailInput) {
  if (!resend) {
    // The plain-text part is logged (not the html) so the link is readable in the console.
    logger.warn({ to, subject, text: text ?? html }, "RESEND_API_KEY not set, logging email instead of sending");
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(text && { text }),
    ...(headers && { headers }),
  });

  if (error) {
    logger.error({ err: error, to }, "Failed to send email via Resend");
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
