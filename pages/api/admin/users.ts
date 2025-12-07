import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { setSecurityHeaders } from '@/lib/security-headers';
import { rateLimit } from '@/lib/rate-limiter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setSecurityHeaders(res);

  const rateLimitResult = await new Promise((resolve) => {
    rateLimit({ maxRequests: 50, windowMs: 60000 })(req, res, resolve as any);
  });

  if (rateLimitResult) return;

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  if (req.method === 'GET') {
    const { filter } = req.query;

    const where: any = {};
    if (filter && filter !== 'all') {
      where.role = filter;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        companyName: true,
        phone: true,
        gstin: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({ users });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
