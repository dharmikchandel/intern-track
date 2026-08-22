import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Short-lived: this is the token the SPA holds in memory and sends as a
// Bearer header. A leaked/XSS-read access token is only useful for 15
// minutes; long-lived sessions come from the httpOnly refresh cookie
// instead (see utils/refreshToken.ts), which JS on the page can't read.
export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET);
}
