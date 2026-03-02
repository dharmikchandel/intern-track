import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const allowedOrigins: string[] = process.env.NODE_ENV === "production" ? [ process.env.CLIENT_URL! ] : [ `http://localhost:5173` ]

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    }
));
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

app.use("/api/v1", routes);

app.use(apiRateLimiter);
app.use(errorHandler);

export default app;