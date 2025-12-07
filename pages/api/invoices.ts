import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { transactionId, format } = req.query;

      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID required' });
      }

      const transaction = await prisma.leadTransaction.findUnique({
        where: { id: String(transactionId) },
        include: {
          wallet: { include: { user: true } },
          offer: { include: { quote: true, partner: true } },
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check authorization - ONLY the owner can access their invoices
      // Even admins must use proper admin endpoints for financial auditing with logging
      if (transaction.wallet.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Cannot access this invoice' });
      }

      // Generate PDF if requested
      if (format === 'pdf') {
        try {
          const doc = new PDFDocument();
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="invoice-${transaction.id}.pdf"`
          );
          doc.pipe(res);

        // Header
        doc.fontSize(20).text('BidChemz Logistics Invoice', 100, 50);
        doc.fontSize(10).text(`Invoice #: INV-${transaction.id.slice(0, 8).toUpperCase()}`, 100, 80);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, 95);

        // Partner details
        doc.fontSize(12).text('From:', 100, 130);
        doc.fontSize(10).text('BidChemz Logistics', 100, 145);
        doc.text('GST: 18BID1234A1Z5', 100, 160);

        // User/Partner details
        doc.fontSize(12).text('Bill To:', 350, 130);
        doc.fontSize(10).text(transaction.wallet.user.companyName || transaction.wallet.user.email, 350, 145);
        doc.text(`GST: ${transaction.wallet.user.gstin || 'N/A'}`, 350, 160);

        // Line items
        doc.moveTo(100, 200).lineTo(500, 200).stroke();
        doc.fontSize(11).text('Description', 100, 215);
        doc.text('Amount', 450, 215);

        const gstRate = 0.18;
        const baseAmount = transaction.amount;
        const gstAmount = baseAmount * gstRate;
        const totalAmount = baseAmount + gstAmount;

        doc.fontSize(10).text(`Lead Commission (Lead ID: ${transaction.leadId.slice(0, 8)})`, 100, 240);
        doc.text(`₹${baseAmount.toFixed(2)}`, 450, 240);

        doc.text('GST (18%)', 100, 260);
        doc.text(`₹${gstAmount.toFixed(2)}`, 450, 260);

        doc.moveTo(100, 280).lineTo(500, 280).stroke();
        doc.fontSize(12).text('Total Amount', 100, 295);
        doc.text(`₹${totalAmount.toFixed(2)}`, 450, 295);

          // Footer
          doc.fontSize(9).text('Thank you for your business!', 100, 550);
          doc.text('Payment Terms: Due on receipt', 100, 570);

          doc.end();
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF' });
          }
        }
      } else {
        // JSON response
        const gstRate = 0.18;
        const baseAmount = transaction.amount;
        const gstAmount = baseAmount * gstRate;
        const totalAmount = baseAmount + gstAmount;

        res.status(200).json({
          invoice: {
            id: `INV-${transaction.id.slice(0, 8).toUpperCase()}`,
            date: new Date().toISOString(),
            partnerName: transaction.wallet.user.companyName || transaction.wallet.user.email,
            partnerGST: transaction.wallet.user.gstin || null,
            lineItems: [
              {
                description: `Lead Commission (Lead ID: ${transaction.leadId.slice(0, 8)})`,
                amount: baseAmount,
              },
            ],
            subtotal: baseAmount,
            gstRate: '18%',
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            leadType: transaction.leadType,
          },
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
