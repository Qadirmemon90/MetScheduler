import { Request, Response, NextFunction } from "express";
import { rateLimitIncrement } from "../config/redis.js";

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowSeconds,
    maxRequests,
    keyPrefix,
    message = "Too many requests. Please try again later.",
    keyGenerator = (req: Request) =>
      req.ip || req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "global",
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientKey = keyGenerator(req);
      const cacheKey = `ratelimit:${keyPrefix}:${clientKey}`;

      const { count, ttl } = await rateLimitIncrement(cacheKey, windowSeconds);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(Date.now() / 1000) + ttl);

      if (count > maxRequests) {
        res.setHeader("Retry-After", ttl);
        res.status(429).json({
          message: `${message} Try again in ${Math.ceil(ttl / 60)} minute(s).`,
          retryAfterSeconds: ttl,
        });
        return;
      }

      next();
    } catch (err) {
      // In case of any rate limit check error, do not block the user
      next();
    }
  };
};

// 5 attempts per 15 minutes for login
export const loginRateLimiter = createRateLimiter({
  windowSeconds: 15 * 60, // 15 mins
  maxRequests: 5,
  keyPrefix: "login",
  message: "Too many failed or repeated login attempts.",
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "ip";
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : "";
    return `${ip}:${email}`;
  },
});

// 3 requests per 15 minutes for password resets
export const forgotPasswordRateLimiter = createRateLimiter({
  windowSeconds: 15 * 60,
  maxRequests: 3,
  keyPrefix: "forgot_pw",
  message: "Too many password reset requests.",
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "ip";
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : "";
    return `${ip}:${email}`;
  },
});

// General public endpoint limiter: 120 requests per minute
export const standardApiLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 120,
  keyPrefix: "api_std",
  message: "Rate limit exceeded. Please slow down.",
});
