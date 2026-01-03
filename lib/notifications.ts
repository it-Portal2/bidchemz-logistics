import prisma from './prisma';
import { NotificationPriority } from '@prisma/client';

export type NotificationEventType =
  | 'NEW_LEAD'
  | 'LOW_BALANCE'
  | 'QUOTE_DEADLINE'
  | 'OFFER_STATUS'
  | 'SHIPMENT_UPDATE'
  | 'SYSTEM';

export interface NotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PORTAL';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  eventType?: NotificationEventType;
  data?: any;
}

export interface MultiChannelNotificationOptions {
  userId: string;
  title: string;
  message: string;
  channels: ('EMAIL' | 'SMS' | 'WHATSAPP' | 'PORTAL')[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  eventType?: NotificationEventType;
  data?: any;
}

export async function sendMultiChannelNotification(
  options: MultiChannelNotificationOptions
): Promise<void> {
  const { userId, title, message, channels, priority = 'MEDIUM', eventType = 'SYSTEM', data } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, companyName: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const notificationPromises = channels.map((channel) =>
    sendNotification({
      userId,
      title,
      message,
      type: channel,
      priority,
      eventType,
      data,
    })
  );

  await Promise.allSettled(notificationPromises);
}

export async function sendNotification(
  options: NotificationOptions
): Promise<void> {
  const { userId, title, message, type, priority = 'MEDIUM', eventType = 'SYSTEM', data } = options;

  switch (type) {
    case 'EMAIL':
      await sendEmailNotification(userId, title, message, data);
      break;
    case 'SMS':
      await sendSMSNotification(userId, message, data);
      break;
    case 'WHATSAPP':
      await sendWhatsAppNotification(userId, message, data);
      break;
    case 'PORTAL':
      await createPortalNotification(userId, title, message, priority, eventType, data);
      break;
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'NOTIFICATION_SENT',
      entity: 'NOTIFICATION',
      entityId: userId,
      changes: {
        type,
        title,
        priority,
        eventType
      },
    },
  });
}

async function sendEmailNotification(
  userId: string,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, companyName: true },
  });

  if (!user?.email) {
    console.error('User email not found');
    return;
  }

  console.log(`[EMAIL] To: ${user.email}`);
  console.log(`[EMAIL] Subject: ${title}`);
  console.log(`[EMAIL] Message: ${message}`);
  console.log(`[EMAIL] Data:`, data);
}

async function sendSMSNotification(
  userId: string,
  message: string,
  data?: any
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    console.error('User phone not found');
    return;
  }

  console.log(`[SMS] To: ${user.phone}`);
  console.log(`[SMS] Message: ${message}`);
  console.log(`[SMS] Data:`, data);
}

async function sendWhatsAppNotification(
  userId: string,
  message: string,
  data?: any
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    console.error('User phone not found');
    return;
  }

  console.log(`[WHATSAPP] To: ${user.phone}`);
  console.log(`[WHATSAPP] Message: ${message}`);
  console.log(`[WHATSAPP] Data:`, data);
}



async function createPortalNotification(
  userId: string,
  title: string,
  message: string,
  defaultPriority: string,
  eventType: NotificationEventType,
  data?: any
): Promise<void> {
  // Validate priority against the Enum
  const validPriorities = Object.values(NotificationPriority) as string[];
  let priority = validPriorities.includes(defaultPriority)
    ? (defaultPriority as NotificationPriority)
    : NotificationPriority.MEDIUM;

  try {
    // Fetch user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    if (user?.notificationPreferences) {
      const prefs = user.notificationPreferences as Record<string, string>;
      if (prefs[eventType] && validPriorities.includes(prefs[eventType])) {
        priority = prefs[eventType] as NotificationPriority;
      }
    }

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        priority,
        type: eventType, // Store eventType in 'type' field
      },
    });
  } catch (error) {
    console.error('Failed to create portal notification:', error);
    // Don't throw, just log to avoid breaking the flow if one channel fails
  }
}

export async function notifyPartnerAboutNewLead(
  partnerId: string,
  quoteId: string,
  quoteDetails: any
): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      trader: {
        select: {
          companyName: true,
        },
      },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  const message = `New freight lead available! ${quote.cargoName} from ${quote.pickupCity} to ${quote.deliveryCity}. Quantity: ${quote.quantity} ${quote.quantityUnit}. Ready: ${new Date(quote.cargoReadyDate).toLocaleDateString()}`;

  await sendMultiChannelNotification({
    userId: partnerId,
    title: '🚨 New Lead Available',
    message,
    channels: ['EMAIL', 'SMS', 'WHATSAPP', 'PORTAL'],
    priority: 'HIGH',
    eventType: 'NEW_LEAD',
    data: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      cargoName: quote.cargoName,
      pickupCity: quote.pickupCity,
      deliveryCity: quote.deliveryCity,
      quantity: quote.quantity,
      quantityUnit: quote.quantityUnit,
      cargoReadyDate: quote.cargoReadyDate,
      isHazardous: quote.isHazardous,
    },
  });
}

export async function notifyLowWalletBalance(
  partnerId: string,
  currentBalance: number,
  threshold: number
): Promise<void> {
  const message = `⚠️ Low wallet balance alert! Your current balance is ₹${currentBalance}. Please recharge to continue receiving leads.`;

  await sendMultiChannelNotification({
    userId: partnerId,
    title: 'Low Wallet Balance Alert',
    message,
    channels: ['EMAIL', 'SMS', 'PORTAL'],
    priority: 'URGENT',
    eventType: 'LOW_BALANCE',
    data: {
      currentBalance,
      threshold,
      recommendedRecharge: threshold * 2,
    },
  });
}

export async function notifyOfferExpiringSoon(
  quoteId: string,
  partnerId: string,
  expiresAt: Date
): Promise<void> {
  const minutesRemaining = Math.floor(
    (expiresAt.getTime() - Date.now()) / (1000 * 60)
  );

  const message = `⏰ Quote submission deadline approaching! Only ${minutesRemaining} minutes remaining to submit your offer.`;

  await sendMultiChannelNotification({
    userId: partnerId,
    title: 'Quote Deadline Alert',
    message,
    channels: ['SMS', 'PORTAL'],
    priority: 'HIGH',
    eventType: 'QUOTE_DEADLINE',
    data: {
      quoteId,
      expiresAt,
      minutesRemaining,
    },
  });
}

export async function sendLowBalanceAlert(
  userId: string,
  currentBalance: number
): Promise<void> {
  const threshold = 500;
  await notifyLowWalletBalance(userId, currentBalance, threshold);
}
