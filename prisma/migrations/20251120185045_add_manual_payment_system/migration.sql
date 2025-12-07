-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRADER', 'LOGISTICS_PARTNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "HazardClass" AS ENUM ('NON_HAZARDOUS', 'CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5', 'CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9');

-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('BAGS', 'DRUMS', 'TANKER', 'ISO_TANK', 'FLEXITANK', 'IBC', 'PALLETS', 'BULK');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'CONTAINER', 'TANKER', 'ISO_TANK', 'FLATBED', 'REFRIGERATED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHING', 'OFFERS_AVAILABLE', 'SELECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('BOOKED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('EXCLUSIVE', 'SHARED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'RECHARGE', 'REFUND');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('QUOTE_REQUESTED', 'QUOTE_OFFERS_AVAILABLE', 'QUOTE_OFFER_SELECTED', 'SHIPMENT_BOOKED', 'SHIPMENT_STATUS_UPDATED', 'LEAD_ASSIGNED', 'LEAD_PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'PARTNER_POLICY');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CHEQUE', 'CASH', 'ONLINE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyName" TEXT,
    "gstin" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "traderId" TEXT NOT NULL,
    "cargoName" TEXT NOT NULL,
    "casNumber" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "isHazardous" BOOLEAN NOT NULL,
    "hazardClass" "HazardClass",
    "unNumber" TEXT,
    "cargoReadyDate" TIMESTAMP(3) NOT NULL,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupPincode" TEXT NOT NULL,
    "pickupCountry" TEXT NOT NULL DEFAULT 'India',
    "pickupContactName" TEXT,
    "pickupContactPhone" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL,
    "deliveryPincode" TEXT NOT NULL,
    "deliveryCountry" TEXT NOT NULL DEFAULT 'India',
    "deliveryContactName" TEXT,
    "deliveryContactPhone" TEXT,
    "packagingType" "PackagingType" NOT NULL,
    "packagingDetails" TEXT,
    "specialHandling" TEXT,
    "temperatureControlled" BOOLEAN NOT NULL DEFAULT false,
    "temperatureMin" DOUBLE PRECISION,
    "temperatureMax" DOUBLE PRECISION,
    "preferredVehicleType" "VehicleType"[],
    "vehicleSpecifications" TEXT,
    "insuranceRequired" BOOLEAN NOT NULL DEFAULT false,
    "insuranceValue" DOUBLE PRECISION,
    "msdsRequired" BOOLEAN NOT NULL DEFAULT false,
    "paymentTerms" TEXT,
    "billingAddress" TEXT,
    "additionalNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "transitDays" INTEGER NOT NULL,
    "offerValidUntil" TIMESTAMP(3) NOT NULL,
    "pickupAvailableFrom" TIMESTAMP(3) NOT NULL,
    "insuranceIncluded" BOOLEAN NOT NULL DEFAULT false,
    "trackingIncluded" BOOLEAN NOT NULL DEFAULT true,
    "customsClearance" BOOLEAN NOT NULL DEFAULT false,
    "valueAddedServices" TEXT[],
    "termsAndConditions" TEXT,
    "remarks" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "selectedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'BOOKED',
    "currentLocation" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualPickupDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "statusUpdates" JSONB[],
    "trackingEvents" JSONB[],
    "podDocument" TEXT,
    "podUploadedAt" TIMESTAMP(3),
    "deliveryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "shipmentId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "encryptionKey" TEXT,
    "documentType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCapability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceTypes" TEXT[],
    "dgClasses" "HazardClass"[],
    "productCategories" TEXT[],
    "serviceCities" TEXT[],
    "serviceStates" TEXT[],
    "serviceCountries" TEXT[],
    "fleetTypes" "VehicleType"[],
    "fleetCount" INTEGER,
    "hasWarehouse" BOOLEAN NOT NULL DEFAULT false,
    "warehouseLocations" TEXT[],
    "temperatureControlled" BOOLEAN NOT NULL DEFAULT false,
    "temperatureRange" TEXT,
    "packagingCapabilities" "PackagingType"[],
    "certifications" TEXT[],
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "lowBalanceAlert" BOOLEAN NOT NULL DEFAULT true,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "offerId" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "leadId" TEXT,
    "leadType" "LeadType",
    "leadCost" DOUBLE PRECISION,
    "creditsDeducted" DOUBLE PRECISION,
    "hazardCategory" "HazardClass",
    "routeDistance" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "vehicleType" "VehicleType",
    "stateWisePricing" JSONB,
    "invoiceId" TEXT,
    "invoiceUrl" TEXT,
    "gstAmount" DOUBLE PRECISION,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL,
    "baseLeadCost" DOUBLE PRECISION NOT NULL,
    "hazardMultiplier" JSONB NOT NULL,
    "distanceMultiplier" JSONB NOT NULL,
    "quantityMultiplier" JSONB NOT NULL,
    "vehicleMultiplier" JSONB NOT NULL,
    "urgencyMultiplier" JSONB NOT NULL,
    "stateWisePricing" JSONB NOT NULL,
    "maxLeadsPerDay" INTEGER,
    "exclusiveLeads" BOOLEAN NOT NULL DEFAULT false,
    "priorityMatching" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "quoteId" TEXT,
    "shipmentId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "event" "WebhookEvent" NOT NULL,
    "payload" JSONB NOT NULL,
    "url" TEXT NOT NULL,
    "hmacSignature" TEXT NOT NULL,
    "status" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNumber" TEXT,
    "transactionId" TEXT,
    "proofDocument" TEXT,
    "paymentDate" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "requestNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "Quote_traderId_idx" ON "Quote"("traderId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_cargoReadyDate_idx" ON "Quote"("cargoReadyDate");

