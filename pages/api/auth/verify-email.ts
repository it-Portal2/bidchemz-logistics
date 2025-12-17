import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  const { token } = req.query;

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { isVerified: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  res.json({ message: 'Email verified successfully' });
}
