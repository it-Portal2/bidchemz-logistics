import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, OfferStatus, SubscriptionTier } from '@prisma/client';
import { calculateLeadCost } from '@/lib/pricing-engine';
import { TransactionType, LeadType } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { quoteId, status } = req.query;

      const where: any = {};

      if (req.user!.role === UserRole.LOGISTICS_PARTNER) {
        where.partnerId = req.user!.userId;
      }

      if (quoteId && typeof quoteId === 'string') {
        where.quoteId = quoteId;
      }

      if (status && typeof status === 'string') {
        where.status = status as OfferStatus;
      }

      const offers = await prisma.offer.findMany({
        where,
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              cargoName: true,
              quantity: true,
              quantityUnit: true,
              pickupCity: true,
              deliveryCity: true,
              cargoReadyDate: true,
            },
          },
          partner: {
            select: {
              id: true,
              email: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({ offers });
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
    }
  } else if (req.method === 'POST') {
    try {
      if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
        return res.status(403).json({
          error: 'Only logistics partners can submit offers',
        });
      }

      const {
        quoteId,
        price,
        transitDays,
        offerValidUntil,
        pickupAvailableFrom,
        insuranceIncluded,
        trackingIncluded,
        customsClearance,
        valueAddedServices,
        termsAndConditions,
        remarks,
      } = req.body;

      if (!quoteId || !price || !transitDays || !offerValidUntil || !pickupAvailableFrom) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
      });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const existingOffer = await prisma.offer.findFirst({
        where: {
          quoteId,
          partnerId: req.user!.userId,
          status: { not: OfferStatus.WITHDRAWN },
        },
      });

      if (existingOffer) {
        return res.status(409).json({
          error: 'You have already submitted an offer for this quote',
        });
      }

      // Get partner's subscription tier
      const partnerCapability = await prisma.partnerCapability.findUnique({
        where: { userId: req.user!.userId },
      });

      const subscriptionTier = partnerCapability?.subscriptionTier || SubscriptionTier.FREE;

      // Calculate lead cost based on quote details
      const leadCost = await calculateLeadCost({
        hazardClass: quote.hazardClass,
        quantity: quote.quantity,
        pickupState: quote.pickupState,
        deliveryState: quote.deliveryState,
        vehicleType: quote.preferredVehicleType || [],
        subscriptionTier,
        isUrgent: false,
      });

      const expiresAt = new Date(offerValidUntil);

      // Use transaction to ensure atomicity - check balance INSIDE transaction to prevent race conditions
      let paymentFailureData: any = null;
      
      const result = await prisma.$transaction(async (tx) => {
        // Get wallet inside transaction with lock
        const wallet = await tx.leadWallet.findUnique({
          where: { userId: req.user!.userId },
        });

        if (!wallet) {
          throw new Error('Lead wallet not found. Please contact support.');
        }

        // Check balance inside transaction
        if (wallet.balance < leadCost) {
          // Store failure data for webhook after transaction
          paymentFailureData = {
            partnerId: req.user!.userId,
            quoteId,
            requiredAmount: leadCost,
            availableBalance: wallet.balance,
            reason: 'Insufficient wallet balance',
          };
          
          throw new Error(`Insufficient wallet balance. Required: ₹${leadCost.toFixed(2)}, Available: ₹${wallet.balance.toFixed(2)}`);
        }

        // Create the offer
        const newOffer = await tx.offer.create({
          data: {
            quoteId,
            partnerId: req.user!.userId,
            price,
            transitDays,
            offerValidUntil: new Date(offerValidUntil),
            pickupAvailableFrom: new Date(pickupAvailableFrom),
            insuranceIncluded: insuranceIncluded || false,
            trackingIncluded: trackingIncluded !== false,
            customsClearance: customsClearance || false,
            valueAddedServices: valueAddedServices || [],
            termsAndConditions,
            remarks,
            expiresAt,
          },
          include: {
            quote: true,
            partner: {
              select: {
                id: true,
                email: true,
                companyName: true,
              },
            },
          },
        });

        // Deduct lead fee from wallet using atomic conditional update to prevent negative balance
        const updateResult = await tx.leadWallet.updateMany({
          where: {
            userId: req.user!.userId,
            balance: {
              gte: leadCost, // Only update if balance is sufficient
            },
          },
          data: {
            balance: {
              decrement: leadCost,
            },
          },
        });

        // If update failed (count = 0), balance was insufficient (race condition caught)
        if (updateResult.count === 0) {
          // Get current balance for webhook
          const currentWallet = await tx.leadWallet.findUnique({
            where: { userId: req.user!.userId },
          });
          
          paymentFailureData = {
            partnerId: req.user!.userId,
            quoteId,
            requiredAmount: leadCost,
            availableBalance: currentWallet?.balance || 0,
            reason: 'Insufficient wallet balance (race condition)',
          };
          
          throw new Error(`Insufficient wallet balance. Another transaction may have reduced your balance. Please check and try again.`);
        }

        // Fetch updated wallet to get new balance
        const updatedWallet = await tx.leadWallet.findUnique({
          where: { userId: req.user!.userId },
        });

        if (!updatedWallet) {
          throw new Error('Wallet not found after update');
        }

        // Create transaction record
        const leadTransaction = await tx.leadTransaction.create({
          data: {
            walletId: wallet.id,
            offerId: newOffer.id,
            transactionType: TransactionType.DEBIT,
            amount: leadCost,
            description: `Lead fee for submitting offer on quote ${quote.quoteNumber}`,
            leadId: quoteId,
            leadType: subscriptionTier === SubscriptionTier.PREMIUM ? LeadType.EXCLUSIVE : LeadType.SHARED,
            leadCost,
            creditsDeducted: leadCost,
            hazardCategory: quote.hazardClass,
            quantity: quote.quantity,
            vehicleType: quote.preferredVehicleType?.[0] || null,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: 'SUBMIT_OFFER',
            entity: 'OFFER',
            entityId: newOffer.id,
            changes: { 
              quoteId, 
              price, 
              leadCost,
              walletBalanceBefore: wallet.balance,
              walletBalanceAfter: updatedWallet.balance,
            },
          },
        });

        return { offer: newOffer, leadCost, newBalance: updatedWallet.balance };
      }).catch(async (error) => {
        // Send LEAD_PAYMENT_FAILED webhook if payment failed (outside transaction)
        if (paymentFailureData) {
          try {
            const { sendWebhook } = await import('@/lib/webhook');
            await sendWebhook(
              process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
              'LEAD_PAYMENT_FAILED',
              paymentFailureData
            ).catch(err => console.error('Webhook error:', err));
          } catch (webhookError) {
            console.error('Error sending webhook:', webhookError);
          }
        }
        throw error;
      });

      // Trigger QUOTE_OFFERS_AVAILABLE webhook
      try {
        const { sendWebhook } = await import('@/lib/webhook');
        const offersCount = await prisma.offer.count({
          where: { quoteId, status: OfferStatus.PENDING },
        });
        
        await sendWebhook(
          process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
          'QUOTE_OFFERS_AVAILABLE',
          {
            quoteId,
            quoteNumber: quote.quoteNumber,
            offersCount,
            latestOfferId: result.offer.id,
            latestOfferPrice: result.offer.price,
          }
        ).catch(err => console.error('Webhook error:', err));
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
      }

      res.status(201).json({
        offer: result.offer,
        message: 'Offer submitted successfully',
        leadCostDeducted: result.leadCost,
        newWalletBalance: result.newBalance,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Insufficient wallet balance')) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Lead wallet not found')) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: 'Failed to create offer' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
