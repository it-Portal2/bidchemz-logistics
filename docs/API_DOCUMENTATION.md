# BidChemz Logistics API Documentation

## Overview
BidChemz Logistics provides a comprehensive REST API for B2B integration, enabling chemical traders and logistics partners to interact with our reverse-bidding platform programmatically.

**Base URL (Production):** `https://your-domain.replit.app`
**Base URL (Development):** `http://localhost:5000`

**API Version:** v1.0
**Authentication:** JWT Bearer Token

---

## Table of Contents
1. [Authentication](#authentication)
2. [Quotes API](#quotes-api)
3. [Offers API](#offers-api)
4. [Partner Capabilities API](#partner-capabilities-api)
5. [Wallet API](#wallet-api)
6. [Documents API](#documents-api)
7. [Shipments API](#shipments-api)
8. [Webhooks](#webhooks)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### Sign Up
Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "partner@logistics.com",
  "password": "SecurePass@123",
  "phone": "+919876543210",
  "role": "LOGISTICS_PARTNER",
  "companyName": "XYZ Logistics Pvt Ltd",
  "gstin": "27AABCT1234A1Z5",
  "consents": {
    "termsOfService": true,
    "privacyPolicy": true,
    "partnerPolicy": true
  }
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx9...",
    "email": "partner@logistics.com",
    "role": "LOGISTICS_PARTNER",
    "companyName": "XYZ Logistics Pvt Ltd"
  }
}
```

### Login
Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "partner@logistics.com",
  "password": "SecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx9...",
    "email": "partner@logistics.com",
    "role": "LOGISTICS_PARTNER",
    "companyName": "XYZ Logistics Pvt Ltd",
    "isVerified": true,
    "isActive": true
  }
}
```

**Note:** Include the token in all subsequent requests as a Bearer token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Quotes API

Quotes represent freight requests created by traders seeking logistics services.

### Get All Quotes
Retrieve a list of freight requests.

**Endpoint:** `GET /api/quotes`

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, MATCHING, OFFERS_AVAILABLE, SELECTED, EXPIRED)
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
GET /api/quotes?status=OFFERS_AVAILABLE&limit=10&offset=0
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
{
  "quotes": [
    {
      "id": "clx9abc123",
      "quoteNumber": "QT-2025-001",
      "cargoName": "Sulfuric Acid (98%)",
      "quantity": 25,
      "quantityUnit": "MT",
      "isHazardous": true,
      "hazardClass": "CLASS_8",
      "packagingType": "ISO_TANK",
      "pickupAddress": "123 Industrial Area",
      "pickupCity": "Mumbai",
      "pickupState": "Maharashtra",
      "pickupPincode": "400001",
      "deliveryAddress": "456 Factory Road",
      "deliveryCity": "Delhi",
      "deliveryState": "Delhi",
      "deliveryPincode": "110001",
      "cargoReadyDate": "2025-12-01T00:00:00.000Z",
      "status": "OFFERS_AVAILABLE",
      "createdAt": "2025-11-20T10:30:00.000Z",
      "trader": {
        "id": "clx9xyz",
        "companyName": "ABC Chemicals Ltd",
        "email": "trader@example.com"
      },
      "offers": [
        {
          "id": "clx9off1",
          "price": 125000,
          "status": "PENDING"
        }
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0
  }
}
```

### Get Quote by ID
Retrieve details of a specific quote.

**Endpoint:** `GET /api/quotes/:id`

**Response (200 OK):**
```json
{
  "quote": {
    "id": "clx9abc123",
    "quoteNumber": "QT-2025-001",
    "cargoName": "Sulfuric Acid (98%)",
    "quantity": 25,
    "quantityUnit": "MT",
    "isHazardous": true,
    "hazardClass": "CLASS_8",
    "packagingType": "ISO_TANK",
    "pickupAddress": "123 Industrial Area",
    "pickupCity": "Mumbai",
    "pickupState": "Maharashtra",
    "pickupPincode": "400001",
    "deliveryAddress": "456 Factory Road",
    "deliveryCity": "Delhi",
    "deliveryState": "Delhi",
    "deliveryPincode": "110001",
    "cargoReadyDate": "2025-12-01T00:00:00.000Z",
    "status": "OFFERS_AVAILABLE",
    "vehicleType": "TANKER",
    "specialHandling": "Temperature controlled transport required",
    "documents": [
      {
        "id": "doc1",
        "fileName": "MSDS-SulfuricAcid.pdf",
        "documentType": "MSDS"
      }
    ],
    "offers": [
      {
        "id": "clx9off1",
        "price": 125000,
        "transitDays": 3,
        "status": "PENDING",
        "partner": {
          "companyName": "Express Logistics India"
        }
      }
    ],
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```

### Create Quote (Trader Only)
Submit a new freight request.

**Endpoint:** `POST /api/quotes`

**Request Body:**
```json
{
  "cargoName": "Hydrochloric Acid (35%)",
  "quantity": 20,
  "quantityUnit": "MT",
  "isHazardous": true,
  "hazardClass": "CLASS_8",
  "packagingType": "DRUMS",
  "pickupAddress": "789 Chemical Complex",
  "pickupCity": "Pune",
  "pickupState": "Maharashtra",
  "pickupPincode": "411001",
  "deliveryAddress": "321 Industrial Park",
  "deliveryCity": "Ahmedabad",
  "deliveryState": "Gujarat",
  "deliveryPincode": "380001",
  "cargoReadyDate": "2025-12-05",
  "vehicleType": "TRUCK",
  "specialHandling": "Handle with care, corrosive material"
}
```

**Response (201 Created):**
```json
{
  "message": "Quote created successfully",
  "quote": {
    "id": "clx9new123",
    "quoteNumber": "QT-2025-042",
    "status": "MATCHING",
    "createdAt": "2025-11-21T14:20:00.000Z"
  }
}
```

---

## Offers API

Offers represent bids submitted by logistics partners for freight requests.

### Get All Offers
Retrieve offers submitted by the authenticated partner.

**Endpoint:** `GET /api/offers`

**Query Parameters:**
- `quoteId` (optional): Filter by quote ID
- `status` (optional): Filter by status (PENDING, SELECTED, REJECTED)

**Response (200 OK):**
```json
{
  "offers": [
    {
      "id": "clx9off1",
      "quoteId": "clx9abc123",
      "price": 125000,
      "transitDays": 3,
      "offerValidUntil": "2025-11-25T23:59:59.000Z",
      "pickupAvailableFrom": "2025-12-01T00:00:00.000Z",
      "insuranceIncluded": true,
      "trackingIncluded": true,
      "customsClearance": false,
      "valueAddedServices": ["GPS tracking", "24/7 support"],
      "termsAndConditions": "Standard terms apply",
      "status": "PENDING",
      "quote": {
        "quoteNumber": "QT-2025-001",
        "cargoName": "Sulfuric Acid (98%)",
        "pickupCity": "Mumbai",
        "deliveryCity": "Delhi"
      },
      "createdAt": "2025-11-20T12:00:00.000Z"
    }
  ]
}
```

### Submit Offer (Partner Only)
Submit a bid for a freight request.

**Endpoint:** `POST /api/offers`

**Request Body:**
```json
{
  "quoteId": "clx9abc123",
  "price": 125000,
  "transitDays": 3,
  "offerValidUntil": "2025-11-25T23:59:59.000Z",
  "pickupAvailableFrom": "2025-12-01T00:00:00.000Z",
  "insuranceIncluded": true,
  "trackingIncluded": true,
  "customsClearance": false,
  "valueAddedServices": ["GPS tracking", "24/7 support", "Dedicated customer manager"],
  "termsAndConditions": "Payment on delivery, 30-day credit terms available",
  "remarks": "We have specialized tankers for corrosive chemicals"
}
```

**Response (201 Created):**
```json
{
  "message": "Offer submitted successfully",
  "offer": {
    "id": "clx9newoff",
    "price": 125000,
    "status": "PENDING",
    "leadCost": 500,
    "walletBalanceAfter": 14500
  }
}
```

**Note:** Lead fees are automatically deducted from the partner's wallet upon offer submission.

### Get Lead Cost Estimate
Calculate the cost of submitting an offer before actual submission.

**Endpoint:** `POST /api/calculate-lead-cost`

**Request Body:**
```json
{
  "quoteId": "clx9abc123"
}
```

**Response (200 OK):**
```json
{
  "leadCost": 500,
  "breakdown": {
    "baseLeadCost": 100,
    "hazardMultiplier": 2.2,
    "distanceMultiplier": 1.5,
    "subscriptionDiscount": 20,
    "hazardClass": "CLASS_8",
    "subscriptionTier": "PREMIUM"
  },
  "currentBalance": 15000,
  "balanceAfterDeduction": 14500
}
```

---

## Partner Capabilities API

### Get Capabilities
Retrieve partner's service capabilities.

**Endpoint:** `GET /api/partner/capabilities`

**Response (200 OK):**
```json
{
  "capabilities": {
    "id": "cap123",
    "serviceStates": ["Maharashtra", "Gujarat", "Rajasthan"],
    "hazardClassCapabilities": ["CLASS_3", "CLASS_8"],
    "vehicleTypes": ["TRUCK", "TANKER", "ISO_TANK"],
    "fleetSize": 25,
    "temperatureControlled": true,
    "gpsTracking": true,
    "insurance": true
  }
}
```

### Update Capabilities
Update service capabilities.

**Endpoint:** `PUT /api/partner/capabilities`

**Request Body:**
```json
{
  "serviceStates": ["Maharashtra", "Gujarat", "Rajasthan", "Delhi"],
  "hazardClassCapabilities": ["CLASS_3", "CLASS_6", "CLASS_8"],
  "vehicleTypes": ["TRUCK", "TANKER", "ISO_TANK"],
  "fleetSize": 30,
  "temperatureControlled": true,
  "gpsTracking": true,
  "insurance": true
}
```

**Response (200 OK):**
```json
{
  "message": "Capabilities updated successfully",
  "capabilities": { ... }
}
```

---

## Wallet API

### Get Wallet Balance
Retrieve current wallet balance and transaction history.

**Endpoint:** `GET /api/wallet`

**Response (200 OK):**
```json
{
  "wallet": {
    "id": "wal123",
    "balance": 15000,
    "currency": "INR",
    "lowBalanceAlert": true,
    "alertThreshold": 1000
  },
  "recentTransactions": [
    {
      "id": "txn1",
      "transactionType": "DEBIT",
      "amount": 500,
      "description": "Lead fee for quote QT-2025-001",
      "timestamp": "2025-11-20T12:00:00.000Z"
    },
    {
      "id": "txn2",
      "transactionType": "RECHARGE",
      "amount": 10000,
      "description": "Wallet recharge",
      "timestamp": "2025-11-18T10:00:00.000Z"
    }
  ]
}
```

### Request Wallet Recharge
Submit a payment request for wallet recharge.

**Endpoint:** `POST /api/payment-requests`

**Request Body:**
```json
{
  "amount": 10000,
  "paymentMethod": "BANK_TRANSFER",
  "referenceNumber": "UTR123456789",
  "transactionId": "TXN987654321",
  "paymentDate": "2025-11-21",
  "requestNotes": "Payment made via NEFT"
}
```

**Response (201 Created):**
```json
{
  "message": "Payment request submitted successfully",
  "request": {
    "id": "pr123",
    "amount": 10000,
    "status": "PENDING",
    "createdAt": "2025-11-21T15:00:00.000Z"
  }
}
```

---

## Documents API

### Upload Document
Upload safety documents (MSDS/SDS) for a quote.

**Endpoint:** `POST /api/documents/upload`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Document file (PDF, max 10MB)
- `quoteId`: Associated quote ID
- `documentType`: MSDS, SDS, or OTHER

**Response (201 Created):**
```json
{
  "documentId": "doc123",
  "fileName": "MSDS-Sulfuric-Acid.pdf",
  "fileSize": 245678,
  "createdAt": "2025-11-21T16:00:00.000Z",
  "message": "Document uploaded and encrypted successfully"
}
```

### Download Document
Download an encrypted document.

**Endpoint:** `GET /api/documents/:id/download`

**Response:** Binary file download with proper Content-Disposition headers.

---

## Shipments API

### Track Shipment
Get real-time shipment tracking information.

**Endpoint:** `GET /api/shipments/:id/track`

**Response (200 OK):**
```json
{
  "shipment": {
    "id": "ship123",
    "quoteNumber": "QT-2025-001",
    "status": "IN_TRANSIT",
    "pickupDate": "2025-12-01T08:00:00.000Z",
    "estimatedDeliveryDate": "2025-12-04T18:00:00.000Z",
    "currentLocation": "Highway NH48, Near Vadodara",
    "trackingEvents": [
      {
        "timestamp": "2025-12-01T08:00:00.000Z",
        "location": "Mumbai Warehouse",
        "status": "PICKED_UP",
        "description": "Cargo loaded and departed"
      },
      {
        "timestamp": "2025-12-01T14:30:00.000Z",
        "location": "Surat Toll Plaza",
        "status": "IN_TRANSIT",
        "description": "Crossing Surat"
      }
    ]
  }
}
```

---

## Webhooks

BidChemz supports webhooks for real-time event notifications.

### Supported Events
- `quote.created` - New freight request created
- `quote.matched` - Quote matched with partners
- `offer.submitted` - New offer received
- `offer.selected` - Offer accepted by trader
- `offer.rejected` - Offer rejected
- `shipment.status_updated` - Shipment status changed
- `wallet.low_balance` - Wallet balance below threshold
- `payment.approved` - Wallet recharge approved

### Webhook Payload Example
```json
{
  "event": "offer.selected",
  "timestamp": "2025-11-21T17:00:00.000Z",
  "data": {
    "offerId": "clx9off1",
    "quoteId": "clx9abc123",
    "price": 125000,
    "traderId": "trader123",
    "partnerId": "partner456"
  }
}
```

### Webhook Security
All webhooks include a signature header for verification:
```
X-BidChemz-Signature: sha256=<hmac_signature>
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Codes
- `INVALID_CREDENTIALS` - Invalid email/password
- `INSUFFICIENT_BALANCE` - Wallet balance too low
- `QUOTE_NOT_FOUND` - Quote does not exist
- `DUPLICATE_OFFER` - Offer already submitted for this quote
- `INVALID_ROLE` - Operation not allowed for user role
- `VALIDATION_ERROR` - Request validation failed

---

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authentication endpoints:** 5 requests per minute
- **Quote creation:** 10 requests per hour
- **Offer submission:** 20 requests per hour
- **General API calls:** 100 requests per minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637594400
```

---

## Best Practices

1. **Authentication**
   - Store JWT tokens securely
   - Refresh tokens before expiry
   - Use HTTPS in production

2. **Error Handling**
   - Implement retry logic with exponential backoff
   - Handle rate limiting gracefully
   - Log errors for debugging

3. **Performance**
   - Use pagination for large datasets
   - Cache responses when appropriate
   - Minimize API calls by batching requests

4. **Security**
   - Validate webhook signatures
   - Never expose API keys in client-side code
   - Use environment variables for sensitive data

---

## Support

For API support and technical assistance:
- **Email:** api-support@bidchemz.com
- **Documentation:** https://docs.bidchemz.com
- **Status Page:** https://status.bidchemz.com

---

**Last Updated:** November 21, 2025
**API Version:** 1.0.0
