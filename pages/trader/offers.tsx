import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

interface Offer {
  id: string;
  price: number;
  transitDays: number;
  offerValidUntil: string;
  pickupAvailableFrom: string;
  insuranceIncluded: boolean;
  trackingIncluded: boolean;
  customsClearance: boolean;
  valueAddedServices: string[];
  partner: {
    companyName: string;
    email: string;
  };
  quote: {
    quoteNumber: string;
    cargoName: string;
    pickupCity: string;
    deliveryCity: string;
  };
  status: string;
  submittedAt: string;
}

export default function TraderOffers() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { quoteId } = router.query;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'transitDays'>('price');

  useEffect(() => {
    if (token && quoteId) {
      fetchOffers();
    }
  }, [token, quoteId]);

  const fetchOffers = async () => {
    try {
      const response = await fetch(`/api/offers?quoteId=${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to select this offer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/offers/${offerId}/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select offer');
      }

      alert('Offer selected successfully! The partner will be notified.');
      router.push(`/quotes/${quoteId}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to select offer');
    }
  };

  const sortedOffers = [...offers].sort((a, b) => {
    if (sortBy === 'price') {
      return a.price - b.price;
    }
    return a.transitDays - b.transitDays;
  });

  if (!user || user.role !== 'TRADER') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Traders only.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const selectedOffer = offers.find(o => o.status === 'ACCEPTED');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compare Offers</h1>
            {offers.length > 0 && offers[0].quote && (
              <p className="text-gray-600 mt-1">
                For: {offers[0].quote.cargoName} ({offers[0].quote.quoteNumber})
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'transitDays')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="price">Lowest Price</option>
              <option value="transitDays">Fastest Delivery</option>
            </select>
          </div>
        </div>

        {selectedOffer && (
          <Card className="mb-6 border-2 border-green-500">
            <CardBody>
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-green-700">Selected Offer</span>
              </div>
              <p className="text-gray-600">
                Partner: <strong>{selectedOffer.partner.companyName}</strong> | 
                Price: <strong>₹{selectedOffer.price.toLocaleString()}</strong> | 
                Transit: <strong>{selectedOffer.transitDays} days</strong>
              </p>
            </CardBody>
          </Card>
        )}

        {offers.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-2">No offers received yet</p>
              <p className="text-sm text-gray-500">Partners are reviewing your freight request</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedOffers.map((offer, index) => (
              <Card key={offer.id} className={`${index === 0 && !selectedOffer ? 'border-blue-500 border-2' : ''}`}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {offer.partner.companyName}
                        </h3>
                        {index === 0 && !selectedOffer && (
                          <Badge variant="success">Best Value</Badge>
                        )}
                        {offer.status === 'ACCEPTED' && (
                          <Badge variant="success">Selected</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{offer.price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Transit Time</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {offer.transitDays} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pickup From</p>
                          <p className="font-medium text-gray-900">
                            {new Date(offer.pickupAvailableFrom).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className="font-medium text-gray-900">
                            {new Date(offer.offerValidUntil).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {offer.insuranceIncluded && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Insurance
                          </span>
                        )}
                        {offer.trackingIncluded && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✓ Tracking
                          </span>
                        )}
                        {offer.customsClearance && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ✓ Customs
                          </span>
                        )}
                        {offer.valueAddedServices?.map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {service}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(offer.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="ml-4">
                      {!selectedOffer && offer.status === 'PENDING' && (
                        <Button
                          variant="primary"
                          onClick={() => handleSelectOffer(offer.id)}
                        >
                          Select Offer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