-- CreateIndex
CREATE INDEX "Offer_quoteId_idx" ON "Offer"("quoteId");

-- CreateIndex
CREATE INDEX "Offer_partnerId_idx" ON "Offer"("partnerId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_quoteId_key" ON "Shipment"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_offerId_key" ON "Shipment"("offerId");

-- CreateIndex
CREATE INDEX "Shipment_shipmentNumber_idx" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Document_quoteId_idx" ON "Document"("quoteId");

-- CreateIndex
CREATE INDEX "Document_shipmentId_idx" ON "Document"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerCapability_userId_key" ON "PartnerCapability"("userId");

-- CreateIndex
CREATE INDEX "PartnerCapability_userId_idx" ON "PartnerCapability"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadWallet_userId_key" ON "LeadWallet"("userId");

-- CreateIndex
CREATE INDEX "LeadWallet_userId_idx" ON "LeadWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTransaction_offerId_key" ON "LeadTransaction"("offerId");

-- CreateIndex
CREATE INDEX "LeadTransaction_walletId_idx" ON "LeadTransaction"("walletId");

-- CreateIndex
CREATE INDEX "LeadTransaction_leadId_idx" ON "LeadTransaction"("leadId");

-- CreateIndex
CREATE INDEX "LeadTransaction_transactionType_idx" ON "LeadTransaction"("transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_tierName_key" ON "PricingTier"("tierName");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_subscriptionTier_key" ON "PricingTier"("subscriptionTier");

-- CreateIndex
CREATE INDEX "PricingTier_subscriptionTier_idx" ON "PricingTier"("subscriptionTier");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_event_idx" ON "WebhookLog"("event");

-- CreateIndex
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "PolicyConsent_userId_idx" ON "PolicyConsent"("userId");

-- CreateIndex
CREATE INDEX "PolicyConsent_policyType_idx" ON "PolicyConsent"("policyType");

-- CreateIndex
CREATE INDEX "PaymentRequest_userId_idx" ON "PaymentRequest"("userId");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

-- CreateIndex
CREATE INDEX "PaymentRequest_createdAt_idx" ON "PaymentRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCapability" ADD CONSTRAINT "PartnerCapability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadWallet" ADD CONSTRAINT "LeadWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTransaction" ADD CONSTRAINT "LeadTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "LeadWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTransaction" ADD CONSTRAINT "LeadTransaction_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyConsent" ADD CONSTRAINT "PolicyConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
