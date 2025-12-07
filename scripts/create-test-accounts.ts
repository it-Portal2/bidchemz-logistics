import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { UserRole, SubscriptionTier } from '@prisma/client';

async function createTestAccounts() {
  console.log('Creating test accounts...\n');

  try {
    // 1. Create Admin User
    const adminPassword = await hashPassword('Admin@123');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@bidchemz.com' },
      update: {},
      create: {
        email: 'admin@bidchemz.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        companyName: 'BidChemz Admin',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Trader User
    const traderPassword = await hashPassword('Trader@123');
    const trader = await prisma.user.upsert({
      where: { email: 'trader@example.com' },
      update: {},
      create: {
        email: 'trader@example.com',
        password: traderPassword,
        role: UserRole.TRADER,
        companyName: 'ABC Chemicals Ltd',
        gstin: 'GST1234567890',
        phone: '+919876543210',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Trader created:', trader.email);

    // 3. Create Partner User
    const partnerPassword = await hashPassword('Partner@123');
    const partner = await prisma.user.upsert({
      where: { email: 'partner@logistics.com' },
      update: {},
      create: {
        email: 'partner@logistics.com',
        password: partnerPassword,
        role: UserRole.LOGISTICS_PARTNER,
        companyName: 'XYZ Logistics Pvt Ltd',
        gstin: 'GST0987654321',
        phone: '+919876543211',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Partner created:', partner.email);

    // 4. Create Partner Wallet
    const wallet = await prisma.leadWallet.upsert({
      where: { userId: partner.id },
      update: {},
      create: {
        userId: partner.id,
        balance: 10000,
        currency: 'INR',
        lowBalanceAlert: true,
        alertThreshold: 1000,
      },
    });
    console.log('✅ Partner wallet created with ₹10,000 balance');

    // 5. Create Partner Capabilities
    await prisma.partnerCapability.upsert({
      where: { userId: partner.id },
      update: {},
      create: {
        userId: partner.id,
        serviceTypes: ['Full Truck Load', 'Part Truck Load', 'Container'],
        dgClasses: ['NON_HAZARDOUS', 'CLASS_3', 'CLASS_8'],
        productCategories: ['Chemicals', 'Petroleum Products', 'Industrial Chemicals'],
        serviceCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'],
        serviceStates: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat'],
        serviceCountries: ['India'],
        fleetTypes: ['TRUCK', 'TANKER', 'CONTAINER'],
        fleetCount: 25,
        hasWarehouse: true,
        warehouseLocations: ['Mumbai', 'Bangalore'],
        temperatureControlled: true,
        temperatureRange: '-5°C to 45°C',
        packagingCapabilities: ['DRUMS', 'TANKER', 'IBC', 'BAGS'],
        certifications: ['ISO 9001', 'HACCP', 'DG Certified'],
        subscriptionTier: SubscriptionTier.STANDARD,
      },
    });
    console.log('✅ Partner capabilities created');

    // 6. Create Pricing Configuration
    await prisma.pricingConfig.upsert({
      where: { id: 'default-pricing-config' },
      update: {},
      create: {
        id: 'default-pricing-config',
        isActive: true,
        baseLeadCost: 500,
        hazardNonHazardous: 1.0,
        hazardClass1: 2.5,
        hazardClass2: 1.8,
        hazardClass3: 1.6,
        hazardClass4: 1.5,
        hazardClass5: 1.7,
        hazardClass6: 1.9,
        hazardClass7: 2.0,
        hazardClass8: 1.6,
        hazardClass9: 1.3,
        distanceSameState: 1.0,
        distanceShort: 1.3,
        distanceMedium: 1.6,
        distanceLong: 2.0,
        quantityRanges: [
          { min: 0, max: 10, multiplier: 1.5 },
          { min: 10, max: 50, multiplier: 1.2 },
          { min: 50, max: 100, multiplier: 1.0 },
          { min: 100, max: 500, multiplier: 0.9 },
          { min: 500, max: 999999, multiplier: 0.8 },
        ],
        vehicleTruck: 1.0,
        vehicleContainer: 1.1,
        vehicleTanker: 1.3,
        vehicleIsoTank: 1.5,
        vehicleFlatbed: 1.1,
        vehicleRefrigerated: 1.4,
        urgencyMultiplier: 1.3,
        tierPremiumDiscount: 0.7,
        tierStandardDiscount: 0.85,
        tierFreeDiscount: 1.0,
      },
    });
    console.log('✅ Pricing configuration created');

    console.log('\n🎉 Test accounts created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('├─ Admin:   admin@bidchemz.com / Admin@123');
    console.log('├─ Trader:  trader@example.com / Trader@123');
    console.log('└─ Partner: partner@logistics.com / Partner@123\n');
    console.log('💰 Partner wallet balance: ₹10,000');

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();
