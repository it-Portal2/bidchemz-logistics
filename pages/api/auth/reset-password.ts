import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export default async function handler(req, res) {
  const { token, password } = req.body;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: await hashPassword(password) },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  res.status(200).json({ message: 'Password updated' });
}
