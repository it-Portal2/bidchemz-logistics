import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { encryptBuffer, generateEncryptionKey } from '@/lib/file-encryption';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const quoteId = Array.isArray(fields.quoteId) ? fields.quoteId[0] : fields.quoteId;
    const documentType = Array.isArray(fields.documentType) 
      ? fields.documentType[0] 
      : fields.documentType || 'MSDS';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.traderId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);

    const encryptionKey = generateEncryptionKey();
    const { encrypted } = await encryptBuffer(fileBuffer, encryptionKey);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'encrypted');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const encryptedFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.enc`;
    const encryptedFilePath = path.join(uploadsDir, encryptedFileName);

    await fs.promises.writeFile(encryptedFilePath, encrypted);

    await fs.promises.unlink(file.filepath);

    const document = await prisma.document.create({
      data: {
        quoteId,
        fileName: file.originalFilename || 'unknown',
        fileType: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
        fileUrl: `/uploads/encrypted/${encryptedFileName}`,
        encryptionKey,
        documentType,
        uploadedBy: req.user!.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        quoteId,
        action: 'UPLOAD_DOCUMENT',
        entity: 'DOCUMENT',
        entityId: document.id,
        changes: {
          fileName: document.fileName,
          documentType,
        },
      },
    });

    res.status(201).json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        createdAt: document.createdAt,
      },
      message: 'Document uploaded and encrypted successfully',
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

export default withAuth(handler);
