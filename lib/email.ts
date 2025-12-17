import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL!,
    subject: 'Verify your BidChemz account',
    html: `
      <h2>Welcome to BidChemz Logistics</h2>
      <p>Please verify your email to activate your account:</p>
      <a href="${verifyUrl}" style="padding:10px 15px;background:#2563eb;color:white;text-decoration:none;border-radius:4px;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
