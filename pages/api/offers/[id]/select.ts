import { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import {
  UserRole,
  OfferStatus,
  QuoteStatus,
  LeadType,
  TransactionType,
} from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid offer ID" });
  }

  try {
    /* =======================
       AUTHORIZATION
    ======================= */
    if (req.user!.role !== UserRole.TRADER) {
      return res.status(403).json({ error: "Only traders can select offers" });
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
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer.quote.traderId !== req.user!.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (offer.status !== OfferStatus.PENDING) {
      return res.status(400).json({
        error: "Offer already processed",
      });
    }

    const wallet = offer.partner.leadWallet;
    if (!wallet) {
      return res.status(400).json({
        error: "Partner does not have a lead wallet",
      });
    }

    const leadCost = calculateLeadCost(offer);

    /* =======================
       TRANSACTION
    ======================= */
    const result = await prisma.$transaction(async (tx) => {
      //  Lock wallet
      const currentWallet = await tx.leadWallet.findUnique({
        where: { id: wallet.id },
      });

      if (!currentWallet || currentWallet.balance < leadCost) {
        throw new Error("Insufficient wallet balance");
      }

      // Prevent double debit (VERY IMPORTANT)
      const existingTransaction = await tx.leadTransaction.findUnique({
        where: { offerId: offer.id },
      });

      // Update offer
      await tx.offer.update({
        where: { id: offer.id },
        data: {
          status: OfferStatus.ACCEPTED,
          isSelected: true,
          selectedAt: new Date(),
        },
      });

      // Reject other offers
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

      // Update quote
      await tx.quote.update({
        where: { id: offer.quoteId },
        data: {
          status: QuoteStatus.SELECTED,
        },
      });

      // 💰 Deduct wallet ONLY ONCE
      if (!existingTransaction) {
        await tx.leadWallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: leadCost,
            },
          },
        });

        await tx.leadTransaction.create({
          data: {
            walletId: wallet.id,
            offerId: offer.id,
            transactionType: TransactionType.DEBIT,
            amount: leadCost,
            description: `Lead charge for quote ${offer.quote.quoteNumber}`,
            leadId: `LEAD-${Date.now()}`,
            leadType:
              offer.partner.partnerCapability?.subscriptionTier === "PREMIUM"
                ? LeadType.EXCLUSIVE
                : LeadType.SHARED,
            leadCost,
            creditsDeducted: leadCost,
            hazardCategory: offer.quote.hazardClass,
            quantity: offer.quote.quantity,
          },
        });
      }

      // Calculate estimated delivery
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(
        estimatedDelivery.getDate() + offer.transitDays
      );

      // Initial tracking event
      const initialEvent = {
        status: "BOOKED",
        location: offer.quote.pickupCity,
        timestamp: new Date().toISOString(),
        description: "Shipment booked via BidChemz Logistics",
      };

      // 🚚 Create shipment (safe – offerId is unique here)
      const shipment = await tx.shipment.create({
        data: {
          shipmentNumber: `SHP-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)
            .toUpperCase()}`,
          quoteId: offer.quoteId,
          offerId: offer.id,
          status: "BOOKED",
          estimatedDelivery,
          statusUpdates: [initialEvent],
          trackingEvents: [initialEvent],
        },
      });

      return { shipment };
    });

    /* =======================
       AUDIT LOG
    ======================= */
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        quoteId: offer.quoteId,
        action: "SELECT_OFFER",
        entity: "OFFER",
        entityId: offer.id,
        changes: {
          partnerId: offer.partnerId,
          leadCost,
        },
      },
    });

    return res.status(200).json({
      message: "Offer selected successfully",
      shipment: result.shipment,
    });
  } catch (error) {
    console.error("Error selecting offer:", error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Failed to select offer" });
  }
}

/* =======================
   PRICING
======================= */
function calculateLeadCost(offer: any): number {
  let baseCost = 500;

  if (offer.quote.isHazardous) baseCost *= 1.5;
  if (offer.quote.quantity > 20) baseCost *= 1.3;
  if (offer.partner.partnerCapability?.subscriptionTier === "PREMIUM") {
    baseCost *= 2;
  }

  return Math.round(baseCost);
}

export default withAuth(handler);
