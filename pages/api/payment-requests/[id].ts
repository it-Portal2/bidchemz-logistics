import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { UserRole, PaymentRequestStatus, TransactionType } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      const request = await prisma.paymentRequest.findUnique({
        where: { id: id as string },
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
      });

      if (!request) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      if (user.role !== UserRole.ADMIN && request.userId !== user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json({ request });
    }

    if (req.method === 'PUT') {
      if (user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can approve or reject payment requests' });
      }

      const { status, reviewNotes } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
      }

      const paymentRequest = await prisma.paymentRequest.findUnique({
        where: { id: id as string },
      });

      if (!paymentRequest) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      if (paymentRequest.status !== PaymentRequestStatus.PENDING) {
        return res.status(400).json({ error: 'Payment request has already been reviewed' });
      }

      if (status === 'APPROVED') {
        let wallet = await prisma.leadWallet.findUnique({
          where: { userId: paymentRequest.userId },
        });

        if (!wallet) {
          wallet = await prisma.leadWallet.create({
            data: {
              userId: paymentRequest.userId,
              balance: 0,
            },
          });
        }

        const result = await prisma.$transaction(async (tx) => {
          const updatedRequest = await tx.paymentRequest.update({
            where: { id: id as string },
            data: {
              status: PaymentRequestStatus.APPROVED,
              reviewedBy: user.userId,
              reviewedAt: new Date(),
              reviewNotes,
            },
          });

          const updatedWallet = await tx.leadWallet.update({
            where: { userId: paymentRequest.userId },
            data: {
              balance: { increment: paymentRequest.amount },
            },
          });

          const transaction = await tx.leadTransaction.create({
            data: {
              walletId: wallet.id,
              transactionType: TransactionType.CREDIT,
              amount: paymentRequest.amount,
              description: `Manual recharge approved by admin (Ref: ${paymentRequest.referenceNumber || 'N/A'})`,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: user.userId,
              action: 'APPROVE_PAYMENT_REQUEST',
              entity: 'PaymentRequest',
              entityId: paymentRequest.id,
              changes: { 
                amount: paymentRequest.amount, 
                userId: paymentRequest.userId,
                newBalance: updatedWallet.balance 
              },
            },
          });

          return { updatedRequest, updatedWallet, transaction };
        });

        return res.status(200).json({
          message: 'Payment request approved and wallet credited successfully',
          newBalance: result.updatedWallet.balance,
          transaction: result.transaction,
        });
      } else {
        await prisma.paymentRequest.update({
          where: { id: id as string },
          data: {
            status: PaymentRequestStatus.REJECTED,
            reviewedBy: user.userId,
            reviewedAt: new Date(),
            reviewNotes,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.userId,
            action: 'REJECT_PAYMENT_REQUEST',
            entity: 'PaymentRequest',
            entityId: paymentRequest.id,
            changes: { reviewNotes },
          },
        });

        return res.status(200).json({
          message: 'Payment request rejected',
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payment request action error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
