import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import { calculateLeadCost, getPricingBreakdown } from '@/lib/pricing-engine';
import { UserRole, SubscriptionTier } from '@prisma/client';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== UserRole.LOGISTICS_PARTNER) {
      return res.status(403).json({ error: 'Only logistics partners can calculate lead costs' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get partner's subscription tier
    const partnerCapability = await prisma.partnerCapability.findUnique({
      where: { userId: user.userId },
    });

    const subscriptionTier = partnerCapability?.subscriptionTier || SubscriptionTier.FREE;

    // Calculate lead cost with breakdown
    const breakdown = await getPricingBreakdown({
      hazardClass: quote.hazardClass,
      quantity: quote.quantity,
      pickupState: quote.pickupState,
      deliveryState: quote.deliveryState,
      vehicleType: quote.preferredVehicleType,
      subscriptionTier,
      isUrgent: false,
    });

    return res.status(200).json({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      estimatedLeadCost: breakdown.finalCost,
      subscriptionTier,
      breakdown: {
        basePrice: breakdown.basePrice,
        hazardMultiplier: breakdown.hazardMultiplier,
        distanceMultiplier: breakdown.distanceMultiplier,
        quantityMultiplier: breakdown.quantityMultiplier,
        vehicleMultiplier: breakdown.vehicleMultiplier,
        urgencyMultiplier: breakdown.urgencyMultiplier,
        tierDiscount: breakdown.tierDiscount,
        explanation: breakdown.breakdown,
      },
    });
  } catch (error) {
    console.error('Calculate lead cost error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
