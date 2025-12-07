import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { deleteUserData } from '@/lib/gdpr-compliance';
import { setSecurityHeaders } from '@/lib/security-headers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
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

  const { confirmation } = req.body;

  if (confirmation !== 'DELETE MY ACCOUNT') {
    return res.status(400).json({
      error: 'Please confirm account deletion by typing "DELETE MY ACCOUNT"',
    });
  }

  try {
    await deleteUserData(decoded.userId);
    
    return res.status(200).json({
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete account';
    return res.status(400).json({ error: errorMessage });
  }
}
