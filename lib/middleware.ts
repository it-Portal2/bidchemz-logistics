import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

export function withAuth(handler: AuthenticatedHandler, allowedRoles?: UserRole[]) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    req.user = payload;
    return handler(req, res);
  };
}

export function requireRole(...roles: UserRole[]) {
  return (handler: AuthenticatedHandler) => withAuth(handler, roles);
}

export async function authenticateUser(req: NextApiRequest): Promise<JWTPayload | null> {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}
