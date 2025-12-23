import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { secureDeleteFile } from '@/lib/file-encryption';
import path from 'path';
import fs from 'fs';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid document ID' });
    }

    /* ----------------------------- DELETE DOCUMENT ----------------------------- */
    if (req.method === 'DELETE') {
        try {
            // 1. Fetch the document details to verify permissions
            const document = await prisma.document.findUnique({
                where: { id },
                include: {
                    quote: {
                        select: { traderId: true },
                    },
                },
            });

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            // 2. Check Permissions
            // Allow deletion if:
            // - Users is the uploader
            // - User is the Trader who owns the quote (and document is attached to quote)
            // - User is Admin
            const isUploader = document.uploadedBy === req.user!.userId;
            const isQuoteOwner = document.quote?.traderId === req.user!.userId;
            const isAdmin = req.user!.role === 'ADMIN';

            if (!isUploader && !isQuoteOwner && !isAdmin) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to delete this document' });
            }

            // 3. Delete file from filesystem
            const fileUrl = document.fileUrl.startsWith('/')
                ? document.fileUrl.substring(1)
                : document.fileUrl;
            const encryptedFilePath = path.join(process.cwd(), fileUrl);

            // Only attempt to delete if file exists
            if (fs.existsSync(encryptedFilePath)) {
                await secureDeleteFile(encryptedFilePath);
            } else {
                console.warn(`File not found at ${encryptedFilePath}, skipping filesystem deletion.`);
            }

            // 4. Delete record from database
            await prisma.document.delete({
                where: { id },
            });

            // 5. Audit Log
            await prisma.auditLog.create({
                data: {
                    userId: req.user!.userId,
                    quoteId: document.quoteId || undefined,
                    shipmentId: document.shipmentId || undefined,
                    action: 'DELETE_DOCUMENT',
                    entity: 'DOCUMENT',
                    entityId: id,
                    changes: {
                        fileName: document.fileName,
                        fileUrl: document.fileUrl,
                    },
                },
            });

            return res.status(200).json({ message: 'Document deleted successfully' });

        } catch (error) {
            console.error('Error deleting document:', error);
            return res.status(500).json({ error: 'Failed to delete document' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
