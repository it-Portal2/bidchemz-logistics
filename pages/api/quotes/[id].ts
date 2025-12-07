import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid quote ID' });
  }

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

      res.status(200).json({ quote: updatedQuote });
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ error: 'Failed to update quote' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can delete quotes' });
      }

      await prisma.quote.delete({ where: { id } });
      res.status(200).json({ message: 'Quote deleted successfully' });
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ error: 'Failed to delete quote' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
