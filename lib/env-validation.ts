// Environment variable validation and type-safe access

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Auth & Security
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ||
    'dev-encryption-key-32-characters!',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'dev-webhook-secret',

  // Notification Services (Optional)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',

  // Payment Gateway (Optional)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // App Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    10
  ),
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || '900000',
    10
  ),
};

export function validateRequiredEnv() {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Warn about insecure defaults in production
  if (env.NODE_ENV === 'production') {
    const insecureDefaults = [];

    if (env.JWT_SECRET === 'dev-secret-change-in-production') {
      insecureDefaults.push('JWT_SECRET');
    }

    if (env.ENCRYPTION_KEY === 'dev-encryption-key-32-characters!') {
      insecureDefaults.push('ENCRYPTION_KEY');
    }

    if (env.WEBHOOK_SECRET === 'dev-webhook-secret') {
      insecureDefaults.push('WEBHOOK_SECRET');
    }

    if (insecureDefaults.length > 0) {
      console.error(
        `⚠️  WARNING: Using insecure default values in production for: ${insecureDefaults.join(', ')}`
      );
    }
  }
}

// Check for optional services
export const servicesAvailable = {
  email: !!env.SENDGRID_API_KEY,
  sms: !!env.TWILIO_ACCOUNT_SID && !!env.TWILIO_AUTH_TOKEN,
  whatsapp: !!env.TWILIO_WHATSAPP_NUMBER,
  payment: !!env.STRIPE_SECRET_KEY,
};
