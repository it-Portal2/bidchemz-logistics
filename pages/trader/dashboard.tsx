import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { NotificationCenter } from '@/components/NotificationCenter';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function TraderDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    withOffers: 0,
    selected: 0,
    total: 0,
    totalSpend: 0,
    avgQuoteValue: 0,
    lowestRate: 0,
    completedShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch('/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const quotesList = data.quotes || [];
        setQuotes(quotesList);
        
        const selectedQuotes = quotesList.filter((q: any) => q.status === 'SELECTED');
        const totalSpend = selectedQuotes.reduce((sum: number, q: any) => sum + (q.selectedOffer?.price || 0), 0);
        const allOffers = selectedQuotes.flatMap((q: any) => q.offers || []);
        const lowestRate = allOffers.length > 0 ? Math.min(...allOffers.map((o: any) => o.price || Infinity)) : 0;
        
        setStats({
          active: quotesList.filter((q: any) => q.status === 'MATCHING').length,
          withOffers: quotesList.filter((q: any) => q.status === 'OFFERS_AVAILABLE').length,
          selected: selectedQuotes.length,
          total: quotesList.length,
          totalSpend: totalSpend,
          avgQuoteValue: quotesList.length > 0 ? totalSpend / quotesList.length : 0,
          lowestRate: lowestRate === Infinity ? 0 : lowestRate,
          completedShipments: selectedQuotes.length,
        });
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchQuotes();
    }
  }, [token, fetchQuotes]);

  if (!user || user.role !== 'TRADER') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Traders only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trader Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.companyName || user.email}</p>
          </div>
          <Link href="/quotes/new">
            <Button variant="primary" className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Freight Request</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-3">Active Quotes</p>
              <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting offers</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-3">With Offers</p>
              <p className="text-3xl font-bold text-green-600">{stats.withOffers}</p>
              <p className="text-xs text-gray-500 mt-2">Ready to select</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-3">Completed</p>
              <p className="text-3xl font-bold text-purple-600">{stats.completedShipments}</p>
              <p className="text-xs text-gray-500 mt-2">Shipments</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-3">Total Spend</p>
              <p className="text-3xl font-bold text-indigo-600">₹{stats.totalSpend.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">On logistics</p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-1">📈 Avg Quote Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.avgQuoteValue.toFixed(0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-1">💎 Lowest Rate</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.lowestRate.toFixed(0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-gray-600 mb-1">📋 Total Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Freight Requests</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : quotes.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="No Freight Requests Yet"
                    description="Create your first request to receive competitive quotations from pre-verified logistics partners."
                    actionLabel="+ Create Your First Quote"
                    actionHref="/quotes/new"
                  />
                ) : (
                  <div className="divide-y divide-gray-200">
                    {quotes.slice(0, 5).map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/quotes/${quote.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{quote.cargoName}</h4>
                              <Badge variant={
                                quote.status === 'SELECTED' ? 'success' :
                                quote.status === 'OFFERS_AVAILABLE' ? 'primary' :
                                quote.status === 'MATCHING' ? 'warning' :
                                'neutral'
                              }>
                                {quote.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {quote.pickupCity} → {quote.deliveryCity} | {quote.quantity} {quote.quantityUnit}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {quote.quoteNumber} | {quote.offers?.length || 0} offers
                            </p>
                          </div>
                          <div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {quotes.length > 5 && (
                  <div className="p-4 border-t">
                    <Link href="/quotes">
                      <Button variant="secondary" className="w-full">
                        View All Requests
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <NotificationCenter />
          </div>
        </div>
      </div>
    </Layout>
  );
}
