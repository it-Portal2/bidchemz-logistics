import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether email exists
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Block deactivated accounts
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated. Please contact support.',
      });
    }

    // 🔒 BLOCK LOGIN IF EMAIL IS NOT VERIFIED
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
      });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || undefined,
    });

    // Audit log for security tracking
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
      },
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        isVerified: user.isVerified,
      },
      token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
