import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { getPaginationParams, buildPrismaOrderBy, buildPrismaSkipTake, calculatePagination } from '@/lib/pagination';
import { cacheKey, getOrSetCache, cache } from '@/lib/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query);
    const { status } = req.query;

    const where: any = {};

    if (user.role === 'TRADER') {
      where.traderId = user.userId;
    }

    if (status) {
      where.status = status;
    }

    const cacheKeyStr = cacheKey('quotes', user.userId, page, limit, sortBy, sortOrder, status || 'all');

    const result = await getOrSetCache(
      cacheKeyStr,
      async () => {
        const [quotes, total] = await Promise.all([
          prisma.quote.findMany({
            where,
            include: {
              trader: {
                select: {
                  id: true,
                  email: true,
                  companyName: true,
                },
              },
              offers: {
                select: {
                  id: true,
                  partnerId: true,
                  price: true,
                  status: true,
                },
              },
            },
            orderBy: buildPrismaOrderBy(sortBy, sortOrder),
            ...buildPrismaSkipTake(page, limit),
          }),
          prisma.quote.count({ where }),
        ]);

        return {
          quotes,
          pagination: calculatePagination(page, limit, total),
        };
      },
      60000
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Paginated quotes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
