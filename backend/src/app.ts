import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes.js";
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
        // credentials: true
    }
));
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Rate limiter must run before the routes it's meant to protect, otherwise
// every request is already answered by the time this middleware runs.
app.use(apiRateLimiter);
app.use("/api/v1", routes);

app.use(errorHandler);

export default app;