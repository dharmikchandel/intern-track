import { randomUUID } from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import { logger } from "./config/logger.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Render/Vercel-style deployments sit behind a reverse proxy, so Express needs
// to trust the first hop to read the real client IP (req.ip) from
// X-Forwarded-For. Without this, express-rate-limit either throttles the
// proxy's IP for everyone or refuses to start in production.
app.set("trust proxy", 1);

const allowedOrigins: string[] = process.env.NODE_ENV === "production"
    ? [(process.env.CLIENT_URL ?? "").replace(/\/+$/, "")]
    : [`http://localhost:5173`];

app.use(
    cors({
        origin: allowedOrigins,
        // The refresh token travels as an httpOnly cookie, so the browser
        // needs credentials: true on the CORS response to accept and send
        // it cross-origin (frontend and backend are different domains in
        // prod). This only works with an explicit origin above, never "*".
        credentials: true,
    }
));
// Must run before anything that can throw (express.json() included) — the
// error handler reads req.log, and Express skips straight from a failing
// middleware to the nearest error handler, bypassing anything not yet run.
app.use(
    pinoHttp({
        logger,
        // Correlate every log line for a request, including ones logged deeper
        // in the call stack via req.log. Echoed back so a client-reported bug
        // can be matched to its exact server-side log lines.
        genReqId: (req, res) => {
            const existingId = req.headers["x-request-id"];
            if (typeof existingId === "string") return existingId;
            const id = randomUUID();
            res.setHeader("X-Request-Id", id);
            return id;
        },
        customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
        // req.url gets mutated as it passes through nested routers (Express
        // strips the matched prefix at each level and only restores it via
        // next(), which a terminal handler never calls) — req.originalUrl is
        // the one field guaranteed to still hold the full path.
        customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`,
        customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl} ${res.statusCode} - ${err.message}`,
        // The message above already carries method/url/status, so the full
        // req/res objects (headers, query, params, ...) pino-http attaches
        // by default would just repeat that as clutter. Keep only the
        // correlation id, for matching a report back to its log lines.
        customProps: (req) => ({ reqId: req.id }),
        serializers: {
            req: () => undefined,
            res: () => undefined,
        },
        // Health checks would otherwise spam the log on every uptime-monitor ping.
        autoLogging: {
            ignore: (req) => req.url === "/api/v1/health",
        },
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// Rate limiter must run before the routes it's meant to protect, otherwise
// every request is already answered by the time this middleware runs.
app.use(apiRateLimiter);
app.use("/api/v1", routes);

app.use(errorHandler);

export default app;