import { NextApiRequest, NextApiResponse } from 'next';
import { setSecurityHeaders } from './security-headers';
import { rateLimit } from './rate-limiter';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => void;

export function withSecurityAndRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: { maxRequests?: number; windowMs?: number } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    setSecurityHeaders(res);

    const { maxRequests = 100, windowMs = 60000 } = options;

    await new Promise((resolve) => {
      rateLimit({ maxRequests, windowMs })(req, res, resolve as any);
    });

    if (res.headersSent) {
      return;
    }

    return handler(req, res);
  };
}
