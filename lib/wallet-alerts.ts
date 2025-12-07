import prisma from './prisma';
import { notifyLowWalletBalance } from './notifications';

export async function checkWalletBalance(userId: string): Promise<{
  balance: number;
  alertTriggered: boolean;
  threshold: number;
}> {
  const wallet = await prisma.leadWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const alertTriggered = wallet.lowBalanceAlert && wallet.balance <= wallet.alertThreshold;

  if (alertTriggered) {
    await notifyLowWalletBalance(userId, wallet.balance, wallet.alertThreshold);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOW_BALANCE_ALERT',
        entity: 'WALLET',
        entityId: wallet.id,
        changes: {
          balance: wallet.balance,
          threshold: wallet.alertThreshold,
        },
      },
    });
  }

  return {
    balance: wallet.balance,
    alertTriggered,
    threshold: wallet.alertThreshold,
  };
}

export async function updateWalletAlertSettings(
  userId: string,
  settings: {
    lowBalanceAlert?: boolean;
    alertThreshold?: number;
  }
): Promise<void> {
  await prisma.leadWallet.update({
    where: { userId },
    data: settings,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE_WALLET_ALERT_SETTINGS',
      entity: 'WALLET',
      entityId: userId,
      changes: settings,
    },
  });
}

export async function checkAllWallets(): Promise<void> {
  const lowBalanceWallets = await prisma.leadWallet.findMany({
    where: {
      lowBalanceAlert: true,
      balance: {
        lte: prisma.leadWallet.fields.alertThreshold,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          companyName: true,
        },
      },
    },
  });

  for (const wallet of lowBalanceWallets) {
    await notifyLowWalletBalance(
      wallet.userId,
      wallet.balance,
      wallet.alertThreshold
    );
  }
}
