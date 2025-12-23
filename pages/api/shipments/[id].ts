import { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { UserRole } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid shipment ID" });
  }

  if (req.method === "PATCH") {
    try {
      // Fetch shipment with partner info
      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: { offer: { select: { partnerId: true } } },
      });

      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      // Allow ADMIN or the partner who owns this shipment
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const isPartnerOwner =
        req.user!.role === UserRole.LOGISTICS_PARTNER &&
        shipment.offer.partnerId === req.user!.userId;

      if (!isAdmin && !isPartnerOwner) {
        return res
          .status(403)
          .json({ error: "You can only update your own shipments" });
      }

      const { status, currentLocation, notes } = req.body;

      const updateData: any = {};
      if (status) {
        updateData.status = status;
      }
      if (currentLocation) updateData.currentLocation = currentLocation;

      // Record status update with timestamp
      if (status || currentLocation) {
        const newEvent = {
          timestamp: new Date().toISOString(),
          status: status || shipment.status,
          location: currentLocation || shipment.currentLocation || "",
          description:
            notes || `Status updated to ${status || shipment.status}`,
          updatedBy: req.user!.userId,
        };

        // Append to tracking events
        const existingEvents = (shipment.trackingEvents as any[]) || [];
        updateData.trackingEvents = [...existingEvents, newEvent];

        // Append to status updates
        const existingUpdates = (shipment.statusUpdates as any[]) || [];
        updateData.statusUpdates = [...existingUpdates, newEvent];
      }

      // Update actual dates based on status
      if (status === "PICKUP_SCHEDULED" || status === "IN_TRANSIT") {
        updateData.actualPickupDate = new Date();
      }
      if (status === "DELIVERED") {
        updateData.actualDeliveryDate = new Date();
      }

      const updatedShipment = await prisma.shipment.update({
        where: { id },
        data: updateData,
        include: {
          quote: true,
          offer: {
            include: {
              partner: { select: { id: true, companyName: true, email: true } },
            },
          },
        },
      });

      // Trigger SHIPMENT_STATUS_UPDATED webhook if status changed
      if (status) {
        try {
          const { sendWebhook } = await import("@/lib/webhook");
          await sendWebhook(
            process.env.WEBHOOK_URL || "http://localhost:5000/api/webhooks",
            "SHIPMENT_STATUS_UPDATED",
            {
              shipmentId: updatedShipment.id,
              shipmentNumber: updatedShipment.shipmentNumber,
              newStatus: status,
              currentLocation:
                currentLocation || updatedShipment.currentLocation,
              quoteId: updatedShipment.quoteId,
              partnerId: updatedShipment.offer.partnerId,
            }
          ).catch((err) => console.error("Webhook error:", err));
        } catch (webhookError) {
          console.error("Error sending webhook:", webhookError);
        }

        // Phase 21A: Send webhook to BidChemz Main (if quote came from BidChemz)
        if (updatedShipment.quote?.bidId) {
          try {
            // Use centralized URL config based on MODE
            const { BIDCHEMZ_WEBHOOK_URL } = await import(
              "@/lib/config/appUrls"
            );
            const bidChemzWebhookUrl = BIDCHEMZ_WEBHOOK_URL;

            const webhookSecret =
              process.env.BIDCHEMZ_WEBHOOK_SECRET ||
              process.env.WEBHOOK_SECRET ||
              "bidchemz-webhook-secret";

            const bidChemzPayload = {
              bid_short_id: updatedShipment.quote.bidId,
              logistics_shipment_id: updatedShipment.id,
              status: status,
              origin_city: updatedShipment.quote.pickupCity,
              destination_city: updatedShipment.quote.deliveryCity,
              estimated_delivery: updatedShipment.estimatedDelivery,
              tracking_events: updatedShipment.trackingEvents,
              tracking_url: `${process.env.NEXT_PUBLIC_APP_URL ||
                "https://logistics.bidchemz.com"
                }/trader/shipments/${updatedShipment.id}`,
            };

            console.log(`[BidChemz Webhook] Sending to: ${bidChemzWebhookUrl}`);
            console.log(`[BidChemz Webhook] Payload:`, bidChemzPayload);

            await fetch(bidChemzWebhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Secret": webhookSecret,
              },
              body: JSON.stringify(bidChemzPayload),
            })
              .then(async (response) => {
                if (!response.ok) {
                  console.error(
                    `[BidChemz Webhook] Failed: ${response.status}`
                  );
                } else {
                  console.log(
                    `[BidChemz Webhook] Success for bid: ${updatedShipment.quote?.bidId}`
                  );
                }
              })
              .catch((err) => console.error("[BidChemz Webhook] Error:", err));
          } catch (bidChemzWebhookError) {
            console.error("[BidChemz Webhook] Error:", bidChemzWebhookError);
          }
        }
      }

      // 🔔 Notify Trader about shipment update
      if (status || currentLocation) {
        try {
          await prisma.notification.create({
            data: {
              userId: updatedShipment.quote.traderId,
              title: `Shipment Update: ${updatedShipment.shipmentNumber}`,
              message: `Shipment updated to ${status || updatedShipment.status}${currentLocation ? ` at ${currentLocation}` : ""}.`,
              priority: "MEDIUM",
              type: "SHIPMENT_UPDATE",
            },
          });
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
        }
      }

      res.status(200).json({ shipment: updatedShipment });
    } catch (error) {
      console.error("Error updating shipment:", error);
      res.status(500).json({ error: "Failed to update shipment" });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res
          .status(403)
          .json({ error: "Only admins can delete shipments" });
      }

      await prisma.shipment.delete({ where: { id } });
      res.status(200).json({ message: "Shipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipment:", error);
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  } else if (req.method === "GET") {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
          quote: true,
          offer: { include: { partner: true } },
        },
      });

      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      res.status(200).json({ shipment });
    } catch (error) {
      console.error("Error fetching shipment:", error);
      res.status(500).json({ error: "Failed to fetch shipment" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
