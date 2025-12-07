import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { QuoteStatus, UserRole } from '@prisma/client';
import { findMatchingPartners, notifyMatchedPartners } from '@/lib/matching-engine';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const where: any = {};

      if (req.user!.role === UserRole.TRADER) {
        where.traderId = req.user!.userId;
      }

      if (status && typeof status === 'string') {
        where.status = status as QuoteStatus;
      }

      const quotes = await prisma.quote.findMany({
        where,
        include: {
          trader: {
            select: {
              id: true,
              email: true,
              companyName: true,
            },
          },
          offers: {
            select: {
              id: true,
              price: true,
              status: true,
              partnerId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await prisma.quote.count({ where });

      res.status(200).json({
        quotes,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  } else if (req.method === 'POST') {
    try {
      if (req.user!.role !== UserRole.TRADER) {
        return res.status(403).json({
          error: 'Only traders can create freight requests',
        });
      }

      const quoteData = req.body;

      if (!quoteData.cargoName || !quoteData.quantity || !quoteData.quantityUnit ||
          !quoteData.cargoReadyDate || !quoteData.pickupAddress || !quoteData.pickupCity ||
          !quoteData.pickupState || !quoteData.pickupPincode || !quoteData.deliveryAddress ||
          !quoteData.deliveryCity || !quoteData.deliveryState || !quoteData.deliveryPincode ||
          !quoteData.packagingType) {
        return res.status(400).json({
          error: 'Missing required fields. Please check all mandatory sections.',
        });
      }

      if (quoteData.isHazardous && !quoteData.hazardClass) {
        return res.status(400).json({
          error: 'Hazard class is required for hazardous cargo',
        });
      }

      const quoteNumber = `FRQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const quote = await prisma.quote.create({
        data: {
          quoteNumber,
          traderId: req.user!.userId,
          status: QuoteStatus.SUBMITTED,
          cargoName: quoteData.cargoName,
          casNumber: quoteData.casNumber || null,
          quantity: quoteData.quantity,
          quantityUnit: quoteData.quantityUnit,
          isHazardous: quoteData.isHazardous,
          hazardClass: quoteData.hazardClass || null,
          unNumber: quoteData.unNumber || null,
          cargoReadyDate: new Date(quoteData.cargoReadyDate),
          estimatedDeliveryDate: quoteData.estimatedDeliveryDate
            ? new Date(quoteData.estimatedDeliveryDate)
            : null,
          pickupAddress: quoteData.pickupAddress,
          pickupCity: quoteData.pickupCity,
          pickupState: quoteData.pickupState,
          pickupPincode: quoteData.pickupPincode,
          pickupCountry: quoteData.pickupCountry || 'India',
          pickupContactName: quoteData.pickupContactName || null,
          pickupContactPhone: quoteData.pickupContactPhone || null,
          deliveryAddress: quoteData.deliveryAddress,
          deliveryCity: quoteData.deliveryCity,
          deliveryState: quoteData.deliveryState,
          deliveryPincode: quoteData.deliveryPincode,
          deliveryCountry: quoteData.deliveryCountry || 'India',
          deliveryContactName: quoteData.deliveryContactName || null,
          deliveryContactPhone: quoteData.deliveryContactPhone || null,
          packagingType: quoteData.packagingType,
          packagingDetails: quoteData.packagingDetails || null,
          specialHandling: quoteData.specialHandling || null,
          temperatureControlled: quoteData.temperatureControlled || false,
          temperatureMin: quoteData.temperatureMin || null,
          temperatureMax: quoteData.temperatureMax || null,
          preferredVehicleType: quoteData.preferredVehicleType || [],
          vehicleSpecifications: quoteData.vehicleSpecifications || null,
          insuranceRequired: quoteData.insuranceRequired || false,
          insuranceValue: quoteData.insuranceValue || null,
          msdsRequired: quoteData.msdsRequired || false,
          paymentTerms: quoteData.paymentTerms || null,
          billingAddress: quoteData.billingAddress || null,
          additionalNotes: quoteData.additionalNotes || null,
          expiresAt,
          submittedAt: new Date(),
        },
        include: {
          trader: {
            select: {
              id: true,
              email: true,
              companyName: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          quoteId: quote.id,
          action: 'CREATE',
          entity: 'QUOTE',
          entityId: quote.id,
          changes: { quoteNumber: quote.quoteNumber },
        },
      });

      try {
        const { sendWebhook } = await import('@/lib/webhook');
        await sendWebhook(
          process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks',
          'QUOTE_REQUESTED',
          {
            quoteId: quote.id,
            quoteNumber: quote.quoteNumber,
            traderId: quote.traderId,
            cargoName: quote.cargoName,
            pickupCity: quote.pickupCity,
            deliveryCity: quote.deliveryCity,
          }
        ).catch(err => console.error('Webhook error:', err));
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
      }

      try {
        const matchedPartners = await findMatchingPartners(quote.id);
        await notifyMatchedPartners(quote.id, matchedPartners);
        
        if (matchedPartners.length > 0) {
          const { startQuoteTimer } = await import('@/lib/quote-timer');
          const timerExpiresAt = await startQuoteTimer({
            quoteId: quote.id,
            timerDurationMinutes: 60,
            enableWarnings: true,
          });
          
          await prisma.quote.update({
            where: { id: quote.id },
            data: { 
              status: QuoteStatus.MATCHING,
              expiresAt: timerExpiresAt,
            },
          });
        }
      } catch (matchError) {
        console.error('Error matching partners:', matchError);
      }

      res.status(201).json({
        quote,
        message: 'Freight request created successfully',
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ error: 'Failed to create freight request' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
