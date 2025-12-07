import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import { updateWalletAlertSettings } from '@/lib/wallet-alerts';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
    return res.status(403).json({
      error: 'Only logistics partners can manage wallet settings',
    });
  }

  if (req.method === 'GET') {
    try {
      const wallet = await prisma.leadWallet.findUnique({
        where: { userId: req.user!.userId },
        select: {
          lowBalanceAlert: true,
          alertThreshold: true,
          balance: true,
        },
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      res.status(200).json({ settings: wallet });
    } catch (error) {
      console.error('Error fetching wallet settings:', error);
      res.status(500).json({ error: 'Failed to fetch wallet settings' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { lowBalanceAlert, alertThreshold } = req.body;

      if (alertThreshold !== undefined) {
        if (
          typeof alertThreshold !== 'number' ||
          alertThreshold < 0 ||
          alertThreshold > 1000000
        ) {
          return res.status(400).json({
            error: 'Invalid alert threshold (must be between 0 and 1,000,000)',
          });
        }
      }

      const settings: any = {};

      if (lowBalanceAlert !== undefined) {
        settings.lowBalanceAlert = Boolean(lowBalanceAlert);
      }

      if (alertThreshold !== undefined) {
        settings.alertThreshold = alertThreshold;
      }

      await updateWalletAlertSettings(req.user!.userId, settings);

      const updatedWallet = await prisma.leadWallet.findUnique({
        where: { userId: req.user!.userId },
        select: {
          lowBalanceAlert: true,
          alertThreshold: true,
          balance: true,
        },
      });

      res.status(200).json({
        settings: updatedWallet,
        message: 'Wallet settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      res.status(500).json({ error: 'Failed to update wallet settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
