import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole, OfferStatus } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const offer = await prisma.offer.findUnique({ where: { id } });
      if (!offer) return res.status(404).json({ error: 'Offer not found' });

      // Partners can edit their own offers if not yet selected
      if (req.user!.role === UserRole.LOGISTICS_PARTNER) {
        if (offer.partnerId !== req.user!.userId) {
          return res.status(403).json({ error: 'Cannot edit other partner offers' });
        }
        if (offer.isSelected) {
          return res.status(400).json({ error: 'Cannot edit selected offers' });
        }
      } else if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { status, price, transitDays, remarks } = req.body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (price !== undefined) updateData.price = price;
      if (transitDays !== undefined) updateData.transitDays = transitDays;
      if (remarks !== undefined) updateData.remarks = remarks;

      const updatedOffer = await prisma.offer.update({
        where: { id },
        data: updateData,
        include: {
          quote: { select: { id: true, quoteNumber: true, cargoName: true } },
          partner: { select: { id: true, email: true, companyName: true } },
        },
      });

      res.status(200).json({ offer: updatedOffer });
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ error: 'Failed to update offer' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const offer = await prisma.offer.findUnique({ where: { id } });
      if (!offer) return res.status(404).json({ error: 'Offer not found' });

      // Only partners can withdraw their own offers, admins can delete
      if (req.user!.role === UserRole.LOGISTICS_PARTNER) {
        if (offer.partnerId !== req.user!.userId) {
          return res.status(403).json({ error: 'Cannot withdraw other partner offers' });
        }
        if (offer.isSelected) {
          return res.status(400).json({ error: 'Cannot withdraw selected offers' });
        }
        // Set status to WITHDRAWN instead of deleting
        await prisma.offer.update({
          where: { id },
          data: { status: OfferStatus.WITHDRAWN },
        });
      } else if (req.user!.role === UserRole.ADMIN) {
        await prisma.offer.delete({ where: { id } });
      } else {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.status(200).json({ message: 'Offer withdrawn/deleted successfully' });
    } catch (error) {
      console.error('Error deleting offer:', error);
      res.status(500).json({ error: 'Failed to delete offer' });
    }
  } else if (req.method === 'GET') {
    try {
      const offer = await prisma.offer.findUnique({
        where: { id },
        include: {
          quote: true,
          partner: { select: { id: true, email: true, companyName: true } },
        },
      });
      if (!offer) return res.status(404).json({ error: 'Offer not found' });
      res.status(200).json({ offer });
    } catch (error) {
      console.error('Error fetching offer:', error);
      res.status(500).json({ error: 'Failed to fetch offer' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
