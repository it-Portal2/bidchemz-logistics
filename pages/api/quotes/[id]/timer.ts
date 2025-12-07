import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getRemainingTime, extendQuoteTimer } from '@/lib/quote-timer';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid quote ID' });
  }

  if (req.method === 'GET') {
    try {
      const quote = await prisma.quote.findUnique({
        where: { id },
        select: {
          id: true,
          traderId: true,
          expiresAt: true,
          status: true,
        },
      });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const isTrader = quote.traderId === req.user!.userId;
      const isAdmin = req.user!.role === UserRole.ADMIN;

      if (!isTrader && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!quote.expiresAt) {
        return res.status(400).json({ error: 'Quote does not have a timer' });
      }

      const timerInfo = await getRemainingTime(id);

      res.status(200).json({
        timer: {
          expiresAt: timerInfo.expiresAt,
          remainingMinutes: timerInfo.remainingMinutes,
          hasExpired: timerInfo.hasExpired,
        },
      });
    } catch (error) {
      console.error('Error fetching quote timer:', error);
      res.status(500).json({ error: 'Failed to fetch quote timer' });
    }
  } else if (req.method === 'POST') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only admins can extend quote timers',
        });
      }

      const { additionalMinutes } = req.body;

      if (
        !additionalMinutes ||
        typeof additionalMinutes !== 'number' ||
        additionalMinutes <= 0
      ) {
        return res.status(400).json({
          error: 'Invalid additional minutes',
        });
      }

      const newExpiresAt = await extendQuoteTimer(id, additionalMinutes);

      res.status(200).json({
        message: 'Quote timer extended successfully',
        newExpiresAt,
      });
    } catch (error) {
      console.error('Error extending quote timer:', error);
      res.status(500).json({ error: 'Failed to extend quote timer' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
