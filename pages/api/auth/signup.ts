import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/password-validation';
import { PARTNER_POLICY, TERMS_OF_SERVICE, PRIVACY_POLICY } from '@/lib/policy';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      password,
      phone,
      role,
      companyName,
      gstin,
      consents,
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Email, password, and role are required',
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be TRADER or LOGISTICS_PARTNER',
      });
    }

    // SECURITY: Block ADMIN role from public signup - privilege escalation prevention
    if (role === UserRole.ADMIN) {
      return res.status(403).json({
        error: 'Admin accounts cannot be created through public signup. Please contact support.',
      });
    }

    // Only allow TRADER and LOGISTICS_PARTNER roles for public signup
    if (role !== UserRole.TRADER && role !== UserRole.LOGISTICS_PARTNER) {
      return res.status(403).json({
        error: 'Only Trader and Logistics Partner accounts can be created through signup',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors,
      });
    }

    // Validate policy consents
    if (!consents?.termsOfService) {
      return res.status(400).json({
        error: 'You must accept the Terms of Service',
      });
    }

    if (!consents?.privacyPolicy) {
      return res.status(400).json({
        error: 'You must accept the Privacy Policy',
      });
    }

    if (role === UserRole.LOGISTICS_PARTNER && !consents?.partnerPolicy) {
      return res.status(400).json({
        error: 'Logistics Partners must accept the Partner Policy',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
      });
    }

    const hashedPassword = await hashPassword(password);

    // Get user's IP address and user agent for audit trail
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const now = new Date();

    // Prepare policy consents
    const consentRecords = [
      {
        policyType: 'TERMS_OF_SERVICE',
        policyVersion: TERMS_OF_SERVICE.version,
        accepted: consents.termsOfService,
        acceptedAt: now,
        ipAddress,
        userAgent,
      },
      {
        policyType: 'PRIVACY_POLICY',
        policyVersion: PRIVACY_POLICY.version,
        accepted: consents.privacyPolicy,
        acceptedAt: now,
        ipAddress,
        userAgent,
      },
    ];

    if (role === UserRole.LOGISTICS_PARTNER && consents.partnerPolicy) {
      consentRecords.push({
        policyType: 'PARTNER_POLICY',
        policyVersion: PARTNER_POLICY.version,
        accepted: consents.partnerPolicy,
        acceptedAt: now,
        ipAddress,
        userAgent,
      });
    }

    // Create user, policy consents, and partner-specific data in a single transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role,
          companyName,
          gstin,
          isVerified: false,
          isActive: true,
          policyConsents: {
            create: consentRecords,
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          companyName: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (role === UserRole.LOGISTICS_PARTNER) {
        await tx.partnerCapability.create({
          data: {
            userId: newUser.id,
            serviceTypes: [],
            dgClasses: [],
            productCategories: [],
            serviceCities: [],
            serviceStates: [],
            serviceCountries: [],
            fleetTypes: [],
            packagingCapabilities: [],
            certifications: [],
            warehouseLocations: [],
          },
        });

        await tx.leadWallet.create({
          data: {
            userId: newUser.id,
            balance: 0,
          },
        });
      }

      return newUser;
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || undefined,
    });

    res.status(201).json({
      user,
      token,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
