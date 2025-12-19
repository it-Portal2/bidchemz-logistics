import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const WEBHOOK_SECRET =
  process.env.BIDCHEMZ_WEBHOOK_SECRET || "bidchemz-webhook-secret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate webhook secret
    const providedSecret = req.headers["x-webhook-secret"] as string;
    if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
      console.log("[Internal API] Invalid or missing X-Webhook-Secret");
      return res.status(401).json({ error: "Unauthorized: Invalid secret" });
    }

    // Get user short_id from header
    const userShortId = req.headers["x-user-short-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    console.log(`[Internal API] Request for user: ${userShortId || userEmail}`);

    // Build where clause to filter shipments
    const where: any = {};

    if (userShortId) {
      // Find user by shortId
      const user = await prisma.user.findFirst({
        where: { shortId: userShortId },
      });

      if (user) {
        // Filter shipments where quote belongs to this trader
        where.quote = {
          traderId: user.id,
        };
      } else {
        console.log(`[Internal API] User not found: ${userShortId}`);
        // Return empty if user not found
        return res.status(200).json({ shipments: [] });
      }
    } else if (userEmail) {
      // Fallback to email lookup
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
        where.quote = {
          traderId: user.id,
        };
      } else {
        console.log(`[Internal API] User not found by email: ${userEmail}`);
        return res.status(200).json({ shipments: [] });
      }
    } else {
      // No user filter provided - return error (security measure)
      return res
        .status(400)
        .json({ error: "Missing X-User-Short-Id or X-User-Email header" });
    }

    // Fetch shipments with same structure as /api/shipments
    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            cargoName: true,
            casNumber: true,
            quantity: true,
            quantityUnit: true,
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

    console.log(
      `[Internal API] Returning ${shipments.length} shipments for user: ${
        userShortId || userEmail
      }`
    );

    // Map shipments to ensure correct field names for BidChemz
    const mappedShipments = shipments.map((s) => ({
      ...s,
      booked_at: s.createdAt, // Explicitly map createdAt to booked_at
      pickup_date: s.actualPickupDate, // Alias for easier sync
      delivery_date: s.actualDeliveryDate, // Alias for easier sync
      estimated_delivery: s.estimatedDelivery, // Ensure snake_case for BidChemz
      tracking_events: s.trackingEvents, // Ensure snake_case if expected, though default is camelCase
    }));

    res.status(200).json({ shipments: mappedShipments });
  } catch (error) {
    console.error("[Internal API] Error fetching shipments:", error);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
}
