import { NextApiRequest, NextApiResponse } from 'next';
import {
  checkExpiringQuotes,
  expireQuotes,
  checkLowBalanceAlerts,
  retryFailedWebhooks,
} from '@/lib/background-jobs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = await Promise.allSettled([
      checkExpiringQuotes(),
      expireQuotes(),
      checkLowBalanceAlerts(),
      retryFailedWebhooks(),
    ]);

    const summary = {
      timestamp: new Date().toISOString(),
      jobs: [
        {
          name: 'checkExpiringQuotes',
          status: results[0].status,
        },
        {
          name: 'expireQuotes',
          status: results[1].status,
        },
        {
          name: 'checkLowBalanceAlerts',
          status: results[2].status,
        },
        {
          name: 'retryFailedWebhooks',
          status: results[3].status,
        },
      ],
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Background jobs error:', error);
    return res.status(500).json({ error: 'Failed to run background jobs' });
  }
}
