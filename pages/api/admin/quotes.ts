import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getPaginationParams, buildPrismaOrderBy, buildPrismaSkipTake, calculatePagination } from '@/lib/pagination';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query);
      const { status, search } = req.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { quoteNumber: { contains: search as string, mode: 'insensitive' } },
          { cargoName: { contains: search as string, mode: 'insensitive' } },
          { trader: { companyName: { contains: search as string, mode: 'insensitive' } } },
        ];
      }

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

      return res.status(200).json({
        quotes,
        pagination: calculatePagination(page, limit, total),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin quotes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
