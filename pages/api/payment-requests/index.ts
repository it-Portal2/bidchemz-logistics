import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { PaymentRequestStatus, UserRole } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      if (user.role === UserRole.ADMIN) {
        const { status } = req.query;
        
        const requests = await prisma.paymentRequest.findMany({
          where: status ? { status: status as PaymentRequestStatus } : {},
          include: {
            user: {
              select: {
                id: true,
                email: true,
                companyName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ requests });
      } else {
        const requests = await prisma.paymentRequest.findMany({
          where: { userId: user.userId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                companyName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ requests });
      }
    }

    if (req.method === 'POST') {
      if (user.role !== UserRole.LOGISTICS_PARTNER) {
        return res.status(403).json({ error: 'Only logistics partners can request wallet recharges' });
      }

      const {
        amount,
        paymentMethod,
        referenceNumber,
        transactionId,
        paymentDate,
        requestNotes,
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!paymentMethod) {
        return res.status(400).json({ error: 'Payment method is required' });
      }

      const paymentRequest = await prisma.paymentRequest.create({
        data: {
          userId: user.userId,
          amount,
          paymentMethod,
          referenceNumber,
          transactionId,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          requestNotes,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CREATE_PAYMENT_REQUEST',
          entity: 'PaymentRequest',
          entityId: paymentRequest.id,
          changes: { amount, paymentMethod },
        },
      });

      return res.status(201).json({
        message: 'Payment request submitted successfully',
        request: paymentRequest,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payment request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
