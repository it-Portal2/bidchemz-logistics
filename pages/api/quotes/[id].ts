import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid quote identifier' });
  }

  /* ----------------------------- GET QUOTE ----------------------------- */
  if (req.method === 'GET') {
    try {
      if (![UserRole.TRADER, UserRole.LOGISTICS_PARTNER, UserRole.ADMIN].includes(req.user!.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const quote = await prisma.quote.findFirst({
        where: {
          OR: [
            { id },              // DB UUID
            { quoteNumber: id }, // Business reference
          ],
        },
        include: {
          trader: {
            select: { id: true, email: true, companyName: true },
          },
          offers: {
            select: { id: true, price: true, status: true, partnerId: true },
          },
        },
      });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const isOwner = quote.traderId === req.user!.userId;
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const isPartner = req.user!.role === UserRole.LOGISTICS_PARTNER;

      if (!isOwner && !isAdmin && !isPartner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json({
        quote,
        isExpired: quote.expiresAt ? new Date(quote.expiresAt) < new Date() : false,
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      return res.status(500).json({ error: 'Failed to fetch quote' });
    }
  }

  /* ----------------------------- PATCH QUOTE ----------------------------- */
  if (req.method === 'PATCH') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can update quotes' });
      }

      const { status, paymentTerms, additionalNotes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (additionalNotes !== undefined) updateData.additionalNotes = additionalNotes;

      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: updateData,
        include: {
          trader: { select: { id: true, email: true, companyName: true } },
          offers: { select: { id: true, price: true, status: true } },
        },
      });

      return res.status(200).json({ quote: updatedQuote });
    } catch (error) {
      console.error('Error updating quote:', error);
      return res.status(500).json({ error: 'Failed to update quote' });
    }
  }

  /* ----------------------------- DELETE QUOTE ----------------------------- */
  if (req.method === 'DELETE') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can delete quotes' });
      }

      await prisma.quote.delete({ where: { id } });
      return res.status(200).json({ message: 'Quote deleted successfully' });
    } catch (error) {
      console.error('Error deleting quote:', error);
      return res.status(500).json({ error: 'Failed to delete quote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
