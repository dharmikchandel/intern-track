import { z } from "zod";

export const preferencesSchema = z.object({
  emailDigestEnabled: z.boolean(),
});

// One-click unsubscribe (RFC 8058) POSTs to the exact URL in the email
// header, so the token arrives in the query string; the SPA page sends it in
// the body. Accept either.
export const unsubscribeSchema = z.object({
  token: z.string().min(1).max(200),
});
