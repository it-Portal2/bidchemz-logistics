import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, TransactionType } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
        return res.status(403).json({
          error: 'Only logistics partners can access wallet',
        });
      }

      const wallet = await prisma.leadWallet.findUnique({
        where: { userId: req.user!.userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      res.status(200).json({ wallet });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  } else if (req.method === 'POST') {
    return res.status(405).json({ 
      error: 'Direct wallet recharge is disabled. Please use /api/payment-requests to submit a recharge request for admin approval.' 
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
