import { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { UserRole, OfferStatus, TransactionType } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const userId = req.user!.userId;

        if (req.user!.role !== UserRole.LOGISTICS_PARTNER) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { limit = '10' } = req.query;
        const limitNum = parseInt(limit as string);

        // 1. Fetch recent Offers (Submitted, Accepted, Rejected)
        // We fetch offers and look at createdAt (for submission) and updatedAt (for status change)
        // This is a bit approximate for "Accepted/Rejected" timing if we only have updatedAt, 
        // but usually sufficient.
        const recentOffers = await prisma.offer.findMany({
            where: {
                partnerId: userId,
            },
            include: {
                quote: {
                    select: {
                        id: true,
                        cargoName: true,
                        pickupCity: true,
                        deliveryCity: true,
                        quoteNumber: true,
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: limitNum,
        });

        // 2. Fetch recent Wallet Transactions (Lead Fees)
        const recentTransactions = await prisma.leadTransaction.findMany({
            where: {
                wallet: {
                    userId: userId,
                },
                transactionType: TransactionType.DEBIT, // Lead fees are debits
            },
            include: {
                wallet: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limitNum,
        });

        // 3. Fetch recent "New Leads" (Quotes)
        // In a real system, we'd filter by partner capabilities. 
        // For now, we take recent quotes that are in a connectable state.
        const recentLeads = await prisma.quote.findMany({
            where: {
                status: {
                    in: ['MATCHING', 'OFFERS_AVAILABLE'],
                },
                // Ideally we filter out ones the partner has already offered on,
                // but for "activity feed" showing "New Lead" is okay even if processed.
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limitNum,
        });

        // Combine and standardize
        let activities = [];

        // Process Offers
        for (const offer of recentOffers) {
            // Offer Submitted
            // If created recently (msg logic: created within 5 mins of updated... or just treat creation as an event)
            // Simpler: If created == updated, it's a submission. 
            // If updated > created, it's a status update (Accepted/Rejected).
            // We can duplicate if needed, but let's try to infer the primary recent event.

            const isSubmission = offer.createdAt.getTime() === offer.updatedAt.getTime();
            const time = offer.updatedAt; // Use the most recent timestamp

            if (isSubmission) {
                activities.push({
                    id: `offer_sub_${offer.id}`,
                    type: 'offer_submitted',
                    title: 'Offer Submitted',
                    description: `${offer.quote.cargoName} - ${offer.quote.pickupCity} to ${offer.quote.deliveryCity}`,
                    timestamp: offer.createdAt,
                    color: 'blue',
                    icon: '📤'
                });
            } else {
                // Status update
                if (offer.status === OfferStatus.ACCEPTED) {
                    activities.push({
                        id: `offer_acc_${offer.id}`,
                        type: 'offer_accepted',
                        title: 'Offer Accepted',
                        description: `${offer.quote.cargoName} (Quote #${offer.quote.quoteNumber})`,
                        timestamp: offer.updatedAt,
                        color: 'green',
                        icon: '✅'
                    });
                } else if (offer.status === OfferStatus.REJECTED) {
                    activities.push({
                        id: `offer_rej_${offer.id}`,
                        type: 'offer_rejected',
                        title: 'Offer Rejected',
                        description: `${offer.quote.cargoName}`,
                        timestamp: offer.updatedAt,
                        color: 'red',
                        icon: '❌'
                    });
                }
            }
        }

        // Process Transactions
        for (const tx of recentTransactions) {
            activities.push({
                id: `tx_${tx.id}`,
                type: 'lead_fee',
                title: 'Lead Fee Deducted',
                description: `₹${tx.amount.toLocaleString()} deducted from wallet`,
                timestamp: tx.createdAt,
                color: 'orange',
                icon: '💰'
            });
        }

        // Process New Leads
        for (const lead of recentLeads) {
            activities.push({
                id: `lead_${lead.id}`,
                type: 'new_lead',
                title: 'New Lead Available',
                description: `${lead.cargoName} - ${lead.pickupCity} to ${lead.deliveryCity}`,
                timestamp: lead.createdAt,
                color: 'purple',
                icon: '🆕'
            });
        }

        // Sort by timestamp desc and take limit
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        activities = activities.slice(0, limitNum);

        // Format timestamps to relative string (done by frontend ideally, but we send ISO or helper here)
        // Let's send ISO timestamp and let frontend format it "time ago".
        // But to match current state shape:
        const formattedActivities = activities.map(act => ({
            ...act,
            time: timeAgo(act.timestamp),
        }));

        res.status(200).json({ activities: formattedActivities });

    } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
    }
}

function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
}

export default withAuth(handler);
