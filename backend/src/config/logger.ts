import pino, { type LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

// JSON lines in production (Render captures stdout as-is), pretty-printed
// in development. Level defaults to info in prod, debug locally.
const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
};

if (!isProduction) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
      // One line per log entry instead of pretty-printing every extra field
      // on its own indented line — that's what was cluttering the terminal.
      // Error stack traces are the one exception pino-pretty still breaks
      // out below the line, which is the detail actually worth the space.
      singleLine: true,
      // "message" recolors the log line's own text, "greyMessage" recolors
      // the trailing {reqId, responseTime} context — both otherwise fixed
      // to cyan/gray by pino-pretty and not adjustable any other way.
      customColors: {
        debug: "gray",
        info: "cyanBright",
        warn: "yellowBright",
        error: "redBright",
        message: "white",
        greyMessage: "dim",
      },
      useOnlyCustomProps: false,
    },
  };
}

export const logger = pino(options);
