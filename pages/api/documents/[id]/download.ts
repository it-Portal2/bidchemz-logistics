import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { decryptBuffer } from '@/lib/file-encryption';
import fs from 'fs';
import path from 'path';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        quote: {
          select: {
            traderId: true,
          },
        },
        shipment: {
          select: {
            offer: {
              select: {
                partnerId: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const isTrader = document.quote?.traderId === req.user!.userId;
    const isPartner = document.shipment?.offer.partnerId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTrader && !isPartner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!document.encryptionKey) {
      return res.status(500).json({ error: 'Document encryption key not found' });
    }

    const fileUrl = document.fileUrl.startsWith('/') 
      ? document.fileUrl.substring(1) 
      : document.fileUrl;
    const encryptedFilePath = path.join(process.cwd(), fileUrl);

    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const encryptedBuffer = await fs.promises.readFile(encryptedFilePath);

    const decryptedBuffer = await decryptBuffer(
      encryptedBuffer,
      document.encryptionKey
    );

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        quoteId: document.quoteId || undefined,
        shipmentId: document.shipmentId || undefined,
        action: 'DOWNLOAD_DOCUMENT',
        entity: 'DOCUMENT',
        entityId: document.id,
      },
    });

    res.setHeader('Content-Type', document.fileType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.fileName}"`
    );
    res.setHeader('Content-Length', decryptedBuffer.length);

    res.send(decryptedBuffer);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
}

export default withAuth(handler);
