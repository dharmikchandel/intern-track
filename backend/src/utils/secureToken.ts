import crypto from "node:crypto";

// Shared by every "opaque token in a cookie/link, hash in the DB" flow
// (refresh tokens, password reset, email verification): the raw token is
// only ever held by the client, so a DB leak doesn't hand out anything
// usable — same rationale as password hashing.
export function generateSecureToken(bytes = 40) {
  const token = crypto.randomBytes(bytes).toString("hex");
  return { token, tokenHash: hashSecureToken(token) };
}

export function hashSecureToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
