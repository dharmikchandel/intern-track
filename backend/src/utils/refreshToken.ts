import { generateSecureToken, hashSecureToken } from "./secureToken.js";

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateRefreshToken() {
  return generateSecureToken();
}

export function hashRefreshToken(token: string) {
  return hashSecureToken(token);
}
