import { env, servicesAvailable } from './env-validation';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SMSParams {
  to: string;
  body: string;
}

export interface WhatsAppParams {
  to: string;
  body: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!servicesAvailable.email) {
    console.log('[EMAIL MOCK]', params.to, params.subject);
    return true;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(env.SENDGRID_API_KEY);

    await sgMail.send({
      to: params.to,
      from: 'noreply@bidchemz.com',
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
    });

    console.log('✅ Email sent to:', params.to);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

export async function sendSMS(params: SMSParams): Promise<boolean> {
  if (!servicesAvailable.sms) {
    console.log('[SMS MOCK]', params.to, params.body);
    return true;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      to: params.to,
      from: env.TWILIO_PHONE_NUMBER,
      body: params.body,
    });

    console.log('✅ SMS sent to:', params.to);
    return true;
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    return false;
  }
}

export async function sendWhatsApp(params: WhatsAppParams): Promise<boolean> {
  if (!servicesAvailable.whatsapp) {
    console.log('[WHATSAPP MOCK]', params.to, params.body);
    return true;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      to: `whatsapp:${params.to}`,
      from: env.TWILIO_WHATSAPP_NUMBER,
      body: params.body,
    });

    console.log('✅ WhatsApp message sent to:', params.to);
    return true;
  } catch (error) {
    console.error('❌ WhatsApp sending failed:', error);
    return false;
  }
}

export async function sendMultiChannelNotification(
  user: { email: string; phone?: string },
  notification: {
    subject: string;
    emailBody: string;
    smsBody?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }
): Promise<{
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}> {
  const results = {
    email: false,
    sms: false,
    whatsapp: false,
  };

  results.email = await sendEmail({
    to: user.email,
    subject: notification.subject,
    html: notification.emailBody,
  });

  if (user.phone && notification.smsBody) {
    results.sms = await sendSMS({
      to: user.phone,
      body: notification.smsBody,
    });

    if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
      results.whatsapp = await sendWhatsApp({
        to: user.phone,
        body: notification.smsBody,
      });
    }
  }

  return results;
}
