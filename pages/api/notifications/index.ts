import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    userId: req.user!.userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20, // Limit to recent 20
            });

            return res.status(200).json({ notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }

    if (req.method === 'PATCH') { // Mark as read
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids)) {
                // Mark all as read if no IDs provided (optional valid behavior) or specific IDs
                await prisma.notification.updateMany({
                    where: {
                        userId: req.user!.userId,
                        read: false,
                    },
                    data: {
                        read: true,
                    },
                });
                return res.status(200).json({ message: 'All notifications marked as read' });
            }

            await prisma.notification.updateMany({
                where: {
                    id: { in: ids },
                    userId: req.user!.userId,
                },
                data: {
                    read: true,
                },
            });

            return res.status(200).json({ message: 'Notifications marked as read' });
        } catch (error) {
            console.error('Error updating notifications:', error);
            return res.status(500).json({ error: 'Failed to update notifications' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
