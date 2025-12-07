# BidChemz Logistics Platform - Complete Developer Guide

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Status:** ✅ PRODUCTION READY

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Quick Start](#quick-start)
3. [Test Credentials](#test-credentials)
4. [Architecture](#architecture)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Core Features](#core-features)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Platform Overview

BidChemz Logistics is a B2B reverse-bidding platform for chemical logistics, connecting traders with logistics partners through a competitive quotation system.

### Business Model
1. Traders submit freight requirements
2. System matches eligible logistics partners
3. Partners submit competitive price quotations
4. Trader compares offers and selects winner
5. Selected partner is charged a lead fee
6. Revenue generated through lead monetization

### Key Features
- **Multi-role System:** Traders, Logistics Partners, Admins
- **Reverse Bidding:** Competitive offer marketplace
- **Lead Monetization:** Prepaid wallet with dynamic pricing
- **Partner Matching:** Capability-based algorithm
- **9-Section Freight Form:** Comprehensive request details
- **Real-time Tracking:** Shipment lifecycle management
- **Secure Documents:** AES-256 encrypted file storage
- **Payment Workflow:** Manual admin approval system

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database access
- Git for version control

### Installation
```bash
# Clone repository
git clone <repository-url>
cd bidchemz-logistics

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables
Create `.env` file with:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

---

## Test Credentials

**Universal Password:** `Test@123`

### Trader Accounts
| Email | Company | Features |
|-------|---------|----------|
| trader1@test.com | ABC Chemicals Ltd | 3 quotes, full dashboard |
| trader2@test.com | Global Chemicals Corp | 2 quotes, verified |

### Logistics Partner Accounts
| Email | Company | Tier | Wallet | Coverage |
|-------|---------|------|--------|----------|
| partner1@test.com | Express Logistics India | PREMIUM | ₹15,000 | Pan-India |
| partner2@test.com | SafeTrans Logistics | STANDARD | ₹8,000 | West India |
| partner3@test.com | ChemMove Solutions | STANDARD | ₹5,000 | North India |
| partner4@test.com | National Transport Co | FREE | ₹500 | South India |

### Admin Account
| Email | Access Level |
|-------|-------------|
| admin@bidchemz.com | Full system access |

---

## Architecture

### Technology Stack
- **Frontend:** Next.js 15.2.3, React 19, TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM 7.0
- **Styling:** Tailwind CSS 4.0
- **Authentication:** JWT with bcrypt
- **Real-time:** Socket.io (infrastructure ready)
- **Payments:** Stripe integration (configured)
- **Charts:** Chart.js, React-Chartjs-2

### Project Structure
```
bidchemz-logistics/
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── forms/          # Form components
│   └── ui/             # UI components
├── contexts/           # React contexts
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication utilities
│   ├── prisma.ts       # Database client
│   ├── matching-engine.ts
│   ├── pricing-engine.ts
│   └── wallet.ts
├── pages/              # Next.js pages & API routes
│   ├── api/            # API endpoints
│   ├── trader/         # Trader pages
│   ├── partner/        # Partner pages
│   └── admin/          # Admin pages
├── prisma/
│   └── schema.prisma   # Database schema
├── public/             # Static assets
├── scripts/            # Utility scripts
└── types/              # TypeScript types
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

---

### Authentication Endpoints

#### POST /api/auth/signup
Create new user account (Trader or Logistics Partner).

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePass123!",
  "phone": "+919876543210",
  "role": "TRADER",
  "companyName": "ABC Company Ltd",
  "gstin": "27AABCT1234A1Z5",
  "consents": {
    "termsOfService": true,
    "privacyPolicy": true,
    "partnerPolicy": true
  }
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cmi8cvz8h00006kmod9og5bhn",
    "email": "user@company.com",
    "role": "TRADER",
    "companyName": "ABC Company Ltd",
    "isVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Account created successfully"
}
```

**Validation:**
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
- Email: Valid format
- Role: Only TRADER or LOGISTICS_PARTNER allowed (no ADMIN via public signup)

---

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cmi8cvz8h00006kmod9og5bhn",
    "email": "user@company.com",
    "role": "TRADER",
    "companyName": "ABC Company Ltd",
    "isVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Responses:**
- 401: Invalid credentials
- 403: Account deactivated

---

#### GET /api/auth/me
Get current authenticated user details.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "cmi8cvz8h00006kmod9og5bhn",
    "email": "user@company.com",
    "role": "TRADER",
    "companyName": "ABC Company Ltd",
    "isVerified": true,
    "isActive": true
  }
}
```

---

### Quote (Freight Request) Endpoints

#### POST /api/quotes
Create new freight request (Trader only).

**Headers:**
```http
Authorization: Bearer <trader-token>
Content-Type: application/json
```

**Request Body (9-Section Form):**
```json
{
  "cargoName": "Sulfuric Acid",
  "casNumber": "7664-93-9",
  "quantity": 25,
  "quantityUnit": "MT",
  "isHazardous": true,
  "hazardClass": "CLASS_8",
  "unNumber": "UN1830",
  "cargoReadyDate": "2025-12-01T00:00:00Z",
  "estimatedDeliveryDate": "2025-12-05T00:00:00Z",
  
  "pickupAddress": "123 Chemical Hub, MIDC",
  "pickupCity": "Mumbai",
  "pickupState": "Maharashtra",
  "pickupPincode": "400001",
  "pickupCountry": "India",
  "pickupContactName": "John Doe",
  "pickupContactPhone": "+919876543210",
  
  "deliveryAddress": "456 Industrial Area",
  "deliveryCity": "Delhi",
  "deliveryState": "Delhi",
  "deliveryPincode": "110001",
  "deliveryCountry": "India",
  "deliveryContactName": "Jane Smith",
  "deliveryContactPhone": "+919876543211",
  
  "packagingType": "DRUMS",
  "packagingDetails": "200L steel drums",
  "specialHandling": "Corrosive material",
  "temperatureControlled": false,
  
  "preferredVehicleType": ["TANKER", "ISO_TANK"],
  "vehicleSpecifications": "Stainless steel tanker",
  
  "insuranceRequired": true,
  "insuranceValue": 500000,
  "msdsRequired": true,
  
  "paymentTerms": "Net 30",
  "billingAddress": "Same as pickup",
  "additionalNotes": "Handle with extreme care"
}
```

**Response (201):**
```json
{
  "quote": {
    "id": "quote_abc123",
    "quoteNumber": "BID-2025-001",
    "status": "SUBMITTED",
    "traderId": "trader_xyz789",
    "cargoName": "Sulfuric Acid",
    "quantity": 25,
    "quantityUnit": "MT",
    "matchedPartnersCount": 3,
    "createdAt": "2025-11-21T10:00:00Z"
  },
  "message": "Freight request created and sent for partner matching"
}
```

---

#### GET /api/quotes
List quotes (filtered by user role).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, SUBMITTED, MATCHING, OFFERS_AVAILABLE, SELECTED, EXPIRED)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "quotes": [
    {
      "id": "quote_abc123",
      "quoteNumber": "BID-2025-001",
      "status": "OFFERS_AVAILABLE",
      "cargoName": "Sulfuric Acid",
      "quantity": 25,
      "quantityUnit": "MT",
      "pickupCity": "Mumbai",
      "deliveryCity": "Delhi",
      "cargoReadyDate": "2025-12-01T00:00:00Z",
      "trader": {
        "id": "trader_xyz789",
        "email": "trader@company.com",
        "companyName": "ABC Chemicals"
      },
      "offers": [
        {
          "id": "offer_def456",
          "price": 125000,
          "status": "PENDING",
          "partnerId": "partner_ghi789"
        }
      ],
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### GET /api/quotes/:id
Get detailed quote information.

**Response (200):**
```json
{
  "quote": {
    "id": "quote_abc123",
    "quoteNumber": "BID-2025-001",
    "status": "OFFERS_AVAILABLE",
    "traderId": "trader_xyz789",
    
    "cargoName": "Sulfuric Acid",
    "casNumber": "7664-93-9",
    "quantity": 25,
    "quantityUnit": "MT",
    "isHazardous": true,
    "hazardClass": "CLASS_8",
    
    "pickupAddress": "123 Chemical Hub",
    "pickupCity": "Mumbai",
    "pickupState": "Maharashtra",
    
    "deliveryAddress": "456 Industrial Area",
    "deliveryCity": "Delhi",
    "deliveryState": "Delhi",
    
    "packagingType": "DRUMS",
    "preferredVehicleType": ["TANKER"],
    "insuranceRequired": true,
    
    "offers": [
      {
        "id": "offer_def456",
        "partnerId": "partner_ghi789",
        "price": 125000,
        "transitDays": 3,
        "status": "PENDING",
        "partner": {
          "companyName": "Express Logistics"
        }
      }
    ],
    
    "createdAt": "2025-11-21T10:00:00Z",
    "expiresAt": "2025-11-28T10:00:00Z"
  }
}
```

---

### Offer Endpoints

#### GET /api/offers
List offers (Partner: own offers, Admin: all offers).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `quoteId` (optional): Filter by quote ID
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "offers": [
    {
      "id": "offer_def456",
      "quoteId": "quote_abc123",
      "partnerId": "partner_ghi789",
      "status": "PENDING",
      "price": 125000,
      "currency": "INR",
      "transitDays": 3,
      "offerValidUntil": "2025-11-25T23:59:59Z",
      "pickupAvailableFrom": "2025-11-30T00:00:00Z",
      "insuranceIncluded": true,
      "trackingIncluded": true,
      "quote": {
        "quoteNumber": "BID-2025-001",
        "cargoName": "Sulfuric Acid",
        "quantity": 25,
        "pickupCity": "Mumbai",
        "deliveryCity": "Delhi"
      },
      "partner": {
        "companyName": "Express Logistics"
      },
      "createdAt": "2025-11-21T12:00:00Z"
    }
  ]
}
```

---

#### POST /api/offers
Submit new offer (Logistics Partner only).

**Headers:**
```http
Authorization: Bearer <partner-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quoteId": "quote_abc123",
  "price": 125000,
  "transitDays": 3,
  "offerValidUntil": "2025-11-25T23:59:59Z",
  "pickupAvailableFrom": "2025-11-30T00:00:00Z",
  "insuranceIncluded": true,
  "trackingIncluded": true,
  "customsClearance": false,
  "valueAddedServices": ["Tracking", "Insurance"],
  "termsAndConditions": "Standard terms apply",
  "remarks": "We have experience with Class 8 chemicals"
}
```

**Response (201):**
```json
{
  "offer": {
    "id": "offer_def456",
    "quoteId": "quote_abc123",
    "price": 125000,
    "status": "PENDING",
    "leadCostDeducted": 750
  },
  "wallet": {
    "newBalance": 14250
  },
  "message": "Offer submitted successfully"
}
```

**Business Logic:**
1. Validates partner capabilities match quote requirements
2. Calculates lead cost using pricing engine
3. Checks wallet balance (must have sufficient funds)
4. Deducts lead fee from wallet atomically
5. Creates offer and transaction records
6. Logs audit trail

---

#### PATCH /api/offers/:id
Edit own offer (Partner) or update status (Admin).

**Request Body:**
```json
{
  "price": 120000,
  "transitDays": 2,
  "remarks": "Updated pricing"
}
```

**Restrictions:**
- Partners can only edit their own unselected offers
- Cannot edit after offer is selected

---

#### DELETE /api/offers/:id
Withdraw offer (Partner only).

**Response (200):**
```json
{
  "message": "Offer withdrawn successfully"
}
```

---

#### POST /api/offers/:id/select
Select winning offer (Trader only).

**Response (200):**
```json
{
  "message": "Offer selected successfully",
  "shipment": {
    "id": "shipment_jkl012",
    "shipmentNumber": "SHIP-2025-001",
    "status": "BOOKED"
  }
}
```

**Business Logic:**
1. Validates quote belongs to trader
2. Creates shipment record
3. Updates quote status to SELECTED
4. Updates offer status to ACCEPTED
5. Rejects other pending offers
6. Logs audit trail

---

### Wallet Endpoints

#### GET /api/wallet
Get wallet balance and settings (Partner only).

**Headers:**
```http
Authorization: Bearer <partner-token>
```

**Response (200):**
```json
{
  "wallet": {
    "id": "wallet_mno345",
    "userId": "partner_ghi789",
    "balance": 15000,
    "currency": "INR",
    "lowBalanceAlert": true,
    "alertThreshold": 1000,
    "createdAt": "2025-11-01T00:00:00Z",
    "updatedAt": "2025-11-21T10:00:00Z"
  }
}
```

---

#### GET /api/wallet/transactions
Get transaction history (Partner only).

**Query Parameters:**
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset
- `type` (optional): Filter by type (CREDIT, DEBIT, RECHARGE, REFUND)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "txn_pqr678",
      "walletId": "wallet_mno345",
      "transactionType": "DEBIT",
      "amount": 750,
      "description": "Lead fee for quote BID-2025-001",
      "leadId": "quote_abc123",
      "leadType": "SHARED",
      "leadCost": 750,
      "hazardCategory": "CLASS_8",
      "transactionDate": "2025-11-21T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### PUT /api/wallet/settings
Update wallet alert settings (Partner only).

**Request Body:**
```json
{
  "lowBalanceAlert": true,
  "alertThreshold": 2000
}
```

**Response (200):**
```json
{
  "wallet": {
    "lowBalanceAlert": true,
    "alertThreshold": 2000
  },
  "message": "Settings updated successfully"
}
```

---

### Payment Request Endpoints

#### POST /api/payment-requests
Submit wallet recharge request (Partner only).

**Request Body:**
```json
{
  "amount": 10000,
  "paymentMethod": "BANK_TRANSFER",
  "referenceNumber": "REF123456",
  "transactionId": "TXN789012",
  "paymentDate": "2025-11-20T00:00:00Z",
  "requestNotes": "Payment via HDFC Bank"
}
```

**Response (201):**
```json
{
  "paymentRequest": {
    "id": "payment_req_stu901",
    "amount": 10000,
    "status": "PENDING",
    "paymentMethod": "BANK_TRANSFER",
    "createdAt": "2025-11-21T10:00:00Z"
  },
  "message": "Payment request submitted for admin approval"
}
```

---

#### GET /api/payment-requests
List payment requests.
- Partner: Own requests only
- Admin: All requests

**Response (200):**
```json
{
  "requests": [
    {
      "id": "payment_req_stu901",
      "userId": "partner_ghi789",
      "amount": 10000,
      "status": "PENDING",
      "paymentMethod": "BANK_TRANSFER",
      "referenceNumber": "REF123456",
      "user": {
        "email": "partner@company.com",
        "companyName": "Express Logistics"
      },
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ]
}
```

---

#### PATCH /api/payment-requests/:id
Approve/reject payment request (Admin only).

**Request Body:**
```json
{
  "status": "APPROVED",
  "reviewNotes": "Payment verified via bank statement"
}
```

**Response (200):**
```json
{
  "paymentRequest": {
    "id": "payment_req_stu901",
    "status": "APPROVED",
    "reviewedAt": "2025-11-21T11:00:00Z",
    "reviewNotes": "Payment verified"
  },
  "wallet": {
    "newBalance": 25000
  },
  "message": "Payment approved and wallet credited"
}
```

**Business Logic (on APPROVED):**
1. Credits wallet with requested amount
2. Creates RECHARGE transaction
3. Updates payment request status
4. Sends notification to partner

---

### Lead Cost Calculation Endpoint

#### POST /api/calculate-lead-cost
Calculate estimated lead cost before submitting offer.

**Request Body:**
```json
{
  "quoteId": "quote_abc123"
}
```

**Response (200):**
```json
{
  "quoteId": "quote_abc123",
  "quoteNumber": "BID-2025-001",
  "estimatedLeadCost": 750,
  "subscriptionTier": "PREMIUM",
  "breakdown": {
    "basePrice": 500,
    "hazardMultiplier": 1.6,
    "distanceMultiplier": 1.3,
    "quantityMultiplier": 1.0,
    "vehicleMultiplier": 1.3,
    "urgencyMultiplier": 1.0,
    "tierDiscount": 0.7,
    "explanation": {
      "hazard": "Class 8 (Corrosive): 1.6x multiplier",
      "distance": "Long distance route: 1.3x",
      "tier": "Premium tier: 30% discount"
    }
  }
}
```

---

### Admin Endpoints

#### GET /api/admin/stats
Get platform statistics (Admin only).

**Response (200):**
```json
{
  "stats": {
    "totalQuotes": 15,
    "totalOffers": 42,
    "totalShipments": 8,
    "totalUsers": 7,
    "totalPartners": 4,
    "totalTraders": 2,
    "activeQuotes": 6,
    "pendingPayments": 2,
    "platformRevenue": 12500
  }
}
```

---

#### GET /api/admin/users
List all users (Admin only).

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_vwx234",
      "email": "user@company.com",
      "role": "TRADER",
      "companyName": "ABC Chemicals",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2025-10-15T00:00:00Z"
    }
  ]
}
```

---

#### PATCH /api/admin/users/:id
Update user status (Admin only).

**Request Body:**
```json
{
  "isActive": false,
  "isVerified": true
}
```

---

#### GET /api/admin/pricing-config
Get current pricing configuration.

**Response (200):**
```json
{
  "config": {
    "baseLeadCost": 500,
    "hazardClass1": 2.5,
    "hazardClass8": 1.6,
    "distanceSameState": 1.0,
    "distanceLong": 2.0,
    "tierPremiumDiscount": 0.7,
    "isActive": true
  }
}
```

---

#### PUT /api/admin/pricing-config
Update pricing configuration (Admin only).

**Request Body:**
```json
{
  "baseLeadCost": 600,
  "hazardClass1": 2.8,
  "tierPremiumDiscount": 0.65
}
```

---

### Shipment Endpoints

#### GET /api/shipments
List shipments (role-filtered).

**Response (200):**
```json
{
  "shipments": [
    {
      "id": "shipment_jkl012",
      "shipmentNumber": "SHIP-2025-001",
      "status": "IN_TRANSIT",
      "quoteId": "quote_abc123",
      "offerId": "offer_def456",
      "currentLocation": "Vadodara",
      "estimatedDelivery": "2025-12-05T00:00:00Z",
      "actualPickupDate": "2025-12-01T08:00:00Z",
      "createdAt": "2025-11-21T15:00:00Z"
    }
  ]
}
```

---

#### GET /api/shipments/:id/track
Get shipment tracking details.

**Response (200):**
```json
{
  "shipment": {
    "shipmentNumber": "SHIP-2025-001",
    "status": "IN_TRANSIT",
    "currentLocation": "Vadodara",
    "estimatedDelivery": "2025-12-05T00:00:00Z",
    "statusUpdates": [
      {
        "status": "BOOKED",
        "timestamp": "2025-11-21T15:00:00Z",
        "location": "Mumbai"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2025-12-01T08:00:00Z",
        "location": "Vadodara"
      }
    ],
    "trackingEvents": [
      {
        "event": "Package picked up",
        "timestamp": "2025-12-01T08:00:00Z",
        "location": "Mumbai"
      }
    ]
  }
}
```

---

## Database Schema

### Core Models

#### User
- **id:** String (CUID)
- **email:** String (unique)
- **password:** String (bcrypt hashed)
- **role:** UserRole (TRADER | LOGISTICS_PARTNER | ADMIN)
- **companyName:** String
- **gstin:** String
- **isVerified:** Boolean
- **isActive:** Boolean

#### Quote
- All 9-section form fields
- **status:** QuoteStatus (DRAFT, SUBMITTED, MATCHING, OFFERS_AVAILABLE, SELECTED, EXPIRED)
- **traderId:** Foreign key to User
- Relationships: offers[], shipment?, documents[]

#### Offer
- **quoteId:** Foreign key to Quote
- **partnerId:** Foreign key to User
- **price:** Float
- **transitDays:** Int
- **status:** OfferStatus (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
- **isSelected:** Boolean
- Relationship: leadTransaction?

#### LeadWallet
- **userId:** Foreign key to User (unique)
- **balance:** Float
- **currency:** String (default: INR)
- **lowBalanceAlert:** Boolean
- **alertThreshold:** Float
- Relationships: transactions[]

#### LeadTransaction
- **walletId:** Foreign key to LeadWallet
- **offerId:** Foreign key to Offer (optional, unique)
- **transactionType:** TransactionType (CREDIT, DEBIT, RECHARGE, REFUND)
- **amount:** Float
- **leadCost:** Float (for DEBIT transactions)
- **hazardCategory:** HazardClass

#### PartnerCapability
- **userId:** Foreign key to User (unique)
- **serviceTypes:** String[]
- **dgClasses:** HazardClass[]
- **serviceStates:** String[]
- **fleetTypes:** VehicleType[]
- **subscriptionTier:** SubscriptionTier (FREE, STANDARD, PREMIUM)

#### Shipment
- **quoteId:** Foreign key to Quote (unique)
- **offerId:** Foreign key to Offer (unique)
- **status:** ShipmentStatus (BOOKED, IN_TRANSIT, DELIVERED, etc.)
- **statusUpdates:** JSON[]
- **trackingEvents:** JSON[]

---

## Authentication & Security

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### JWT Token
- **Expiry:** 7 days
- **Algorithm:** HS256
- **Payload:** userId, email, role, companyName
- **Secret:** Environment variable JWT_SECRET (required)

### Role-Based Access Control
```typescript
// Middleware usage example
export default withAuth(handler, [UserRole.ADMIN]);
```

### API Security Features
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Rate limiting (100 req/min)
- ✅ Security headers (CORS, CSP, etc.)
- ✅ Input validation
- ✅ SQL injection protection (Prisma ORM)

---

## Core Features

### 1. Reverse Bidding Workflow
```
Trader creates quote
↓
System matches partners based on capabilities
↓
Partners receive lead notifications
↓
Partners calculate lead cost
↓
Partners submit offers (wallet deducted)
↓
Trader compares offers
↓
Trader selects winner
↓
Shipment created, other offers rejected
```

### 2. Lead Pricing Engine

**Factors:**
- Base cost: ₹500 (configurable)
- Hazard class multiplier (1.0x - 2.5x)
- Distance multiplier (1.0x - 2.0x)
- Quantity multiplier (0.8x - 1.5x)
- Vehicle type multiplier (1.0x - 1.5x)
- Urgency multiplier (1.3x if urgent)
- Subscription tier discount (0.7x - 1.0x)

**Example Calculation:**
```
Base: ₹500
× Hazard (Class 8): 1.6
× Distance (Long): 1.3
× Quantity (25 MT): 1.0
× Vehicle (Tanker): 1.3
× Tier (Premium): 0.7
= ₹750
```

### 3. Partner Matching Algorithm

**Criteria:**
1. **Hazard Class:** Partner must handle the cargo's DG class
2. **Geographic Coverage:** Partner serves both pickup and delivery states
3. **Packaging:** Partner has capability for required packaging type
4. **Fleet:** Partner has required vehicle types
5. **Temperature:** If needed, partner must have temperature control
6. **Wallet Balance:** Partner must have sufficient funds (> 0)

**Priority:**
- Premium tier partners matched first
- Standard tier second
- Free tier last

---

## Deployment

### Production Checklist

1. **Environment Variables:**
   ```env
   DATABASE_URL=<production-database-url>
   JWT_SECRET=<secure-random-string-64-chars>
   NODE_ENV=production
   SENDGRID_API_KEY=<email-service-key>
   TWILIO_AUTH_TOKEN=<sms-service-key>
   STRIPE_SECRET_KEY=<payment-gateway-key>
   ```

2. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Start:**
   ```bash
   npm start
   ```

5. **Security:**
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting
   - Enable monitoring and logging

---

## Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: P2021 - Table does not exist
```
**Solution:**
```bash
npx prisma generate
npx prisma db push
```

#### Authentication Failed
```
Error: Invalid token
```
**Solution:**
- Verify JWT_SECRET is set
- Check token expiry (7 days)
- Ensure Authorization header format: `Bearer <token>`

#### Insufficient Wallet Balance
```
Error: Insufficient wallet balance
```
**Solution:**
- Submit payment request
- Wait for admin approval
- Check current balance via `/api/wallet`

---

## API Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid data format |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions for role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, business rule violation |
| 500 | Internal Server Error | Database error, unhandled exception |

---

## Support & Resources

- **Documentation:** This file
- **Test Credentials:** See [Test Credentials](#test-credentials) section
- **Database Seed:** `npm run db:seed`
- **Database Reset:** `npx prisma db push --force-reset && npm run db:seed`

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
