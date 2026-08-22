import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

// Configuration with best practices
const redisConfig = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: false,
};

export const redis = new Redis(env.REDIS_URL, redisConfig);

// Event handlers
redis.on("connect", () => {
  logger.info("Redis connecting");
});

redis.on("ready", () => {
  logger.info("Redis connected and ready");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis error");
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

redis.on("reconnecting", (delay: number) => {
  logger.warn({ delayMs: delay }, "Redis reconnecting");
});

redis.on("end", () => {
  logger.warn("Redis connection ended");
});

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info("Redis disconnected gracefully");
  } catch (error) {
    logger.error({ err: error }, "Redis error during disconnect");
    redis.disconnect();
  }
}

// Health check helper
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    logger.error({ err: error }, "Redis health check failed");
    return false;
  }
}