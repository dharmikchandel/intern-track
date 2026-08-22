import dotenv from "dotenv";
dotenv.config();

// Same origin logic as the CORS allowlist in app.ts: in prod the frontend
// is a separate deployed domain (CLIENT_URL), locally it's always Vite's
// dev server. Used to build links that go out in emails (reset, verify).
function resolveFrontendUrl() {
  if (process.env.NODE_ENV === "production") {
    return (process.env.CLIENT_URL ?? "").replace(/\/+$/, "");
  }
  return "http://localhost:5173";
}

export const env = {
  PORT: process.env.PORT || "3000",
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  REDIS_URL: process.env.REDIS_URL!,
  FRONTEND_URL: resolveFrontendUrl(),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || "TRACKr <onboarding@resend.dev>",
};
