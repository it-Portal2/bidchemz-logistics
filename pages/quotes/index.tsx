import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function QuotesList() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch('/api/quotes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchQuotes();
  }, [user, router, fetchQuotes]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      DRAFT: 'neutral',
      SUBMITTED: 'primary',
      MATCHING: 'warning',
      OFFERS_AVAILABLE: 'success',
      SELECTED: 'success',
      CANCELLED: 'danger',
      EXPIRED: 'danger',
    };
    return colors[status] || 'neutral';
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Freight Requests</h1>
          <Link href="/quotes/new">
            <Button variant="primary">Create New Request</Button>
          </Link>
        </div>

        {quotes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't created any freight requests yet</p>
              <Link href="/quotes/new">
                <Button variant="primary">Create Your First Request</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote: any) => (
              <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quote.quoteNumber}
                      </h3>
                      <Badge variant={getStatusColor(quote.status)}>
                        {quote.status.replace('_', ' ')}
                      </Badge>
                      {quote.offers && quote.offers.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {quote.offers.length} offer{quote.offers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Cargo:</span> {quote.cargoName}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {quote.quantity} {quote.quantityUnit}
                      </div>
                      <div>
                        <span className="font-medium">From:</span> {quote.pickupCity}, {quote.pickupState}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {quote.deliveryCity}, {quote.deliveryState}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Ready: {new Date(quote.cargoReadyDate).toLocaleDateString()}
                    </div>
                  </div>

                  <Link href={`/quotes/${quote.id}`}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
