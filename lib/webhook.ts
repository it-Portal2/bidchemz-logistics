import prisma from './prisma';
import { WebhookEvent } from '@prisma/client';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'bidchemz-webhook-secret';

interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: string;
}

export async function sendWebhook(
  url: string,
  event: WebhookEvent,
  data: any
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  const hmacSignature = generateHMACSignature(payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': hmacSignature,
      },
      body: JSON.stringify(payload),
    });

    await prisma.webhookLog.create({
      data: {
        event,
        payload: payload as any,
        url,
        hmacSignature,
        status: response.status,
        responseBody: await response.text(),
        attempts: 1,
        lastAttempt: new Date(),
      },
    });

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);

    await prisma.webhookLog.create({
      data: {
        event,
        payload: payload as any,
        url,
        hmacSignature,
        status: null,
        responseBody: error instanceof Error ? error.message : 'Unknown error',
        attempts: 1,
        lastAttempt: new Date(),
      },
    });
  }
}

function generateHMACSignature(payload: any): string {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function verifyWebhookSignature(payload: any, signature: string): boolean {
  const expectedSignature = generateHMACSignature(payload);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
