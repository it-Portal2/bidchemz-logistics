import { NextApiRequest, NextApiResponse } from "next";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { UserRole, KycStatus } from "@prisma/client";
import crypto from "crypto";

// SSO Secret for verifying tokens from BidChemz
const BIDCHEMZ_SSO_SECRET = process.env.BIDCHEMZ_SSO_SECRET;

if (!BIDCHEMZ_SSO_SECRET) {
  console.warn("WARNING: BIDCHEMZ_SSO_SECRET not set. SSO will not work.");
}

// Interface for the SSO payload from BidChemz
interface SSOPayload {
  user: {
    short_id: string;
    company_name: string;
    email: string;
    phone: string | { country_code: string; phone_number: string };
    password: string;
    kyc_status: string;
    role: "buyer" | "seller";
  };
  counterparty: {
    short_id: string;
    company_name: string;
    email: string;
    phone: string | { country_code: string; phone_number: string };
    role: "buyer" | "seller";
  };
  accepted_bid: {
    short_id: string;
    product_name: string;
    product_cas_number: string;
    order_quantity: number;
    weight_unit: string | number;
  };
  platform: string;
  iat: number;
  exp: number;
}

// Helper to get phone as string from either string or object
const getPhoneString = (p: any) => {
  if (typeof p === "string") return p;
  if (p && p.country_code && p.phone_number) {
    return `+${p.country_code}${p.phone_number}`;
  }
  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from query param or body
    const token =
      req.method === "GET" ? (req.query.token as string) : req.body.token;

    if (!token) {
      return res.status(400).json({ error: "SSO token is required" });
    }

    if (!BIDCHEMZ_SSO_SECRET) {
      return res.status(500).json({ error: "SSO not configured on server" });
    }

    // Verify the SSO token
    let ssoPayload: SSOPayload;
    try {
      ssoPayload = verify(token, BIDCHEMZ_SSO_SECRET) as SSOPayload;
    } catch (err) {
      console.error("SSO token verification failed:", err);
      return res.status(401).json({ error: "Invalid or expired SSO token" });
    }

    // Validate platform
    if (ssoPayload.platform !== "bidchemz") {
      return res.status(401).json({ error: "Invalid platform" });
    }
    console.log("SSO payload:", ssoPayload);

    const { user: ssoUser, counterparty, accepted_bid } = ssoPayload;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: ssoUser.email },
    });

    if (user) {
      // User exists - log them in
      console.log(`[SSO] Existing user login: ${ssoUser.email}`);

      // Sync password if provided in SSO (already bcrypt-hashed from BidChemz)
      if (ssoUser.password) {
        // Store hash directly - don't re-hash since BidChemz already hashed it
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: ssoUser.password, // Already bcrypt hash
            isVerified: true,
          },
        });
        console.log(
          `[SSO] Password synced for existing user: ${ssoUser.email}`
        );
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SSO_LOGIN",
          entity: "USER",
          entityId: user.id,
          changes: { source: "bidchemz", bid_id: accepted_bid.short_id },
        },
      });
    } else {
      // New user - register them as TRADER
      console.log(`[SSO] Creating new user: ${ssoUser.email}`);

      // Use password from SSO (already bcrypt-hashed) or generate random hashed password
      const passwordToStore = ssoUser.password
        ? ssoUser.password // Already bcrypt hash from BidChemz
        : await hashPassword(crypto.randomBytes(16).toString("hex"));

      user = await prisma.user.create({
        data: {
          email: ssoUser.email,
          password: passwordToStore,
          phone: getPhoneString(ssoUser.phone),
          role: "TRADER",
          companyName: ssoUser.company_name,
          shortId: ssoUser.short_id,
          kycStatus: ssoUser.kyc_status === "verified" ? "VERIFIED" : "PENDING",
          platform: "BIDCHEMZ",
          isActive: true,
          isVerified: true, // SSO users are already verified by BidChemz
        } as any,
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SSO_SIGNUP",
          entity: "USER",
          entityId: user.id,
          changes: { source: "bidchemz", bid_id: accepted_bid.short_id },
        },
      });
    }

    const logisticsToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || undefined,
    });

    const bidData = {
      counterparty: {
        short_id: counterparty.short_id,
        company_name: counterparty.company_name,
        email: counterparty.email,
        phone: getPhoneString(counterparty.phone),
        role: counterparty.role,
      },
      accepted_bid: {
        short_id: accepted_bid.short_id,
        product_name: accepted_bid.product_name,
        product_cas_number: accepted_bid.product_cas_number,
        order_quantity: accepted_bid.order_quantity,
        weight_unit: accepted_bid.weight_unit,
      },
      source: "bidchemz",
    };

    // Return success with token and redirect info
    return res.status(200).json({
      success: true,
      token: logisticsToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        isVerified: user.isVerified,
      },
      bidData,
      redirectUrl: "/quotes/new?prefill=true",
    });
  } catch (error) {
    console.error("SSO error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
