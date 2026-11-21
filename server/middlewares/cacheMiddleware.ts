import { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../config/redis.js";

export const cacheMiddleware = (ttlSeconds = 300, keyPrefix = "route") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      next();
      return;
    }

    try {
      const cacheKey = `cache:${keyPrefix}:${req.originalUrl || req.url}`;
      const cached = await getCache(cacheKey);

      if (cached) {
        res.setHeader("X-Cache-Status", "HIT");
        res.json(cached);
        return;
      }

      res.setHeader("X-Cache-Status", "MISS");

      // Intercept res.json
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
};
