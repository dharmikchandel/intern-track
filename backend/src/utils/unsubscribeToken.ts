import crypto from "node:crypto";
import { env } from "../config/env.js";

// Stateless, non-expiring token for the digest unsubscribe link: an old email
// must keep working. It is an HMAC, deliberately NOT a JWT: a JWT signed with
// the same secret could be mistaken for an access token by requireAuth. The
// "digest-unsubscribe:" prefix keeps it from being valid for anything else.
function sign(userId: string) {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`digest-unsubscribe:${userId}`).digest("hex");
}

export function createUnsubscribeToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

// Returns the userId if the token is authentic, otherwise null.
export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  return userId;
}
