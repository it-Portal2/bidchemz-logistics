import prisma from './prisma';

export interface DataExportResult {
  user: any;
  quotes: any[];
  offers: any[];
  policyConsents: any[];
  leadTransactions: any[];
  documents: any[];
}

/**
 * GDPR Right to Access: Export all user data
 */
export async function exportUserData(userId: string): Promise<DataExportResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      quotes: true,
      offers: true,
      policyConsents: true,
      partnerCapability: true,
      leadWallet: {
        include: {
          transactions: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get documents uploaded by this user
  const documents = await prisma.document.findMany({
    where: { uploadedBy: userId },
  });

  const leadTransactions = user.leadWallet?.transactions || [];

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      companyName: user.companyName,
      gstin: user.gstin,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      partnerCapability: user.partnerCapability,
      wallet: user.leadWallet
        ? {
            balance: user.leadWallet.balance,
            currency: user.leadWallet.currency,
          }
        : null,
    },
    quotes: user.quotes,
    offers: user.offers,
    policyConsents: user.policyConsents,
    leadTransactions,
    documents,
  };
}

/**
 * GDPR Right to Erasure: Delete user and all associated data
 */
export async function deleteUserData(userId: string): Promise<void> {
  // Check if user has active quotes or shipments
  const activeQuotes = await prisma.quote.count({
    where: {
      traderId: userId,
      status: {
        in: ['SUBMITTED', 'MATCHING', 'OFFERS_AVAILABLE'],
      },
    },
  });

  const activeShipments = await prisma.shipment.count({
    where: {
      quote: {
        traderId: userId,
      },
      status: {
        in: ['BOOKED', 'PICKUP_SCHEDULED', 'IN_TRANSIT'],
      },
    },
  });

  if (activeQuotes > 0 || activeShipments > 0) {
    throw new Error(
      'Cannot delete user with active quotes or shipments. Please complete or cancel them first.'
    );
  }

  // Delete user and all associated data (cascading deletes configured in Prisma schema)
  await prisma.user.delete({
    where: { id: userId },
  });

  console.log(`User data deleted: ${userId} (GDPR Right to Erasure)`);
}

/**
 * Anonymize user data instead of deletion (for legal/business record retention)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const anonymousEmail = `deleted-user-${userId}@anonymized.local`;
  const anonymousPhone = '+00000000000';

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: anonymousEmail,
      phone: anonymousPhone,
      companyName: 'Anonymized User',
      gstin: null,
      isActive: false,
    },
  });

  console.log(`User data anonymized: ${userId}`);
}

/**
 * Get data retention policy info
 */
export function getDataRetentionPolicy() {
  return {
    accountData: '5 years after account closure',
    transactionData: '7 years (legal requirement)',
    auditLogs: '3 years',
    documents: '5 years after shipment completion',
    policyConsents: 'Permanent (legal requirement)',
  };
}

/**
 * Log data breach notification
 */
export async function logDataBreach(
  description: string,
  affectedUserIds: string[],
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
) {
  // In production, this would:
  // 1. Log to security monitoring system
  // 2. Trigger notifications to affected users
  // 3. Notify regulatory authorities if required (within 72 hours)
  // 4. Create incident report

  console.error('DATA BREACH DETECTED:', {
    timestamp: new Date().toISOString(),
    description,
    affectedUsers: affectedUserIds.length,
    severity,
  });

  // Store breach log (you'd add a DataBreach model to Prisma)
  // await prisma.dataBreach.create({
  //   data: {
  //     description,
  //     affectedUserIds,
  //     severity,
  //     reportedAt: new Date(),
  //   },
  // });
}
