import { HazardClass, VehicleType, SubscriptionTier } from '@prisma/client';
import prisma from './prisma';

export interface PricingParams {
  hazardClass: HazardClass | null;
  quantity: number;
  pickupState: string;
  deliveryState: string;
  vehicleType: VehicleType[];
  subscriptionTier: SubscriptionTier;
  isUrgent?: boolean;
}

interface PricingMultipliers {
  hazard: Record<HazardClass | 'NON_HAZARDOUS', number>;
  distance: Record<string, number>;
  quantity: { ranges: { min: number; max: number; multiplier: number }[] };
  vehicle: Record<VehicleType, number>;
  urgency: number;
  tier: Record<SubscriptionTier, number>;
}

// Fallback pricing multipliers (used if database is unavailable)
const FALLBACK_PRICING_MULTIPLIERS: PricingMultipliers = {
  hazard: {
    NON_HAZARDOUS: 1.0,
    CLASS_1: 2.5,
    CLASS_2: 1.8,
    CLASS_3: 1.6,
    CLASS_4: 1.5,
    CLASS_5: 1.7,
    CLASS_6: 1.9,
    CLASS_7: 2.0,
    CLASS_8: 1.6,
    CLASS_9: 1.3,
  },
  distance: {
    SAME_STATE: 1.0,
    SHORT: 1.3,
    MEDIUM: 1.6,
    LONG: 2.0,
  },
  quantity: {
    ranges: [
      { min: 0, max: 10, multiplier: 1.5 },
      { min: 10, max: 50, multiplier: 1.2 },
      { min: 50, max: 100, multiplier: 1.0 },
      { min: 100, max: 500, multiplier: 0.9 },
      { min: 500, max: Infinity, multiplier: 0.8 },
    ],
  },
  vehicle: {
    TRUCK: 1.0,
    CONTAINER: 1.1,
    TANKER: 1.3,
    ISO_TANK: 1.5,
    FLATBED: 1.1,
    REFRIGERATED: 1.4,
  },
  urgency: 1.3,
  tier: {
    PREMIUM: 0.7,
    STANDARD: 0.85,
    FREE: 1.0,
  },
};

const FALLBACK_BASE_LEAD_COST = 500;

// Fetch pricing configuration from database
async function getPricingConfig() {
  try {
    const config = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return config;
  } catch (error) {
    console.error('Error fetching pricing config from database:', error);
    return null;
  }
}

// Convert database config to pricing multipliers format
function convertConfigToMultipliers(config: any): { multipliers: PricingMultipliers; baseLeadCost: number } {
  return {
    baseLeadCost: config.baseLeadCost,
    multipliers: {
      hazard: {
        NON_HAZARDOUS: config.hazardNonHazardous,
        CLASS_1: config.hazardClass1,
        CLASS_2: config.hazardClass2,
        CLASS_3: config.hazardClass3,
        CLASS_4: config.hazardClass4,
        CLASS_5: config.hazardClass5,
        CLASS_6: config.hazardClass6,
        CLASS_7: config.hazardClass7,
        CLASS_8: config.hazardClass8,
        CLASS_9: config.hazardClass9,
      },
      distance: {
        SAME_STATE: config.distanceSameState,
        SHORT: config.distanceShort,
        MEDIUM: config.distanceMedium,
        LONG: config.distanceLong,
      },
      quantity: {
        ranges: Array.isArray(config.quantityRanges) 
          ? config.quantityRanges 
          : FALLBACK_PRICING_MULTIPLIERS.quantity.ranges,
      },
      vehicle: {
        TRUCK: config.vehicleTruck,
        CONTAINER: config.vehicleContainer,
        TANKER: config.vehicleTanker,
        ISO_TANK: config.vehicleIsoTank,
        FLATBED: config.vehicleFlatbed,
        REFRIGERATED: config.vehicleRefrigerated,
      },
      urgency: config.urgencyMultiplier,
      tier: {
        PREMIUM: config.tierPremiumDiscount,
        STANDARD: config.tierStandardDiscount,
        FREE: config.tierFreeDiscount,
      },
    },
  };
}

