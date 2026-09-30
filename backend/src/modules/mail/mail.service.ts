import { Resend } from "resend";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

// Falls back to logging the email instead of sending when RESEND_API_KEY
// isn't set, so password-reset/email-verification stay testable locally
// (link included) without needing a Resend account set up first.
export async function sendEmail({ to, subject, html, headers }: SendEmailInput) {
  if (!resend) {
    logger.warn({ to, subject, html }, "RESEND_API_KEY not set, logging email instead of sending");
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(headers && { headers }),
  });

  if (error) {
    logger.error({ err: error, to }, "Failed to send email via Resend");
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
