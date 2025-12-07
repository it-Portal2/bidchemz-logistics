import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../offers/index';

// Versioned API route - delegates to main handler internally (NOT via HTTP fetch)
export default async function v1Handler(req: NextApiRequest, res: NextApiResponse) {
  // Directly call the main handler - maintains all auth context, middleware, and security
  return handler(req, res);
}
