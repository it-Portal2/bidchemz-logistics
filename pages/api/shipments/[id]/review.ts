import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const { rating, feedback } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid shipment ID' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const shipment = await prisma.shipment.findUnique({
            where: { id },
            include: {
                quote: true,
            },
        });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Ensure the user is the trader who owns this shipment
        if (shipment.quote.traderId !== req.user!.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Ensure shipment is delivered
        // Note: status 'DELIVERED' matches the schema enum perfectly
        if (shipment.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Can only review delivered shipments' });
        }

        const updatedShipment = await prisma.shipment.update({
            where: { id },
            data: {
                rating,
                feedback,
                reviewedAt: new Date(),
            },
        });

        return res.status(200).json({ shipment: updatedShipment });
    } catch (error) {
        console.error('Error submitting review:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit review' });
    }
}

export default withAuth(handler);
