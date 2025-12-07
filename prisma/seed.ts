import { PrismaClient, UserRole, SubscriptionTier, PaymentMethod } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from '../lib/auth';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Create Admin User
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
  console.log('✅ Created admin user:', admin.email);

  // Create Trader User
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
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created trader user:', trader.email);

  // Create Partner User
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
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created partner user:', partner.email);

  // Create Lead Wallet for Partner
  const wallet = await prisma.leadWallet.upsert({
    where: { userId: partner.id },
    update: {},
    create: {
      userId: partner.id,
      balance: 5000,
      currency: 'INR',
      lowBalanceAlert: true,
      alertThreshold: 1000,
    },
  });
  console.log('✅ Created lead wallet with balance: ₹5000');

  // Create Partner Capabilities
  const capabilities = await prisma.partnerCapability.upsert({
    where: { userId: partner.id },
    update: {},
    create: {
      userId: partner.id,
      serviceTypes: ['Full Truck Load', 'Part Truck Load', 'Container'],
      dgClasses: ['NON_HAZARDOUS', 'CLASS_3', 'CLASS_8'],
      productCategories: ['Chemicals', 'Petroleum Products'],
      serviceCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'],
      serviceStates: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'],
      serviceCountries: ['India'],
      fleetTypes: ['TRUCK', 'TANKER', 'CONTAINER'],
      fleetCount: 25,
      hasWarehouse: true,
      warehouseLocations: ['Mumbai', 'Bangalore'],
      temperatureControlled: true,
      temperatureRange: '-5°C to 45°C',
      packagingCapabilities: ['DRUMS', 'TANKER', 'IBC'],
      certifications: ['ISO 9001', 'HACCP', 'DG Certified'],
      subscriptionTier: SubscriptionTier.STANDARD,
    },
  });
  console.log('✅ Created partner capabilities');

  // Create Pricing Configuration
  const pricingConfig = await prisma.pricingConfig.upsert({
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
  console.log('✅ Created pricing configuration');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test Accounts Created:');
  console.log('├─ Admin: admin@bidchemz.com / Admin@123');
  console.log('├─ Trader: trader@example.com / Trader@123');
  console.log('└─ Partner: partner@logistics.com / Partner@123');
  console.log('\n💰 Partner wallet balance: ₹5,000');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
