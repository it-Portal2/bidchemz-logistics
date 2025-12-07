import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { UserRole, QuoteStatus, PaymentRequestStatus } from '@prisma/client';
import { getOrSetCache, cacheKey } from '@/lib/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const stats = await getOrSetCache(
      cacheKey('admin', 'stats'),
      async () => {
        const [
          totalQuotes,
          totalOffers,
          totalShipments,
          activePartners,
          totalTraders,
          totalRevenue,
          pendingPayments,
          quotesByStatus,
          selectedOffers,
        ] = await Promise.all([
          prisma.quote.count(),
          prisma.offer.count(),
          prisma.shipment.count(),
          prisma.user.count({ where: { role: UserRole.LOGISTICS_PARTNER, isActive: true } }),
          prisma.user.count({ where: { role: UserRole.TRADER, isActive: true } }),
          prisma.leadTransaction.aggregate({
            _sum: { amount: true },
            where: { transactionType: 'DEBIT' },
          }),
          prisma.paymentRequest.count({ where: { status: PaymentRequestStatus.PENDING } }),
          prisma.quote.groupBy({
            by: ['status'],
            _count: true,
          }),
          prisma.offer.findMany({
            where: { status: 'ACCEPTED' },
            select: { price: true },
          }),
        ]);

        const quoteStatusMap: Record<string, number> = {};
        quotesByStatus.forEach((item: any) => {
          quoteStatusMap[item.status] = item._count;
        });

        const platformGMV = selectedOffers.reduce((sum, offer) => sum + (offer.price || 0), 0);

        return {
          totalQuotes,
          totalOffers,
          totalShipments,
          activePartners,
          totalTraders,
          totalRevenue: totalRevenue._sum.amount || 0,
          pendingPayments,
          platformGMV,
          quotesByStatus: quoteStatusMap,
        };
      },
      300000
    );

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
