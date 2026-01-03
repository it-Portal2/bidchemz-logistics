import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const userId = req.user!.userId;

    if (req.method === 'GET') {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { notificationPreferences: true }
            });
            return res.status(200).json({ preferences: user?.notificationPreferences || {} });
        } catch (error) {
            console.error('Failed to fetch preferences', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const { preferences } = req.body;

            const user = await prisma.user.update({
                where: { id: userId },
                data: { notificationPreferences: preferences }
            });

            return res.status(200).json({ preferences: user.notificationPreferences });
        } catch (error) {
            console.error('Failed to update preferences', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
