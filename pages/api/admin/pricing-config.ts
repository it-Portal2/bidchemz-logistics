import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only admins can manage pricing configuration' });
    }

    if (req.method === 'GET') {
      let config = await prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!config) {
        config = await prisma.pricingConfig.create({
          data: {
            isActive: true,
            baseLeadCost: 500,
            hazardNonHazardous: 1.0,
            hazardClass1: 2.5,
            hazardClass2: 1.8,
            hazardClass3: 1.6,
            hazardClass4: 1.5,
            hazardClass5: 1.7,
            hazardClass6: 1.9,
            hazardClass7: 2.0,
            hazardClass8: 1.6,
            hazardClass9: 1.3,
            distanceSameState: 1.0,
            distanceShort: 1.3,
            distanceMedium: 1.6,
            distanceLong: 2.0,
            quantityRanges: [
              { min: 0, max: 10, multiplier: 1.5 },
              { min: 10, max: 50, multiplier: 1.2 },
              { min: 50, max: 100, multiplier: 1.0 },
              { min: 100, max: 500, multiplier: 0.9 },
              { min: 500, max: 999999, multiplier: 0.8 },
            ],
            vehicleTruck: 1.0,
            vehicleContainer: 1.1,
            vehicleTanker: 1.3,
            vehicleIsoTank: 1.5,
            vehicleFlatbed: 1.1,
            vehicleRefrigerated: 1.4,
            urgencyMultiplier: 1.3,
            tierPremiumDiscount: 0.7,
            tierStandardDiscount: 0.85,
            tierFreeDiscount: 1.0,
          },
        });
      }

      return res.status(200).json({ config });
    }

    if (req.method === 'PUT') {
      const {
        baseLeadCost,
        hazardNonHazardous,
        hazardClass1,
        hazardClass2,
        hazardClass3,
        hazardClass4,
        hazardClass5,
        hazardClass6,
        hazardClass7,
        hazardClass8,
        hazardClass9,
        distanceSameState,
        distanceShort,
        distanceMedium,
        distanceLong,
        quantityRanges,
        vehicleTruck,
        vehicleContainer,
        vehicleTanker,
        vehicleIsoTank,
        vehicleFlatbed,
        vehicleRefrigerated,
        urgencyMultiplier,
        tierPremiumDiscount,
        tierStandardDiscount,
        tierFreeDiscount,
      } = req.body;

      await prisma.pricingConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const newConfig = await prisma.pricingConfig.create({
        data: {
          isActive: true,
          baseLeadCost: baseLeadCost || 500,
          hazardNonHazardous: hazardNonHazardous ?? 1.0,
          hazardClass1: hazardClass1 ?? 2.5,
          hazardClass2: hazardClass2 ?? 1.8,
          hazardClass3: hazardClass3 ?? 1.6,
          hazardClass4: hazardClass4 ?? 1.5,
          hazardClass5: hazardClass5 ?? 1.7,
          hazardClass6: hazardClass6 ?? 1.9,
          hazardClass7: hazardClass7 ?? 2.0,
          hazardClass8: hazardClass8 ?? 1.6,
          hazardClass9: hazardClass9 ?? 1.3,
          distanceSameState: distanceSameState ?? 1.0,
          distanceShort: distanceShort ?? 1.3,
          distanceMedium: distanceMedium ?? 1.6,
          distanceLong: distanceLong ?? 2.0,
          quantityRanges: quantityRanges || [
            { min: 0, max: 10, multiplier: 1.5 },
            { min: 10, max: 50, multiplier: 1.2 },
            { min: 50, max: 100, multiplier: 1.0 },
            { min: 100, max: 500, multiplier: 0.9 },
            { min: 500, max: 999999, multiplier: 0.8 },
          ],
          vehicleTruck: vehicleTruck ?? 1.0,
          vehicleContainer: vehicleContainer ?? 1.1,
          vehicleTanker: vehicleTanker ?? 1.3,
          vehicleIsoTank: vehicleIsoTank ?? 1.5,
          vehicleFlatbed: vehicleFlatbed ?? 1.1,
          vehicleRefrigerated: vehicleRefrigerated ?? 1.4,
          urgencyMultiplier: urgencyMultiplier ?? 1.3,
          tierPremiumDiscount: tierPremiumDiscount ?? 0.7,
          tierStandardDiscount: tierStandardDiscount ?? 0.85,
          tierFreeDiscount: tierFreeDiscount ?? 1.0,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'UPDATE_PRICING_CONFIG',
          entity: 'PricingConfig',
          entityId: newConfig.id,
          changes: req.body,
        },
      });

      return res.status(200).json({
        message: 'Pricing configuration updated successfully',
        config: newConfig,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pricing config error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
