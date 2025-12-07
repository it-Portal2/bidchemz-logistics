import { env, servicesAvailable } from './env-validation';

// Stripe integration placeholder
// Install Stripe when ready: npm install stripe @stripe/stripe-js

export async function createPaymentIntent(
  amount: number,
  userId: string,
  metadata: Record<string, string>
) {
  if (!servicesAvailable.payment) {
    throw new Error('Payment service not configured. Please set STRIPE_SECRET_KEY.');
  }

  // When Stripe is set up, use:
  // const Stripe = require('stripe');
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  //
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100), // Convert to paise
  //   currency: 'inr',
  //   metadata: {
  //     userId,
  //     ...metadata,
  //   },
  // });
  //
  // return paymentIntent;

  console.log(`Payment intent would be created: ₹${amount} for user ${userId}`);
  
  return {
    id: `pi_${Date.now()}`,
    client_secret: `secret_${Date.now()}`,
    amount: amount * 100,
    currency: 'inr',
  };
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  if (!servicesAvailable.payment) {
    return false;
  }

  // When Stripe is set up, use:
  // const Stripe = require('stripe');
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  //  
  // try {
  //   const event = stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     env.STRIPE_WEBHOOK_SECRET
  //   );
  //   return true;
  // } catch (err) {
  //   return false;
  // }

  return true; // Mock for development
}

export function getStripePublishableKey(): string {
  if (!servicesAvailable.payment) {
    return '';
  }
  return env.STRIPE_PUBLISHABLE_KEY;
}
