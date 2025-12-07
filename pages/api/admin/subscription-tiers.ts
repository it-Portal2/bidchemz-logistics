import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, SubscriptionTier } from '@prisma/client';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.user!.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Only admins can manage subscription tiers' });
  }

  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (userId) {
        const capability = await prisma.partnerCapability.findUnique({
          where: { userId: String(userId) },
          select: { subscriptionTier: true },
        });
        return res.status(200).json({ subscriptionTier: capability?.subscriptionTier || 'FREE' });
      }

      const tiers = await prisma.partnerCapability.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      });

      res.status(200).json({ tiers });
    } catch (error) {
      console.error('Error fetching tiers:', error);
      res.status(500).json({ error: 'Failed to fetch subscription tiers' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { userId, subscriptionTier } = req.body;

      if (!userId || !subscriptionTier) {
        return res.status(400).json({ error: 'User ID and subscription tier required' });
      }

      const validTiers = Object.values(SubscriptionTier);
      if (!validTiers.includes(subscriptionTier)) {
        return res.status(400).json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` });
      }

      // Use upsert to handle partners who don't have capability row yet
      const updated = await prisma.partnerCapability.upsert({
        where: { userId },
        update: { subscriptionTier },
        create: {
          userId,
          subscriptionTier,
          serviceTypes: [],
          dgClasses: [],
          productCategories: [],
          serviceCities: [],
          serviceStates: [],
          serviceCountries: [],
          fleetTypes: [],
          hasWarehouse: false,
          warehouseLocations: [],
          temperatureControlled: false,
          packagingCapabilities: [],
          certifications: [],
        },
        select: { userId: true, subscriptionTier: true },
      });

      res.status(200).json({
        message: 'Subscription tier updated',
        updated,
      });
    } catch (error) {
      console.error('Error updating tier:', error);
      res.status(500).json({ error: 'Failed to update subscription tier' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
