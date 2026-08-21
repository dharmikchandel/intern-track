import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// No refresh-token flow: there's only one client (the SPA), it holds the
// token in localStorage, and there's no server-side refresh endpoint. A
// single longer-lived access token is simpler and just as correct at this
// scale than issuing a refresh token nothing ever redeems.
export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET);
}
