import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/AppError.js";
import { listApplicationsQuerySchema } from "../applications/application.schema.js";
import { exportChunks, importApplications } from "./csv.service.js";

export const MAX_CSV_BYTES = "1mb";

// The same three filters the list page has, so "export what I'm looking at" works.
const exportQuerySchema = listApplicationsQuerySchema.pick({ status: true, q: true, needsFollowUp: true });

const importQuerySchema = z.object({
  dryRun: z
    .enum(["true", "false"])
    .default("true") // safest default: nothing is written unless the caller says so
    .transform((v) => v === "true"),
  dateFormat: z.enum(["iso", "mdy", "dmy"]).default("iso"),
});

export async function importCsv(req: AuthRequest, res: Response) {
  const query = importQuerySchema.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: query.error.flatten() });

  // express.text() only fills req.body for text/* bodies; anything else leaves
  // it as the empty object the JSON parser defaults to.
  if (typeof req.body !== "string") {
    throw new AppError("Send the file as text/csv", 415, "UNSUPPORTED_MEDIA_TYPE");
  }

  const summary = await importApplications(req.userId!, req.body, query.data);
  return res.status(200).json(summary);
}

export async function exportCsv(req: AuthRequest, res: Response) {
  const query = exportQuerySchema.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: query.error.flatten() });

  const chunks = exportChunks(req.userId!, query.data);
  // Read the first batch BEFORE sending headers: if the database fails here the
  // client gets a normal JSON error instead of a download that is silently cut short.
  const first = await chunks.next();

  const stamp = new Date().toISOString().slice(0, 10);
  res.status(200);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="interntrack-applications-${stamp}.csv"`);
  res.setHeader("Cache-Control", "no-store");

  async function* all() {
    if (!first.done) yield first.value;
    yield* chunks;
  }
  // pipeline handles backpressure and stops the generator if the client
  // disconnects; a failure mid-download aborts the connection so the browser
  // reports an error instead of saving a truncated file as if it were complete.
  try {
    await pipeline(Readable.from(all()), res);
  } catch (err) {
    // Headers are already out, so there is no response left to send (the error
    // handler can't write a JSON error now): the connection has been torn down
    // and the client sees a failed download. A user cancelling is routine;
    // anything else (e.g. the database failing mid-export) is a real error.
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ERR_STREAM_PREMATURE_CLOSE") logger.warn({ userId: req.userId }, "csv export cancelled by client");
    else logger.error({ err, userId: req.userId }, "csv export failed mid-stream");
  }
}
