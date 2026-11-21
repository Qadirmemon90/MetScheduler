import RedisPkg from "ioredis";

// Handle both ES module and CommonJS default exports cleanly
const RedisClientClass: any = (RedisPkg as any).default || RedisPkg;

// In-memory fallback cache
interface MemoryCacheItem {
  value: string;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheItem>();

let redisClient: any = null;
let isRedisReady = false;
let redisErrorLogged = false;

const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || "6379"}`;

try {
  redisClient = new RedisClientClass(redisUrl, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      if (times > 3) {
        if (!redisErrorLogged) {
          console.warn("[Cache] Redis not available, seamlessly running in in-memory cache mode.");
          redisErrorLogged = true;
        }
        return null;
      }
      return Math.min(times * 500, 2000);
    },
  });

  redisClient.on("ready", () => {
    isRedisReady = true;
    redisErrorLogged = false;
    console.log("[Cache] Connected to Redis successfully.");
  });

  redisClient.on("error", (err: any) => {
    isRedisReady = false;
    if (!redisErrorLogged) {
      console.warn(`[Cache] Redis connection notice: ${err?.message || "Unavailable"}. Using in-memory cache.`);
      redisErrorLogged = true;
    }
  });

  redisClient.on("close", () => {
    isRedisReady = false;
  });

  // Try initial quick connect asynchronously without blocking app startup
  redisClient.connect().catch(() => {
    isRedisReady = false;
    if (!redisErrorLogged) {
      console.warn("[Cache] Initial Redis connection not active. In-memory cache is ready.");
      redisErrorLogged = true;
    }
  });
} catch (err: any) {
  isRedisReady = false;
  console.warn(`[Cache] Failed to initialize Redis client: ${err?.message}. In-memory cache active.`);
}

export const getCache = async <T = any>(key: string): Promise<T | null> => {
  try {
    if (isRedisReady && redisClient) {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    }
  } catch {
    // fallback to memory
  }

  // Memory fallback
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value) as T;
  } catch {
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  ttlSeconds = 300,
): Promise<void> => {
  const serialized = JSON.stringify(value);

  if (isRedisReady && redisClient) {
    try {
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, "EX", ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
      return;
    } catch {
      // fallback to memory
    }
  }

  // Memory fallback
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Infinity;
  memoryCache.set(key, { value: serialized, expiresAt });
};

export const delCache = async (key: string): Promise<void> => {
  if (isRedisReady && redisClient) {
    try {
      await redisClient.del(key);
    } catch {
      // fallback
    }
  }
  memoryCache.delete(key);
};

export const delCachePattern = async (pattern: string): Promise<void> => {
  if (isRedisReady && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {
      // fallback
    }
  }

  // Memory fallback matching
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const k of memoryCache.keys()) {
    if (regex.test(k)) {
      memoryCache.delete(k);
    }
  }
};

export const flushCache = async (): Promise<void> => {
  if (isRedisReady && redisClient) {
    try {
      await redisClient.flushdb();
    } catch {
      // fallback
    }
  }
  memoryCache.clear();
};

export const rateLimitIncrement = async (
  key: string,
  windowSeconds = 60,
): Promise<{ count: number; ttl: number }> => {
  if (isRedisReady && redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      const ttl = await redisClient.ttl(key);
      return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    } catch {
      // fallback
    }
  }

  // In-memory rate limiting
  const now = Date.now();
  const item = memoryCache.get(key);
  if (!item || now > item.expiresAt) {
    memoryCache.set(key, { value: "1", expiresAt: now + windowSeconds * 1000 });
    return { count: 1, ttl: windowSeconds };
  }

  const currentCount = (parseInt(item.value, 10) || 0) + 1;
  const remainingTtl = Math.max(1, Math.round((item.expiresAt - now) / 1000));
  memoryCache.set(key, { value: currentCount.toString(), expiresAt: item.expiresAt });
  return { count: currentCount, ttl: remainingTtl };
};

export const getCacheStatus = async () => {
  const memoryKeysCount = memoryCache.size;
  if (isRedisReady && redisClient) {
    try {
      const dbSize = await redisClient.dbsize();
      return {
        connected: true,
        mode: "redis" as const,
        url: redisUrl.replace(/\/\/[^@]*@/, "//***@"),
        keysCount: dbSize,
        memoryFallbackKeys: memoryKeysCount,
      };
    } catch {
      // fallback
    }
  }

  return {
    connected: false,
    mode: "memory" as const,
    url: redisUrl.replace(/\/\/[^@]*@/, "//***@"),
    keysCount: memoryKeysCount,
    memoryFallbackKeys: memoryKeysCount,
  };
};

export default {
  getCache,
  setCache,
  delCache,
  delCachePattern,
  flushCache,
  rateLimitIncrement,
  getCacheStatus,
};
