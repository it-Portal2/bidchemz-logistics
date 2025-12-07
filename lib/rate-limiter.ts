import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    const key = `${ip}:${req.url}`;
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > finalConfig.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      (finalConfig.maxRequests - store[key].count).toString()
    );
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

    return next();
  };
}

// Cleanup old entries every hour
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    });
  },
  60 * 60 * 1000
);
