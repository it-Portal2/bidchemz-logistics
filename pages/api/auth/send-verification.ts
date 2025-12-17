import crypto from 'crypto';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = crypto.randomBytes(32).toString('hex');

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  console.log('VERIFY EMAIL URL:', verifyUrl); // replace with email service later

  res.json({ message: 'Verification email sent' });
}
