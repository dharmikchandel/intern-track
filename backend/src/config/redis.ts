import { Redis } from "ioredis";
import { env } from "./env.js";

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
  console.log("✅ Redis: Connecting...");
});

redis.on("ready", () => {
  console.log("✅ Redis: Connected and ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.log("🔌 Redis: Connection closed");
});

redis.on("reconnecting", (delay: number) => {
  console.log(`🔄 Redis: Reconnecting in ${delay}ms`);
});

redis.on("end", () => {
  console.log("👋 Redis: Connection ended");
});

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    console.log("✅ Redis: Disconnected gracefully");
  } catch (error) {
    console.error("❌ Redis: Error during disconnect", error);
    redis.disconnect();
  }
}

// Health check helper
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    console.error("❌ Redis health check failed:", error);
    return false;
  }
}