// State-wise distance classification
const STATE_DISTANCES: Record<string, Record<string, string>> = {
  Maharashtra: {
    Maharashtra: 'SAME_STATE',
    Gujarat: 'SHORT',
    Karnataka: 'SHORT',
    Goa: 'SHORT',
    Delhi: 'MEDIUM',
    'Tamil Nadu': 'LONG',
    'West Bengal': 'LONG',
  },
  Gujarat: {
    Gujarat: 'SAME_STATE',
    Maharashtra: 'SHORT',
    Rajasthan: 'SHORT',
    Delhi: 'MEDIUM',
    Karnataka: 'MEDIUM',
  },
  Karnataka: {
    Karnataka: 'SAME_STATE',
    Maharashtra: 'SHORT',
    Goa: 'SHORT',
    'Tamil Nadu': 'SHORT',
    Kerala: 'SHORT',
    'Andhra Pradesh': 'SHORT',
  },
  Delhi: {
    Delhi: 'SAME_STATE',
    Haryana: 'SHORT',
    'Uttar Pradesh': 'SHORT',
    Punjab: 'SHORT',
    Rajasthan: 'SHORT',
    Maharashtra: 'MEDIUM',
    Gujarat: 'MEDIUM',
  },
  // Add more states as needed
};

function getDistanceMultiplier(pickupState: string, deliveryState: string, multipliers: PricingMultipliers): number {
  if (pickupState === deliveryState) {
    return multipliers.distance.SAME_STATE;
  }

  const distanceType =
    STATE_DISTANCES[pickupState]?.[deliveryState] ||
    STATE_DISTANCES[deliveryState]?.[pickupState] ||
    'MEDIUM';

  return multipliers.distance[distanceType as keyof typeof multipliers.distance] || 1.3;
}

function getQuantityMultiplier(quantity: number, multipliers: PricingMultipliers): number {
  const range = multipliers.quantity.ranges.find(
    (r) => quantity >= r.min && quantity < r.max
  );
  return range?.multiplier || 1.0;
}

function getVehicleMultiplier(vehicleTypes: VehicleType[], multipliers: PricingMultipliers): number {
  if (vehicleTypes.length === 0) return 1.0;

  const vehicleMultipliers = vehicleTypes.map(
    (vt) => multipliers.vehicle[vt] || 1.0
  );
  return Math.max(...vehicleMultipliers);
}

// Async version that reads from database
export async function calculateLeadCost(params: PricingParams): Promise<number> {
  const config = await getPricingConfig();
  
  let baseLeadCost: number;
  let multipliers: PricingMultipliers;
  
  if (config) {
    const converted = convertConfigToMultipliers(config);
    baseLeadCost = converted.baseLeadCost;
    multipliers = converted.multipliers;
  } else {
    console.warn('Using fallback pricing configuration');
    baseLeadCost = FALLBACK_BASE_LEAD_COST;
    multipliers = FALLBACK_PRICING_MULTIPLIERS;
  }

  let cost = baseLeadCost;

  // Apply hazard multiplier
  const hazardKey = params.hazardClass || 'NON_HAZARDOUS';
  cost *= multipliers.hazard[hazardKey];

  // Apply distance multiplier
  cost *= getDistanceMultiplier(params.pickupState, params.deliveryState, multipliers);

  // Apply quantity multiplier
  cost *= getQuantityMultiplier(params.quantity, multipliers);

  // Apply vehicle multiplier
  cost *= getVehicleMultiplier(params.vehicleType, multipliers);

  // Apply urgency multiplier
  if (params.isUrgent) {
    cost *= multipliers.urgency;
  }

  // Apply subscription tier discount
  cost *= multipliers.tier[params.subscriptionTier];

  // Round to 2 decimal places
  return Math.round(cost * 100) / 100;
}

// Synchronous version for quick estimates (uses fallback pricing)
export function calculateLeadCostSync(params: PricingParams): number {
  let cost = FALLBACK_BASE_LEAD_COST;

  const hazardKey = params.hazardClass || 'NON_HAZARDOUS';
  cost *= FALLBACK_PRICING_MULTIPLIERS.hazard[hazardKey];

  cost *= getDistanceMultiplier(params.pickupState, params.deliveryState, FALLBACK_PRICING_MULTIPLIERS);
  cost *= getQuantityMultiplier(params.quantity, FALLBACK_PRICING_MULTIPLIERS);
  cost *= getVehicleMultiplier(params.vehicleType, FALLBACK_PRICING_MULTIPLIERS);

  if (params.isUrgent) {
    cost *= FALLBACK_PRICING_MULTIPLIERS.urgency;
  }

  cost *= FALLBACK_PRICING_MULTIPLIERS.tier[params.subscriptionTier];

  return Math.round(cost * 100) / 100;
}

