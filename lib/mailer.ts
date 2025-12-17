import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"BidChemz Logistics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your BidChemz account',
    html: `
      <h2>Welcome to BidChemz Logistics</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verifyUrl}" style="padding:10px 15px;background:#2563eb;color:white;text-decoration:none;border-radius:4px;">
        Verify Email
      </a>
      <p>This link will expire in 24 hours.</p>
    `,
  });
}



export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"BidChemz Logistics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your BidChemz password',
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  });
}
