import prisma from './prisma';
import { TransactionType, LeadType } from '@prisma/client';
import { calculateLeadCost, PricingParams } from './pricing-engine';

export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await prisma.leadWallet.findUnique({
    where: { userId },
  });

  return wallet?.balance || 0;
}

export async function rechargeWallet(
  userId: string,
  amount: number,
  invoiceId?: string,
  gstAmount?: number
): Promise<void> {
  const wallet = await prisma.leadWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  await prisma.$transaction([
    prisma.leadWallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    }),
    prisma.leadTransaction.create({
      data: {
        walletId: wallet.id,
        transactionType: TransactionType.RECHARGE,
        amount,
        description: 'Wallet recharge',
        invoiceId,
        gstAmount,
      },
    }),
  ]);

  console.log(`Wallet recharged: User ${userId}, Amount: ₹${amount}`);
}

export async function deductLeadFee(
  userId: string,
  offerId: string,
  leadId: string,
  pricingParams: PricingParams
): Promise<boolean> {
  const wallet = await prisma.leadWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const leadCost = await calculateLeadCost(pricingParams);

  if (wallet.balance < leadCost) {
    console.error(`Insufficient balance: User ${userId}, Required: ₹${leadCost}, Available: ₹${wallet.balance}`);
    return false;
  }

  try {
    await prisma.$transaction([
      prisma.leadWallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: leadCost,
          },
        },
      }),
      prisma.leadTransaction.create({
        data: {
          walletId: wallet.id,
          offerId,
          transactionType: TransactionType.DEBIT,
          amount: leadCost,
          description: `Lead fee for quote ${leadId}`,
          leadId,
          leadType: pricingParams.subscriptionTier === 'PREMIUM' ? LeadType.EXCLUSIVE : LeadType.SHARED,
          leadCost,
          creditsDeducted: leadCost,
          hazardCategory: pricingParams.hazardClass,
          quantity: pricingParams.quantity,
          vehicleType: pricingParams.vehicleType[0],
        },
      }),
    ]);

    console.log(`Lead fee deducted: User ${userId}, Amount: ₹${leadCost}, Lead: ${leadId}`);

    // Check if balance is low and send alert
    const updatedWallet = await prisma.leadWallet.findUnique({
      where: { userId },
    });

    if (
      updatedWallet &&
      updatedWallet.lowBalanceAlert &&
      updatedWallet.balance < updatedWallet.alertThreshold
    ) {
      const { sendLowBalanceAlert } = await import('./notifications');
      await sendLowBalanceAlert(userId, updatedWallet.balance);
    }

    return true;
  } catch (error) {
    console.error('Error deducting lead fee:', error);
    return false;
  }
}

export async function refundLeadFee(
  userId: string,
  leadId: string,
  reason: string
): Promise<void> {
  const transaction = await prisma.leadTransaction.findFirst({
    where: {
      leadId,
      transactionType: TransactionType.DEBIT,
    },
    include: {
      wallet: true,
    },
  });

  if (!transaction) {
    throw new Error('Original transaction not found');
  }

  await prisma.$transaction([
    prisma.leadWallet.update({
      where: { id: transaction.walletId },
      data: {
        balance: {
          increment: transaction.amount,
        },
      },
    }),
    prisma.leadTransaction.create({
      data: {
        walletId: transaction.walletId,
        transactionType: TransactionType.REFUND,
        amount: transaction.amount,
        description: `Refund for lead ${leadId}: ${reason}`,
        leadId,
      },
    }),
  ]);

  console.log(`Lead fee refunded: User ${userId}, Amount: ₹${transaction.amount}, Reason: ${reason}`);
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 50
) {
  const wallet = await prisma.leadWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return [];
  }

  return prisma.leadTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { transactionDate: 'desc' },
    take: limit,
  });
}
