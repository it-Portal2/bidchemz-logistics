import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/password-validation";
import crypto from "crypto";

/* ------------------------------
   Helper: Generate shortId
--------------------------------*/
function generateShortId(role: UserRole) {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return role === UserRole.TRADER ? `buyer_${random}` : `partner_${random}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, phone, role, companyName, gstin } = req.body;

    /* ------------------------------
       Basic validation
    --------------------------------*/
    if (!email || !password || !phone || !role) {
      return res.status(400).json({
        error: "Email, password, phone and role are required",
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (role === UserRole.ADMIN) {
      return res.status(403).json({ error: "Admin signup not allowed" });
    }

    if (phone.length < 10) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ error: "Weak password" });
    }

    /* ------------------------------
       Check existing user
    --------------------------------*/
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    /* ------------------------------
       Create user
    --------------------------------*/
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role,
        companyName,
        gstin,

        shortId: generateShortId(role),
        platform: "BIDCHEMZ_LOGISTICS",

        // Defaults handled by schema:
        // kycStatus = PENDING
        // isVerified = false
        // isActive = true
      } as any,
    });

    /* ------------------------------
       Create email verification token
    --------------------------------*/
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    /* ------------------------------
       Send verification email
    --------------------------------*/
    await sendVerificationEmail(user.email, token);

    return res.status(201).json({
      message: "Signup successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
