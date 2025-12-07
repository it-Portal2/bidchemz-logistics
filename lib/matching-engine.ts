import prisma from './prisma';
import { UserRole, SubscriptionTier, HazardClass } from '@prisma/client';

interface Quote {
  id: string;
  isHazardous: boolean;
  hazardClass: HazardClass | null;
  packagingType: string;
  pickupState: string;
  deliveryState: string;
  preferredVehicleType: string[];
  temperatureControlled: boolean;
}

export async function findMatchingPartners(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  const partners = await prisma.user.findMany({
    where: {
      role: UserRole.LOGISTICS_PARTNER,
      isActive: true,
      isVerified: true,
    },
    include: {
      partnerCapability: true,
      leadWallet: true,
    },
  });

  const matchedPartners = partners.filter((partner) => {
    const capability = partner.partnerCapability;

    if (!capability) return false;

    if (quote.isHazardous) {
      if (!capability.dgClasses.includes(quote.hazardClass!)) {
        return false;
      }
    }

    const servesPickupState = capability.serviceStates.includes(quote.pickupState);
    const servesDeliveryState = capability.serviceStates.includes(quote.deliveryState);

    if (!servesPickupState || !servesDeliveryState) {
      return false;
    }

    if (!capability.packagingCapabilities.includes(quote.packagingType as any)) {
      return false;
    }

    if (quote.preferredVehicleType.length > 0) {
      const hasMatchingVehicle = quote.preferredVehicleType.some((vt) =>
        capability.fleetTypes.includes(vt as any)
      );
      if (!hasMatchingVehicle) {
        return false;
      }
    }

    if (quote.temperatureControlled && !capability.temperatureControlled) {
      return false;
    }

    const wallet = partner.leadWallet;
    if (!wallet || wallet.balance <= 0) {
      return false;
    }

    return true;
  });

  const prioritizedPartners = matchedPartners.sort((a, b) => {
    const tierPriority = {
      [SubscriptionTier.PREMIUM]: 3,
      [SubscriptionTier.STANDARD]: 2,
      [SubscriptionTier.FREE]: 1,
    };

    const aTier = a.partnerCapability?.subscriptionTier || SubscriptionTier.FREE;
    const bTier = b.partnerCapability?.subscriptionTier || SubscriptionTier.FREE;

    return tierPriority[bTier] - tierPriority[aTier];
  });

  return prioritizedPartners.map((partner) => ({
    partnerId: partner.id,
    email: partner.email,
    companyName: partner.companyName,
    subscriptionTier: partner.partnerCapability?.subscriptionTier,
  }));
}

export async function notifyMatchedPartners(quoteId: string, partners: any[]) {
  const { notifyPartnerAboutNewLead } = await import('./notifications');
  
  console.log(`Notifying ${partners.length} matched partners for quote ${quoteId}`);
  
  const notificationPromises = partners.map((partner) =>
    notifyPartnerAboutNewLead(partner.partnerId, quoteId, {
      email: partner.email,
      companyName: partner.companyName,
      tier: partner.subscriptionTier,
    })
  );

  await Promise.allSettled(notificationPromises);
  
  console.log(`Successfully sent notifications to ${partners.length} partners`);
}
