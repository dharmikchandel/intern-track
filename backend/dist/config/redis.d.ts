import { Redis } from "ioredis";
export declare const redis: Redis;
export declare function disconnectRedis(): Promise<void>;
export declare function checkRedisHealth(): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map