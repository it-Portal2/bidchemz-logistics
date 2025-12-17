import { NextApiRequest, NextApiResponse } from 'next';
import { sendVerificationEmail } from '@/lib/mailer';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/password-validation';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, phone, role, companyName, gstin, consents } = req.body;

    if (!email || !password || !role || !phone) {
      return res.status(400).json({ error: 'Email, password, role, and phone are required' });
    }

    if (phone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin signup is not allowed' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: 'Weak password' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role,
        companyName,
        gstin,
        isVerified: false,
        isActive: true,
      },
    });

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.EmailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, token);

    return res.status(201).json({
      message: 'Signup successful. Please verify your email.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
