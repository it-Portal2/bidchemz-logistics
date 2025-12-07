export interface PolicyVersion {
  version: string;
  effectiveDate: Date;
  content: string;
}

export const PARTNER_POLICY: PolicyVersion = {
  version: '1.0',
  effectiveDate: new Date('2025-11-20'),
  content: `Bidchemz Logistics Partner Policy

1. Purpose

Bidchemz aims to provide safe, reliable, and compliant Logistics-as-a-Service (LaaS) for the movement of industrial chemicals across India. This policy defines the minimum standards and responsibilities for all logistics partners onboarding onto the Bidchemz platform.

2. Scope

This policy applies to all logistics companies offering transportation, warehousing, multimodal movement, DG handling, or value-added services for industrial chemicals through Bidchemz.

3. Mandatory Requirements

a. Regulatory Compliance

• Valid DG (Dangerous Goods) licences wherever applicable
• GST registration and required transport permits
• Compliance with Motor Vehicle Act, Pollution Control Board norms, and relevant port/airport regulations
• Adherence to SDS guidelines for each chemical handled

b. Safety & EHS Standards

• DG/HAZMAT trained staff for handling and transport
• Proper PPE, spill kits, and emergency response readiness
• Safe loading/unloading SOPs
• Segregation practices for incompatible chemicals
• Adherence to ISO 45001 / ISO 14001 (preferred but not mandatory)

c. Insurance Coverage

Partners must maintain:
• Goods-in-Transit (GIT) insurance
• Public Liability insurance
• Pollution Liability insurance (preferred for hazardous cargo)

4. Operational Requirements

Fleet & Infrastructure

• GPS-enabled fleet for live tracking
• Well-maintained tankers, ISO tank chassis, and chemical-compliant vehicles
• Warehousing partners must provide:
  - Fire-safety compliance
  - DG zones and segregation
  - Ventilation and temperature-control (where required)

Technology Integration

• Ability to integrate with Bidchemz TMS/API (tracking, POD updates)
• Digital documentation capability (POD, invoice, LR)

5. Service Level Expectations

• Accurate and timely pickup/delivery
• Transparent pricing
• Real-time status updates
• Immediate escalation for incidents
• 24/7 support for hazardous cargo (if applicable)

6. Responsibilities of Logistics Partners

• Ensure safe handling and transport of chemical cargo
• Maintain confidentiality of Bidchemz user data
• Follow all SOPs and contractual commitments
• Report incidents within 60 minutes
• Provide compliance documents during onboarding and periodically thereafter

7. Bidchemz Responsibilities

Bidchemz will:
• Provide verified shipment details
• Ensure transparent communication between buyer, seller, and logistics partner
• Support partners in technology integration
• Provide visibility and business opportunities through the platform

8. Disqualification Criteria

Partners may be suspended or removed from the platform for:
• Repeated safety violations
• Misrepresentation of documents
• Non-compliance with DG rules
• Poor service quality or customer complaints
• Data misuse or breach of confidentiality

9. Acceptance

By onboarding, the logistics partner agrees to comply with this policy and all supporting documents issued by Bidchemz.`,
};

export const TERMS_OF_SERVICE: PolicyVersion = {
  version: '1.0',
  effectiveDate: new Date('2025-11-20'),
  content: `Terms of Service

1. Acceptance of Terms

By accessing and using BidChemz Logistics platform, you accept and agree to be bound by these Terms of Service.

2. User Accounts

• You must provide accurate and complete information
• You are responsible for maintaining the security of your account
• You must notify us immediately of any unauthorized access

3. Use of Platform

• You agree to use the platform only for lawful purposes
• You will not misuse or abuse the platform
• You will comply with all applicable laws and regulations

4. Pricing and Payment

• Traders and partners agree to the pricing structure as displayed
• All payments are final and non-refundable unless otherwise specified
• Lead fees will be automatically deducted from partner wallets

5. Limitation of Liability

BidChemz is not liable for any indirect, incidental, or consequential damages arising from use of the platform.

6. Data Protection

We are committed to protecting your personal data in accordance with applicable data protection laws.

7. Termination

We reserve the right to suspend or terminate accounts that violate these terms.

8. Changes to Terms

We may update these terms from time to time. Continued use constitutes acceptance of updated terms.

9. Governing Law

These terms are governed by the laws of India.

Last Updated: November 20, 2025`,
};

export const PRIVACY_POLICY: PolicyVersion = {
  version: '1.0',
  effectiveDate: new Date('2025-11-20'),
  content: `Privacy Policy

1. Information We Collect

• Account information (name, email, phone, company details)
• Business information (freight requests, quotations, shipment details)
• Usage data (how you interact with our platform)
• Payment information (processed securely through payment processors)

2. How We Use Your Information

• To provide and improve our services
• To process transactions and send notifications
• To communicate with you about your account
• To comply with legal obligations
• To prevent fraud and ensure platform security

3. Information Sharing

We do not sell your personal data. We may share information with:
• Authorized logistics partners (only relevant freight details)
• Service providers (payment processors, email services)
• Law enforcement when legally required

4. Data Security

• We use industry-standard encryption (AES-256) for sensitive data
• All connections are secured with SSL/TLS
• Access to personal data is restricted to authorized personnel only

5. Your Rights

Under data protection laws, you have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion of your data
• Export your data
• Opt-out of marketing communications

6. Data Retention

We retain your data for as long as your account is active or as needed to provide services. You can request deletion at any time.

7. Cookies

We use cookies to enhance your experience. You can control cookies through your browser settings.

8. Children's Privacy

Our platform is not intended for users under 18 years of age.

9. International Data Transfers

Your data may be transferred to and processed in locations outside your country of residence.

10. Contact Us

For privacy-related questions, contact: privacy@bidchemz.com

Last Updated: November 20, 2025`,
};
