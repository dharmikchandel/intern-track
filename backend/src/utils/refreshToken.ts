import crypto from "node:crypto";

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Opaque random token, not a JWT: the DB row is the source of truth so a
// single row can be revoked (logout, rotation, reuse detection) without
// needing a blocklist. Only the SHA-256 hash is ever stored — a DB leak
// doesn't hand out usable tokens, same rationale as password hashing.
export function generateRefreshToken() {
  const token = crypto.randomBytes(40).toString("hex");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
