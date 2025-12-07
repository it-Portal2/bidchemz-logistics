import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { exportUserData } from '@/lib/gdpr-compliance';
import { setSecurityHeaders } from '@/lib/security-headers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const data = await exportUserData(decoded.userId);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bidchemz-data-export-${decoded.userId}-${Date.now()}.json"`
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error('Data export error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}
