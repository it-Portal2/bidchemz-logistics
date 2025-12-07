import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, ShipmentStatus } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid shipment ID' });
  }

  if (req.method === 'GET') {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
          quote: {
            include: {
              trader: {
                select: {
                  id: true,
                  email: true,
                  companyName: true,
                },
              },
            },
          },
          offer: {
            include: {
              partner: {
                select: {
                  id: true,
                  email: true,
                  companyName: true,
                },
              },
            },
          },
          documents: true,
        },
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      const isTrader = req.user!.userId === shipment.quote.traderId;
      const isPartner = req.user!.userId === shipment.offer.partnerId;
      const isAdmin = req.user!.role === UserRole.ADMIN;

      if (!isTrader && !isPartner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.status(200).json({ shipment });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.status(500).json({ error: 'Failed to fetch shipment' });
    }
  } else if (req.method === 'POST') {
    try {
      if (req.user!.role !== UserRole.LOGISTICS_PARTNER && req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only logistics partners and admins can update shipment status',
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
          offer: true,
        },
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      if (req.user!.role === UserRole.LOGISTICS_PARTNER && shipment.offer.partnerId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: not your shipment' });
      }

      const { status, location, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const statusUpdate = {
        timestamp: new Date().toISOString(),
        status,
        location,
        notes,
        updatedBy: req.user!.userId,
      };

      const currentStatusUpdates = Array.isArray(shipment.statusUpdates)
        ? shipment.statusUpdates
        : [];

      const updatedShipment = await prisma.shipment.update({
        where: { id },
        data: {
          status: status as ShipmentStatus,
          currentLocation: location,
          statusUpdates: [...currentStatusUpdates, statusUpdate] as any,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          shipmentId: id,
          action: 'UPDATE_STATUS',
          entity: 'SHIPMENT',
          entityId: id,
          changes: { status, location },
        },
      });

      res.status(200).json({
        shipment: updatedShipment,
        message: 'Shipment status updated successfully',
      });
    } catch (error) {
      console.error('Error updating shipment:', error);
      res.status(500).json({ error: 'Failed to update shipment' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
