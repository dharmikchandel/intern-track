import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes.ts";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

app.use("/api/v1", routes);

app.use(apiRateLimiter);
app.use(errorHandler);

export default app;