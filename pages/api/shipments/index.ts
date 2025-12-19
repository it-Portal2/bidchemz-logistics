import { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { UserRole, ShipmentStatus } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Admin sees all shipments, partners and traders see only their relevant shipments
      const where: any = {};

      if (req.user!.role === UserRole.LOGISTICS_PARTNER) {
        where.offer = {
          partner: {
            id: req.user!.userId,
          },
        };
      } else if (req.user!.role === UserRole.TRADER) {
        where.quote = {
          traderId: req.user!.userId,
        };
      }

      const shipments = await prisma.shipment.findMany({
        where,
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              cargoName: true,
              pickupCity: true,
              pickupAddress: true,
              pickupState: true,
              pickupPincode: true,
              pickupContactName: true,
              pickupContactPhone: true,
              deliveryCity: true,
              deliveryAddress: true,
              deliveryState: true,
              deliveryPincode: true,
              deliveryContactName: true,
              deliveryContactPhone: true,
              bidId: true, // BidChemz bid reference
              counterpartyId: true, // BidChemz counterparty reference
            },
          },
          offer: {
            select: {
              id: true,
              price: true,
              partner: {
                select: {
                  id: true,
                  companyName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({ shipments });
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  } else if (req.method === "POST") {
    try {
      if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
        return res.status(403).json({
          error: "Only logistics partners can create shipments",
        });
      }

      const { quoteId, offerId } = req.body;

      if (!quoteId || !offerId) {
        return res.status(400).json({
          error: "Missing required fields: quoteId, offerId",
        });
      }

      // Fetch offer to get transit days
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        select: {
          transitDays: true,
          quote: {
            select: { pickupCity: true },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Calculate estimated delivery date
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(
        estimatedDelivery.getDate() + offer.transitDays
      );

      // Initial tracking event
      const initialEvent = {
        status: ShipmentStatus.BOOKED,
        location: offer.quote.pickupCity,
        timestamp: new Date().toISOString(),
        description: "Shipment booked via BidChemz Logistics",
      };

      const shipment = await prisma.shipment.create({
        data: {
          shipmentNumber: `SHIP-${Date.now()}`,
          quoteId,
          offerId,
          status: ShipmentStatus.BOOKED,
          estimatedDelivery,
          trackingEvents: [initialEvent],
          statusUpdates: [initialEvent],
        },
        include: {
          quote: true,
          offer: true,
        },
      });

      res.status(201).json({ shipment });
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
