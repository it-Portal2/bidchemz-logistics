import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid shipment ID' });
  }

  if (req.method === 'PATCH') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can update shipments' });
      }

      const { status, currentLocation, statusUpdates, trackingEvents } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (currentLocation) updateData.currentLocation = currentLocation;
      if (statusUpdates) updateData.statusUpdates = statusUpdates;
      if (trackingEvents) updateData.trackingEvents = trackingEvents;

      const updatedShipment = await prisma.shipment.update({
        where: { id },
        data: updateData,
        include: {
          quote: true,
          offer: { include: { partner: { select: { id: true, companyName: true, email: true } } } },
        },
      });

      // Trigger SHIPMENT_STATUS_UPDATED webhook if status changed
      if (status) {
        try {
          const { sendWebhook } = await import('@/lib/webhook');
          await sendWebhook(
            process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
            'SHIPMENT_STATUS_UPDATED',
            {
              shipmentId: updatedShipment.id,
              shipmentNumber: updatedShipment.shipmentNumber,
              newStatus: status,
              currentLocation: currentLocation || updatedShipment.currentLocation,
              quoteId: updatedShipment.quoteId,
              partnerId: updatedShipment.offer.partnerId,
            }
          ).catch(err => console.error('Webhook error:', err));
        } catch (webhookError) {
          console.error('Error sending webhook:', webhookError);
        }
      }

      res.status(200).json({ shipment: updatedShipment });
    } catch (error) {
      console.error('Error updating shipment:', error);
      res.status(500).json({ error: 'Failed to update shipment' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can delete shipments' });
      }

      await prisma.shipment.delete({ where: { id } });
      res.status(200).json({ message: 'Shipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting shipment:', error);
      res.status(500).json({ error: 'Failed to delete shipment' });
    }
  } else if (req.method === 'GET') {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
          quote: true,
          offer: { include: { partner: true } },
        },
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.status(200).json({ shipment });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.status(500).json({ error: 'Failed to fetch shipment' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
