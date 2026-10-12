import { callout, paragraph, renderEmail } from "../mail/mail.layout.js";

const footerHtml = (reason: string) => `<p style="margin:0;">${reason}</p>`;

export function buildVerificationEmail(opts: { verifyUrl: string }) {
  const { verifyUrl } = opts;

  const html = renderEmail({
    preheader: "One click to confirm your email and finish setting up TRACKr.",
    heading: "Confirm your email",
    bodyHtml:
      paragraph("Welcome to TRACKr. Confirm your email address to finish setting up your account.") +
      paragraph("This link expires in 24 hours.", { muted: true }),
    cta: { label: "Verify email", url: verifyUrl },
    footerHtml: footerHtml("You're getting this because someone signed up for TRACKr with this address. If that wasn't you, you can ignore this email."),
  });

  const text = `Confirm your email

Welcome to TRACKr. Confirm your email address to finish setting up your account:

${verifyUrl}

This link expires in 24 hours.

You're getting this because someone signed up for TRACKr with this address. If that wasn't you, you can ignore this email.`;

  return { subject: "Confirm your email for TRACKr", html, text };
}

export function buildPasswordResetEmail(opts: { resetUrl: string }) {
  const { resetUrl } = opts;

  const html = renderEmail({
    preheader: "Use this link within the hour to choose a new password.",
    heading: "Reset your password",
    bodyHtml:
      paragraph("We got a request to reset the password for your TRACKr account. Choose a new one with the button below.") +
      callout("This link expires in <strong>1 hour</strong> and can only be used once. Resetting signs you out of every device."),
    cta: { label: "Choose a new password", url: resetUrl },
    footerHtml: footerHtml("Didn't ask for this? Your password hasn't changed, so you can safely ignore this email."),
  });

  const text = `Reset your password

We got a request to reset the password for your TRACKr account. Choose a new one here:

${resetUrl}

This link expires in 1 hour and can only be used once. Resetting signs you out of every device.

Didn't ask for this? Your password hasn't changed, so you can safely ignore this email.`;

  return { subject: "Reset your TRACKr password", html, text };
}
