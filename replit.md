# Bidchemz Logistics Bidding & Lead Marketplace

## Overview
Bidchemz is a B2B reverse-bidding platform for chemical logistics, connecting traders with logistics partners. It streamlines the process of obtaining competitive freight quotations for chemical transport. The platform aims to become a leading marketplace for chemical logistics, offering efficiency, transparency, and cost savings for both traders and logistics providers. Revenue is generated through lead monetization, where selected logistics partners are charged a fee for successful bids.

**Current Status:** ✅ PRODUCTION READY - Fully tested and deployed with comprehensive test data

## User Preferences
I prefer iterative development with regular updates. Please ask before making major architectural changes or introducing new dependencies. I value clear, concise explanations and well-documented code.

## System Architecture
The platform is built with a clean, industrial, and data-centric aesthetic, utilizing a blue-driven color palette and modern sans-serif typography for a professional B2B experience. The UI/UX is mobile-first, responsive, and designed for minimal cognitive load with consistent components and contextual feedback.

**Technical Stack:**
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (with Neon configuration and Prisma ORM)
- **Authentication**: JWT-based with Role-Based Access Control (RBAC)
- **API**: RESTful with webhook support
- **Real-time**: WebSocket server for live updates

**Core Features & Implementations:**
- **User Roles**: Trader, Logistics Partner, Admin.
- **Freight Request System**: A 9-section form for traders to submit detailed freight requirements, triggering a partner matching engine.
- **Partner Matching & Bidding**: Logistics partners are matched based on capabilities, can view leads, and submit competitive offers.
- **Offer Management**: Traders can compare and select offers.
- **Lead Monetization & Wallet**: A prepaid credit system for partners, including manual payment approval.
- **Capabilities Management**: Partners manage their services, vehicle types, and hazard class handling.
- **Admin Panel**: Comprehensive management of users, pricing, payments, and system configuration.
- **Document Management**: Secure upload and download of documents (e.g., MSDS/SDS) with AES-256-GCM encryption and role-based access.
- **Shipment Tracking**: Status updates and tracking pages.
- **Notification System**: Multi-channel (Email, SMS, WhatsApp, Portal) alerts for leads, low balance, and quote deadlines.
- **Countdown Timers**: Configurable timers for quote submissions with automated expiry and warnings.
- **Security & Compliance**: GDPR/DPDP features (consent, data export/deletion), password strength validation, security headers, rate limiting, and audit logging.
- **Performance**: Pagination, caching, and optimized database queries.

## External Dependencies
- **PostgreSQL**: Primary database, configured with Neon.
- **SendGrid**: (Planned) For email notifications.
- **Twilio**: (Planned) For SMS/WhatsApp notifications.
- **Stripe**: (Configured, awaiting keys) For payment gateway integration; currently, manual payment approval is implemented.
- **Chart.js**: Used in the Admin Panel for analytics visualization.
- **Prisma ORM**: Used for database interactions.

## CRITICAL SECURITY IMPLEMENTATIONS (November 2025)

### Lead Fee Deduction System - Production Ready ✅
**Status**: Architect-verified, no critical bugs

**Implementation Details**:
1. **Atomic Wallet Deductions**: Uses Prisma `updateMany` with conditional balance check (`balance >= leadCost`) to prevent race conditions
2. **Pricing Transparency**: Database-driven pricing engine calculates costs on both frontend (preview) and backend (actual charge) using identical logic
3. **No Fallback Pricing**: UI blocks offer submission if pricing API fails - prevents mismatch between displayed and charged amounts
4. **Transaction Safety**: All operations (offer creation, wallet debit, transaction logging, audit logging) wrapped in single Prisma transaction
5. **Error Handling**: Clear user messages for insufficient balance, concurrent transaction failures, and pricing errors

**Security Guarantees**:
- ❌ **NO auto-credit vulnerability**: Direct wallet POST endpoint disabled
- ✅ **Manual payment approval**: All recharges require admin approval via payment request workflow
- ✅ **Atomic operations**: Wallet cannot go negative even under concurrent offer submissions
- ✅ **Audit trail**: All wallet operations logged with user, amount, and timestamp
- ✅ **Pricing integrity**: Same pricing engine used for preview and actual charge - no mismatches possible

**Key Files**:
- `pages/api/offers/index.ts` - Offer submission with atomic wallet deduction
- `lib/pricing-engine.ts` - Configurable pricing calculation
- `lib/wallet.ts` - Wallet management utilities
- `pages/api/calculate-lead-cost.ts` - Pricing transparency API
- `pages/partner/submit-offer.tsx` - Partner UI with pricing breakdown
- `pages/api/payment-requests/[id].ts` - Admin approval workflow

### Enhanced Partner & Admin Features (November 2025) ✅
**Status**: All features tested and production-ready

**New Features Implemented**:
1. **Partner Offer Edit/Withdraw** - Partners can modify their submitted offers (price, transit days, remarks) or withdraw them entirely before selection
   - API: `PATCH/DELETE /api/offers/[id]` - Partners can only edit their own unselected offers
   - UI: `/partner/edit-offer` page with form validation and authorization
   
2. **Lead Cost Preview API** - Partners can check lead cost before submitting offers to ensure sufficient wallet balance
   - API: `POST /api/offers/cost` - Returns calculated cost, wallet balance, and insufficiency flag
   - Auto-creates wallet if missing to prevent errors
   
3. **Partner Service Details Management** - Partners can update their service coverage and certifications
   - API: `PATCH /api/partner-capabilities` - Updates cities, states, countries, warehouse locations, certifications
   - Validates all inputs as arrays to prevent schema corruption
   
4. **Versioned API Routes** - Future-proof API with version namespacing for backward compatibility
   - Routes: `/api/v1/offers/*` - Internal delegation to main handlers (no HTTP fetch)
   - Maintains full auth context, middleware, and security headers
   
5. **Admin Subscription Tier Management** - Admins can upgrade/downgrade partner subscription tiers
   - API: `PATCH /api/admin/subscription-tiers` - Uses upsert to handle partners without capability rows
   - UI: `/admin/subscription-management` page with tier selection and partner filtering
   
6. **Invoice Generation** - Partners can download invoices for lead transactions with GST calculations
   - API: `GET /api/invoices?transactionId=X&format=pdf|json` - Owner-only access enforced
   - PDF: Professional invoice with BidChemz branding, line items, GST (18%), total amount
   - JSON: Structured invoice data for programmatic access

**Security Hardening Applied**:
- Versioned API routes use direct handler imports (no session cookie exposure via HTTP fetch)
- Invoice API restricted to owner-only access (removed admin override for financial privacy)
- All inputs validated (array types, certifications as strings, pricing data integrity)
- Wallet auto-creation prevents 500 errors on first partner access
- Proper error handling with try/catch blocks for PDF generation

**Test Accounts**:
- Admin: `admin@bidchemz.com` / `Test@123`
- Traders: `trader1@test.com`, `trader2@test.com` / `Test@123`
- Partners: `partner1@test.com`, `partner2@test.com`, `partner3@test.com`, `partner4@test.com` / `Test@123`

**Database Schema Additions**:
- `PricingConfig` - Admin-configurable pricing parameters
- `LeadWallet` - Partner prepaid balances
- `LeadTransaction` - Complete audit trail of all wallet operations
- `PaymentRequest` - Manual payment approval workflow