export function getLeadType(subscriptionTier: SubscriptionTier): 'EXCLUSIVE' | 'SHARED' {
  return subscriptionTier === SubscriptionTier.PREMIUM ? 'EXCLUSIVE' : 'SHARED';
}

export async function estimateLeadCostForQuote(quote: any, subscriptionTier?: SubscriptionTier): Promise<number> {
  return await calculateLeadCost({
    hazardClass: quote.hazardClass,
    quantity: quote.quantity,
    pickupState: quote.pickupState,
    deliveryState: quote.deliveryState,
    vehicleType: quote.preferredVehicleType || [],
    subscriptionTier: subscriptionTier || SubscriptionTier.STANDARD,
    isUrgent: false,
  });
}

// Synchronous estimate for quick calculations (uses fallback pricing)
export function estimateLeadCostForQuoteSync(quote: any, subscriptionTier?: SubscriptionTier): number {
  return calculateLeadCostSync({
    hazardClass: quote.hazardClass,
    quantity: quote.quantity,
    pickupState: quote.pickupState,
    deliveryState: quote.deliveryState,
    vehicleType: quote.preferredVehicleType || [],
    subscriptionTier: subscriptionTier || SubscriptionTier.STANDARD,
    isUrgent: false,
  });
}

// Helper function to get pricing breakdown for transparency
export async function getPricingBreakdown(params: PricingParams): Promise<{
  basePrice: number;
  hazardMultiplier: number;
  distanceMultiplier: number;
  quantityMultiplier: number;
  vehicleMultiplier: number;
  urgencyMultiplier: number;
  tierDiscount: number;
  finalCost: number;
  breakdown: string[];
}> {
  const config = await getPricingConfig();
  
  let baseLeadCost: number;
  let multipliers: PricingMultipliers;
  
  if (config) {
    const converted = convertConfigToMultipliers(config);
    baseLeadCost = converted.baseLeadCost;
    multipliers = converted.multipliers;
  } else {
    baseLeadCost = FALLBACK_BASE_LEAD_COST;
    multipliers = FALLBACK_PRICING_MULTIPLIERS;
  }

  const hazardKey = params.hazardClass || 'NON_HAZARDOUS';
  const hazardMult = multipliers.hazard[hazardKey];
  const distanceMult = getDistanceMultiplier(params.pickupState, params.deliveryState, multipliers);
  const quantityMult = getQuantityMultiplier(params.quantity, multipliers);
  const vehicleMult = getVehicleMultiplier(params.vehicleType, multipliers);
  const urgencyMult = params.isUrgent ? multipliers.urgency : 1.0;
  const tierMult = multipliers.tier[params.subscriptionTier];

  const breakdown: string[] = [];
  breakdown.push(`Base Cost: ₹${baseLeadCost}`);
  breakdown.push(`Hazard Class (${hazardKey}): ×${hazardMult}`);
  breakdown.push(`Distance (${params.pickupState} → ${params.deliveryState}): ×${distanceMult}`);
  breakdown.push(`Quantity (${params.quantity}): ×${quantityMult}`);
  if (params.vehicleType.length > 0) {
    breakdown.push(`Vehicle Type: ×${vehicleMult}`);
  }
  if (params.isUrgent) {
    breakdown.push(`Urgent Request: ×${urgencyMult}`);
  }
  breakdown.push(`Subscription Tier (${params.subscriptionTier}): ×${tierMult} discount`);

  const finalCost = await calculateLeadCost(params);

  return {
    basePrice: baseLeadCost,
    hazardMultiplier: hazardMult,
    distanceMultiplier: distanceMult,
    quantityMultiplier: quantityMult,
    vehicleMultiplier: vehicleMult,
    urgencyMultiplier: urgencyMult,
    tierDiscount: tierMult,
    finalCost,
    breakdown,
  };
}
