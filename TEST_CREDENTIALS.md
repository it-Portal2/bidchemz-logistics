# BidChemz Logistics - Test Credentials

## Universal Password
**All test accounts use the same password:** `Test@123`

---

## Test Accounts

### 👤 TRADER ACCOUNTS

#### Trader 1 - ABC Chemicals Ltd
- **Email:** trader1@test.com
- **Password:** Test@123
- **Company:** ABC Chemicals Ltd
- **GSTIN:** 27AABCT1234A1Z5
- **Status:** Active & Verified
- **Features:**
  - 3 quotes created (Active, Matching, Expired)
  - Access to create new freight requests
  - View and compare logistics partner offers
  - Real-time shipment tracking

#### Trader 2 - Global Chemicals Corp
- **Email:** trader2@test.com
- **Password:** Test@123
- **Company:** Global Chemicals Corp
- **GSTIN:** 27AAGCC1234B1Z5
- **Status:** Active & Verified
- **Features:**
  - 2 quotes created (Selected, Active)
  - Full trader dashboard access

---

### 🚚 LOGISTICS PARTNER ACCOUNTS

#### Partner 1 - Express Logistics India (PREMIUM TIER)
- **Email:** partner1@test.com
- **Password:** Test@123
- **Company:** Express Logistics India
- **GSTIN:** 27AAEXP1234C1Z5
- **Subscription:** PREMIUM
- **Wallet Balance:** ₹15,000
- **Coverage:** Pan-India
- **Capabilities:**
  - Hazard Classes: 3, 8, Non-Hazardous
  - Fleet: 50 vehicles (Trucks, Containers, Tankers)
  - States: All major states
  - Temperature controlled: Yes
  - Certifications: ISO 9001, DG handling certified

#### Partner 2 - SafeTrans Logistics (STANDARD TIER)
- **Email:** partner2@test.com
- **Password:** Test@123
- **Company:** SafeTrans Logistics
- **GSTIN:** 27AASFT1234D1Z5
- **Subscription:** STANDARD
- **Wallet Balance:** ₹8,000
- **Coverage:** West India
- **Capabilities:**
  - Hazard Classes: 3, 6, 8
  - Fleet: 25 vehicles
  - States: Maharashtra, Gujarat, Goa
  - Temperature controlled: No

#### Partner 3 - ChemMove Solutions (STANDARD TIER)
- **Email:** partner3@test.com
- **Password:** Test@123
- **Company:** ChemMove Solutions
- **GSTIN:** 27AACMS1234E1Z5
- **Subscription:** STANDARD
- **Wallet Balance:** ₹5,000
- **Coverage:** North India
- **Capabilities:**
  - Hazard Classes: 8, Non-Hazardous
  - Fleet: 15 vehicles
  - States: Delhi, Haryana, Punjab, Uttar Pradesh
  - Temperature controlled: Yes

#### Partner 4 - National Transport Co (FREE TIER)
- **Email:** partner4@test.com
- **Password:** Test@123
- **Company:** National Transport Co
- **GSTIN:** 27AANTC1234F1Z5
- **Subscription:** FREE
- **Wallet Balance:** ₹500 ⚠️ LOW BALANCE!
- **Coverage:** South India
- **Capabilities:**
  - Hazard Classes: Non-Hazardous ONLY
  - Fleet: 10 vehicles
  - States: Karnataka, Tamil Nadu, Kerala
  - Temperature controlled: No

---

### ⚙️ ADMIN ACCOUNT

#### System Administrator
- **Email:** admin@bidchemz.com
- **Password:** Test@123
- **Company:** BidChemz Platform
- **Access Level:** Full system access
- **Permissions:**
  - User management
  - Payment request approval/rejection
  - Pricing tier configuration
  - System health monitoring
  - Lead pricing rules management
  - Analytics dashboard

---

## Sample Data Available

### 📦 QUOTES (5 Total)
1. **Quote 1** - Sulfuric Acid (Class 8, Hazardous)
   - Mumbai → Delhi, 25 MT
   - Status: OFFERS_AVAILABLE
   - 3 offers submitted

2. **Quote 2** - Toluene (Class 3, Flammable)
   - Pune → Surat, 15 MT
   - Status: MATCHING
   - Awaiting partner offers

3. **Quote 3** - Hydrochloric Acid (Class 8, Corrosive)
   - Ahmedabad → Mumbai, 30 MT
   - Status: SELECTED
   - Winner: Partner 1

4. **Quote 4** - Polymer Resin (Non-Hazardous)
   - Bangalore → Chennai, 20 MT
   - Status: OFFERS_AVAILABLE
   - 1 offer from Partner 4

5. **Quote 5** - Ethanol (Class 3, Flammable)
   - Hyderabad → Pune, 18 MT
   - Status: EXPIRED

### 💼 OFFERS (6 Total)
- Multiple competitive offers across different quotes
- Price range: ₹45,000 - ₹132,000
- Various transit times: 2-5 days
- Different value-added services

### 🚛 SHIPMENTS (1 Active)
- Quote 3 shipment currently IN_TRANSIT
- Real-time tracking available
- Status updates recorded

---

## Testing Workflows

### For Traders:
1. Login with trader1@test.com / Test@123
2. View Dashboard → See active quotes and statistics
3. Go to "My Requests" → View all freight requests
4. Click on a quote → View details and offers
5. Compare offers by price, transit time, rating
6. Select best offer (if OFFERS_AVAILABLE status)
7. Create new freight request → Test 9-section form

### For Logistics Partners:
1. Login with partner1@test.com / Test@123
2. View Dashboard → See wallet balance, active offers
3. Go to "Active Leads" → Browse available freight requests
4. Filter by hazard class, location, cargo type
5. Submit an offer → Set price, transit days, services
6. Go to "Wallet" → View balance and transaction history
7. Go to "Capabilities" → Manage service capabilities

### For Admins:
1. Login with admin@bidchemz.com / Test@123
2. View Dashboard → See system metrics and analytics
3. User Management → View all users, verify/suspend accounts
4. Payment Requests → Approve/reject wallet recharge requests
5. Pricing Configuration → Set lead pricing tiers
6. System Health → Monitor platform status

---

## Important Notes

⚠️ **Security:**
- All accounts use test password `Test@123`
- Change passwords in production
- Enable 2FA for admin accounts

💰 **Wallet Balances:**
- Partner 4 has LOW balance (₹500) - test low balance alerts
- Partners can recharge wallet through payment requests
- Admin approves payment requests manually

📊 **Data:**
- All data is for testing purposes only
- Database can be reset using seed script
- Use `npm run db:seed` to regenerate test data

🔄 **Reset Instructions:**
If you need to reset the test data:
```bash
npx prisma db push --force-reset
npx tsx scripts/seed-test-accounts.ts
```

---

## Quick Start Guide

1. **Navigate to the platform:** Open your browser
2. **Choose account type:** Trader, Partner, or Admin
3. **Login:** Use credentials above
4. **Explore features:** Dashboard, forms, tracking, etc.
5. **Test workflows:** Create quotes, submit offers, manage users

---

Last Updated: November 20, 2025
Platform: BidChemz Logistics - Reverse Bidding Platform for Chemical Logistics
