import prisma from './prisma';
import { sendMultiChannelNotification } from './notifications';

/**
 * Background job: Check for expiring quotes and send warnings
 * Should be run every 5 minutes via cron/scheduler
 * 
 * NOTE: Requires timerExpiresAt field to be added to Quote model
 */
export async function checkExpiringQuotes() {
  console.log('Quote expiry checking - awaiting timerExpiresAt field in schema');
}

/**
 * Background job: Auto-expire quotes past deadline
 * Should be run every minute via cron/scheduler
 * 
 * NOTE: Requires timerExpiresAt field to be added to Quote model
 */
export async function expireQuotes() {
  console.log('Quote expiration - awaiting timerExpiresAt field in schema');
}

/**
 * Background job: Check low wallet balances and send alerts
 * Should be run every hour via cron/scheduler
 */
export async function checkLowBalanceAlerts() {
  const wallets = await prisma.leadWallet.findMany({
    where: {
      balance: {
        lt: 1000,
      },
    },
    include: {
      user: true,
    },
  });

  for (const wallet of wallets) {
    const lowBalanceThreshold = 500;

    if (wallet.balance <= lowBalanceThreshold) {
      await sendMultiChannelNotification({
        userId: wallet.userId,
        title: 'Low Wallet Balance',
        message: `Your wallet balance is ₹${wallet.balance}. Consider recharging soon to avoid missing leads.`,
        channels: ['EMAIL', 'PORTAL'],
        priority: 'HIGH',
        data: {
          balance: wallet.balance,
          lowBalanceThreshold,
        },
      });
    }
  }

  console.log(`Checked ${wallets.length} wallets for low balance alerts`);
}

/**
 * Background job: Retry failed webhook deliveries
 * Should be run every 15 minutes via cron/scheduler
 */
export async function retryFailedWebhooks() {
  const failedWebhooks = await prisma.webhookLog.findMany({
    where: {
      status: {
        not: 200,
      },
      attempts: {
        lt: 5,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 100,
  });

  for (const webhook of failedWebhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': webhook.hmacSignature,
        },
        body: JSON.stringify(webhook.payload),
      });

      await prisma.webhookLog.update({
        where: { id: webhook.id },
        data: {
          status: response.status,
          responseBody: await response.text(),
          attempts: webhook.attempts + 1,
          lastAttempt: new Date(),
        },
      });
    } catch (error) {
      await prisma.webhookLog.update({
        where: { id: webhook.id },
        data: {
          attempts: webhook.attempts + 1,
          lastAttempt: new Date(),
          responseBody: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  console.log(`Retried ${failedWebhooks.length} failed webhooks`);
}

/**
 * Main scheduler function - run all background jobs
 * In production, use a proper job queue like Bull or Agenda
 */
export async function runScheduler() {
  console.log('Starting background job scheduler...');

  setInterval(checkExpiringQuotes, 5 * 60 * 1000);
  setInterval(expireQuotes, 60 * 1000);
  setInterval(checkLowBalanceAlerts, 60 * 60 * 1000);
  setInterval(retryFailedWebhooks, 15 * 60 * 1000);

  checkExpiringQuotes();
  expireQuotes();
  checkLowBalanceAlerts();
  retryFailedWebhooks();
}
