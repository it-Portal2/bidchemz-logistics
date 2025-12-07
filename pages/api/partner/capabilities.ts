import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
    return res.status(403).json({
      error: 'Only logistics partners can manage capabilities',
    });
  }

  if (req.method === 'GET') {
    try {
      const capabilities = await prisma.partnerCapability.findUnique({
        where: { userId: req.user!.userId },
      });

      res.status(200).json({ capabilities });
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      res.status(500).json({ error: 'Failed to fetch capabilities' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        dgClasses,
        serviceStates,
        fleetTypes,
        packagingCapabilities,
        temperatureControlled,
        subscriptionTier,
      } = req.body;

      const capabilities = await prisma.partnerCapability.upsert({
        where: { userId: req.user!.userId },
        update: {
          dgClasses: dgClasses || [],
          serviceStates: serviceStates || [],
          fleetTypes: fleetTypes || [],
          packagingCapabilities: packagingCapabilities || [],
          temperatureControlled: temperatureControlled || false,
          subscriptionTier: subscriptionTier || 'FREE',
        },
        create: {
          userId: req.user!.userId,
          serviceTypes: [],
          dgClasses: dgClasses || [],
          productCategories: [],
          serviceCities: [],
          serviceStates: serviceStates || [],
          serviceCountries: ['India'],
          fleetTypes: fleetTypes || [],
          packagingCapabilities: packagingCapabilities || [],
          temperatureControlled: temperatureControlled || false,
          certifications: [],
          warehouseLocations: [],
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'UPDATE_CAPABILITIES',
          entity: 'PARTNER_CAPABILITY',
          entityId: capabilities.id,
          changes: req.body,
        },
      });

      res.status(200).json({
        capabilities,
        message: 'Capabilities updated successfully',
      });
    } catch (error) {
      console.error('Error updating capabilities:', error);
      res.status(500).json({ error: 'Failed to update capabilities' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
