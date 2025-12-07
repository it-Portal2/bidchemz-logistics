import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { calculateLeadCost } from '@/lib/pricing-engine';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
      return res.status(403).json({ error: 'Only partners can check lead cost' });
    }

    const { quoteId } = req.body;
    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID required' });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        hazardClass: true,
        quantity: true,
        pickupState: true,
        deliveryState: true,
        preferredVehicleType: true,
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const partnerCapability = await prisma.partnerCapability.findUnique({
      where: { userId: req.user!.userId },
      select: { subscriptionTier: true },
    });

    const subscriptionTier = partnerCapability?.subscriptionTier || 'FREE';

    const leadCost = await calculateLeadCost({
      hazardClass: quote.hazardClass,
      quantity: quote.quantity,
      pickupState: quote.pickupState,
      deliveryState: quote.deliveryState,
      vehicleType: quote.preferredVehicleType || [],
      subscriptionTier,
      isUrgent: false,
    });

    // Get wallet balance - create if doesn't exist
    let wallet = await prisma.leadWallet.findUnique({
      where: { userId: req.user!.userId },
      select: { balance: true },
    });

    // Create wallet if missing
    if (!wallet) {
      wallet = await prisma.leadWallet.create({
        data: {
          userId: req.user!.userId,
          balance: 0,
          currency: 'INR',
          lowBalanceAlert: true,
          alertThreshold: 1000,
        },
        select: { balance: true },
      });
    }

    res.status(200).json({
      quoteId,
      leadCost: parseFloat(leadCost.toFixed(2)),
      walletBalance: wallet?.balance || 0,
      hasInsufficientBalance: (wallet?.balance || 0) < leadCost,
      subscriptionTier,
    });
  } catch (error) {
    console.error('Error calculating lead cost:', error);
    res.status(500).json({ error: 'Failed to calculate lead cost' });
  }
}

export default withAuth(handler);
