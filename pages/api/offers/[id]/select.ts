import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, OfferStatus, QuoteStatus, LeadType, TransactionType } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  try {
    if (req.user!.role !== UserRole.TRADER) {
      return res.status(403).json({
        error: 'Only traders can select offers',
      });
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        quote: true,
        partner: {
          include: {
            leadWallet: true,
            partnerCapability: true,
          },
        },
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.quote.traderId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (offer.status !== OfferStatus.PENDING) {
      return res.status(400).json({ error: 'Offer is not available for selection' });
    }

    const wallet = offer.partner.leadWallet;

    if (!wallet) {
      return res.status(400).json({
        error: 'Partner does not have a lead wallet',
      });
    }

    const leadCost = calculateLeadCost(offer);

    if (wallet.balance < leadCost) {
      return res.status(400).json({
        error: 'Partner has insufficient lead wallet balance',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.leadWallet.findUnique({
        where: { id: wallet.id },
      });

      if (!currentWallet || currentWallet.balance < leadCost) {
        throw new Error('Insufficient wallet balance');
      }

      await tx.offer.update({
        where: { id: offer.id },
        data: {
          status: OfferStatus.ACCEPTED,
          isSelected: true,
          selectedAt: new Date(),
        },
      });

      await tx.offer.updateMany({
        where: {
          quoteId: offer.quoteId,
          id: { not: offer.id },
          status: OfferStatus.PENDING,
        },
        data: {
          status: OfferStatus.REJECTED,
        },
      });

      await tx.quote.update({
        where: { id: offer.quoteId },
        data: {
          status: QuoteStatus.SELECTED,
        },
      });

      await tx.leadWallet.update({
        where: { id: wallet.id },
        data: {
          balance: currentWallet.balance - leadCost,
        },
      });

      const leadTransaction = await tx.leadTransaction.create({
        data: {
          walletId: wallet.id,
          offerId: offer.id,
          transactionType: TransactionType.DEBIT,
          amount: leadCost,
          description: `Lead charge for quote ${offer.quote.quoteNumber}`,
          leadId: `LEAD-${Date.now()}`,
          leadType: offer.partner.partnerCapability?.subscriptionTier === 'PREMIUM'
            ? LeadType.EXCLUSIVE
            : LeadType.SHARED,
          leadCost,
          creditsDeducted: leadCost,
          hazardCategory: offer.quote.hazardClass,
          quantity: offer.quote.quantity,
        },
      });

      const shipmentNumber = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const shipment = await tx.shipment.create({
        data: {
          shipmentNumber,
          quoteId: offer.quoteId,
          offerId: offer.id,
          statusUpdates: [],
          trackingEvents: [],
        },
      });

      return { offer, leadTransaction, shipment };
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        quoteId: offer.quoteId,
        action: 'SELECT_OFFER',
        entity: 'OFFER',
        entityId: offer.id,
        changes: {
          offerId: offer.id,
          partnerId: offer.partnerId,
          leadCost,
        },
      },
    });

    // Trigger webhooks for offer selection, lead assignment, and shipment booking
    try {
      const { sendWebhook } = await import('@/lib/webhook');
      
      // QUOTE_OFFER_SELECTED webhook
      await sendWebhook(
        process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
        'QUOTE_OFFER_SELECTED',
        {
          quoteId: offer.quoteId,
          quoteNumber: offer.quote.quoteNumber,
          offerId: offer.id,
          partnerId: offer.partnerId,
          partnerCompany: offer.partner.companyName,
          offerPrice: offer.price,
          selectedBy: req.user!.userId,
        }
      ).catch(err => console.error('Webhook error:', err));

      // LEAD_ASSIGNED webhook
      await sendWebhook(
        process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
        'LEAD_ASSIGNED',
        {
          leadId: result.leadTransaction.leadId,
          partnerId: offer.partnerId,
          quoteId: offer.quoteId,
          leadCost,
          leadType: result.leadTransaction.leadType,
          transactionId: result.leadTransaction.id,
        }
      ).catch(err => console.error('Webhook error:', err));

      // SHIPMENT_BOOKED webhook
      await sendWebhook(
        process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
        'SHIPMENT_BOOKED',
        {
          shipmentId: result.shipment.id,
          shipmentNumber: result.shipment.shipmentNumber,
          quoteId: offer.quoteId,
          offerId: offer.id,
          partnerId: offer.partnerId,
        }
      ).catch(err => console.error('Webhook error:', err));
    } catch (webhookError) {
      console.error('Error sending webhooks:', webhookError);
    }

    res.status(200).json({
      message: 'Offer selected successfully',
      shipment: result.shipment,
    });
  } catch (error) {
    console.error('Error selecting offer:', error);
    res.status(500).json({ error: 'Failed to select offer' });
  }
}

function calculateLeadCost(offer: any): number {
  let baseCost = 500;

  if (offer.quote.isHazardous) {
    baseCost *= 1.5;
  }

  if (offer.quote.quantity > 20) {
    baseCost *= 1.3;
  }

  if (offer.partner.partnerCapability?.subscriptionTier === 'PREMIUM') {
    baseCost *= 2;
  }

  return Math.round(baseCost);
}

export default withAuth(handler);
