import prisma from './prisma';
import { QuoteStatus, OfferStatus } from '@prisma/client';
import { notifyOfferExpiringSoon } from './notifications';

const DEFAULT_QUOTE_TIMER_MINUTES = 60;
const WARNING_THRESHOLD_MINUTES = 10;

export interface QuoteTimerConfig {
  quoteId: string;
  timerDurationMinutes?: number;
  enableWarnings?: boolean;
}

export async function startQuoteTimer(config: QuoteTimerConfig): Promise<Date> {
  const {
    quoteId,
    timerDurationMinutes = DEFAULT_QUOTE_TIMER_MINUTES,
    enableWarnings = true,
  } = config;

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + timerDurationMinutes);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      expiresAt,
      status: QuoteStatus.MATCHING,
    },
  });

  if (enableWarnings) {
    const warningTime = new Date();
    warningTime.setMinutes(
      warningTime.getMinutes() + timerDurationMinutes - WARNING_THRESHOLD_MINUTES
    );

    scheduleExpiryWarning(quoteId, warningTime);
  }

  scheduleQuoteExpiry(quoteId, expiresAt);

  await prisma.auditLog.create({
    data: {
      quoteId,
      action: 'QUOTE_TIMER_STARTED',
      entity: 'QUOTE',
      entityId: quoteId,
      changes: {
        timerDurationMinutes,
        expiresAt,
      },
    },
  });

  return expiresAt;
}

export async function extendQuoteTimer(
  quoteId: string,
  additionalMinutes: number
): Promise<Date> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  if (!quote.expiresAt) {
    throw new Error('Quote does not have an expiry time');
  }

  const newExpiresAt = new Date(quote.expiresAt);
  newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      expiresAt: newExpiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      quoteId,
      action: 'QUOTE_TIMER_EXTENDED',
      entity: 'QUOTE',
      entityId: quoteId,
      changes: {
        additionalMinutes,
        newExpiresAt,
      },
    },
  });

  return newExpiresAt;
}

export async function getRemainingTime(quoteId: string): Promise<{
  expiresAt: Date;
  remainingMinutes: number;
  hasExpired: boolean;
}> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { expiresAt: true },
  });

  if (!quote?.expiresAt) {
    throw new Error('Quote does not have an expiry time');
  }

  const now = new Date();
  const remainingMs = quote.expiresAt.getTime() - now.getTime();
  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));

  return {
    expiresAt: quote.expiresAt,
    remainingMinutes: Math.max(0, remainingMinutes),
    hasExpired: remainingMs <= 0,
  };
}

async function scheduleExpiryWarning(
  quoteId: string,
  warningTime: Date
): Promise<void> {
  const delay = warningTime.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: quoteId },
          select: {
            id: true,
            expiresAt: true,
            status: true,
          },
        });

        if (!quote || quote.status === QuoteStatus.EXPIRED) {
          return;
        }

        const offers = await prisma.offer.findMany({
          where: {
            quoteId,
            status: OfferStatus.PENDING,
          },
          select: {
            partnerId: true,
          },
        });

        const partners = await prisma.quote.findUnique({
          where: { id: quoteId },
          select: {
            offers: {
              select: {
                partnerId: true,
              },
            },
          },
        });

        if (partners?.offers) {
          for (const offer of partners.offers) {
            await notifyOfferExpiringSoon(
              quoteId,
              offer.partnerId,
              quote.expiresAt!
            );
          }
        }
      } catch (error) {
        console.error('Error sending expiry warning:', error);
      }
    }, delay);
  }
}

async function scheduleQuoteExpiry(
  quoteId: string,
  expiresAt: Date
): Promise<void> {
  const delay = expiresAt.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      try {
        await expireQuote(quoteId);
      } catch (error) {
        console.error('Error expiring quote:', error);
      }
    }, delay);
  }
}

export async function expireQuote(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!quote) {
    return;
  }

  if (quote.status === QuoteStatus.SELECTED || quote.status === QuoteStatus.CANCELLED) {
    return;
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: QuoteStatus.EXPIRED,
    },
  });

  await prisma.offer.updateMany({
    where: {
      quoteId,
      status: OfferStatus.PENDING,
    },
    data: {
      status: OfferStatus.EXPIRED,
    },
  });

  await prisma.auditLog.create({
    data: {
      quoteId,
      action: 'QUOTE_EXPIRED',
      entity: 'QUOTE',
      entityId: quoteId,
      changes: {
        expiresAt: quote.expiresAt,
      },
    },
  });
}

export async function checkExpiredQuotes(): Promise<void> {
  const expiredQuotes = await prisma.quote.findMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
      status: {
        in: [QuoteStatus.MATCHING, QuoteStatus.OFFERS_AVAILABLE],
      },
    },
  });

  for (const quote of expiredQuotes) {
    await expireQuote(quote.id);
  }
}
