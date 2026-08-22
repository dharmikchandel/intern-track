import { Resend } from "resend";
import { env } from "../../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Falls back to logging the email instead of sending when RESEND_API_KEY
// isn't set, so password-reset/email-verification stay testable locally
// (link included) without needing a Resend account set up first.
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.warn(`✉️  [mail] RESEND_API_KEY not set — logging email instead of sending.`);
    console.warn(`✉️  To: ${to}\n✉️  Subject: ${subject}\n${html}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("❌ Failed to send email via Resend:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
