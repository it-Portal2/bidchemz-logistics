import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { setSecurityHeaders } from '@/lib/security-headers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setSecurityHeaders(res);

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { isActive, isVerified, phone, gstin, companyName } = req.body;

    const user = await prisma.user.update({
      where: { id: id as string },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof isVerified === 'boolean' && { isVerified }),
        ...(phone && { phone }),
        ...(gstin && { gstin }),
        ...(companyName && { companyName }),
      },
    });

    return res.status(200).json({ user });
  } else if (req.method === 'DELETE') {
    await prisma.user.delete({ where: { id: id as string } });
    return res.status(200).json({ message: 'User deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
