import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Security: Do not reveal if user exists
  if (!user) {
    return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  }

  const token = crypto.randomBytes(32).toString('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(user.email, token);

  res.status(200).json({
    message: 'Password reset link sent',
  });
}
