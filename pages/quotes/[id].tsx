import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { DocumentUpload } from '@/components/DocumentUpload';
import { useRouter } from 'next/router';

export default function QuoteDetails() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'documents'>('details');
  const [sortBy, setSortBy] = useState<'price' | 'transit' | 'rating'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchQuote = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuote(data.quote);
      } else {
        router.push('/quotes');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  }, [id, token, router]);

  useEffect(() => {
    if (!user || !id) return;
    fetchQuote();
  }, [user, id, fetchQuote]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Quote not found</p>
        </div>
      </Layout>
    );
  }

  const isTrader = user?.role === 'TRADER';
  const offersCount = quote.offers?.length || 0;

  const sortedOffers = React.useMemo(() => {
    if (!quote?.offers) return [];
    
    const offers = [...quote.offers];
    offers.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'transit':
          comparison = a.transitDays - b.transitDays;
          break;
        case 'rating':
          comparison = (b.partner?.rating || 0) - (a.partner?.rating || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return offers;
  }, [quote?.offers, sortBy, sortOrder]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
          </div>
          {quote.expiresAt && quote.status === 'MATCHING' && (
            <CountdownTimer expiresAt={quote.expiresAt} showSeconds={true} />
          )}
        </div>

        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{quote.cargoName}</h1>
                <p className="text-gray-600 mt-1">{quote.quoteNumber}</p>
              </div>
              <Badge variant={
                quote.status === 'SELECTED' ? 'success' :
                quote.status === 'OFFERS_AVAILABLE' ? 'primary' :
                quote.status === 'MATCHING' ? 'warning' :
                'neutral'
              }>
                {quote.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="text-lg font-semibold text-gray-900">
                  {quote.quantity} {quote.quantityUnit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Packaging</p>
                <p className="text-lg font-semibold text-gray-900">{quote.packagingType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ready Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(quote.cargoReadyDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Offers Received</p>
                <p className="text-lg font-semibold text-green-600">{offersCount}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6 pt-6 border-t">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{quote.pickupCity}, {quote.pickupState}</span>
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{quote.deliveryCity}, {quote.deliveryState}</span>
              </div>
              {quote.isHazardous && (
                <Badge variant="danger">⚠️ Hazardous: {quote.hazardClass}</Badge>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`${
                activeTab === 'offers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>Offers</span>
              {offersCount > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {offersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Documents
            </button>
          </nav>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Information</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cargo Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{quote.cargoName}</dd>
                  </div>
                  {quote.casNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CAS Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{quote.casNumber}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                    <dd className="mt-1 text-sm text-gray-900">{quote.quantity} {quote.quantityUnit}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Packaging Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{quote.packagingType}</dd>
                  </div>
                  {quote.temperatureControlled && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Temperature Range</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {quote.temperatureMin}°C to {quote.temperatureMax}°C
                      </dd>
                    </div>
                  )}
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Pickup Location</p>
                    <p className="text-sm text-gray-900">{quote.pickupAddress}</p>
                    <p className="text-sm text-gray-600">
                      {quote.pickupCity}, {quote.pickupState} {quote.pickupPincode}
                    </p>
                    {quote.pickupContactPhone && (
                      <p className="text-sm text-gray-600 mt-1">
                        Contact: {quote.pickupContactName} - {quote.pickupContactPhone}
                      </p>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Delivery Location</p>
                    <p className="text-sm text-gray-900">{quote.deliveryAddress}</p>
                    <p className="text-sm text-gray-600">
                      {quote.deliveryCity}, {quote.deliveryState} {quote.deliveryPincode}
                    </p>
                    {quote.deliveryContactPhone && (
                      <p className="text-sm text-gray-600 mt-1">
                        Contact: {quote.deliveryContactName} - {quote.deliveryContactPhone}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'offers' && (
          <div>
            {offersCount === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-2">No offers received yet</p>
                  <p className="text-sm text-gray-500">Matched partners are reviewing your request</p>
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  {isTrader && (
                    <Button
                      variant="primary"
                      onClick={() => router.push(`/trader/offers?quoteId=${id}`)}
                    >
                      Compare All {offersCount} Offers →
                    </Button>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="price">Price</option>
                      <option value="transit">Transit Time</option>
                      <option value="rating">Partner Rating</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {sortedOffers.slice(0, 5).map((offer: any) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <p className="text-lg font-semibold text-gray-900">{offer.partner?.companyName}</p>
                            {offer.partner?.rating && (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-sm text-gray-600">{offer.partner.rating.toFixed(1)}</span>
                              </div>
                            )}
                            <Badge variant={offer.status === 'PENDING' ? 'warning' : 'success'}>
                              {offer.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Price</p>
                              <p className="text-xl font-bold text-blue-600">₹{offer.price.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Transit Time</p>
                              <p className="font-semibold text-gray-900">{offer.transitDays} days</p>
                            </div>
                            {offer.insuranceIncluded && (
                              <div>
                                <p className="text-sm text-gray-500">Insurance</p>
                                <p className="text-sm text-green-600">✓ Included</p>
                              </div>
                            )}
                            {offer.vehicleType && (
                              <div>
                                <p className="text-sm text-gray-500">Vehicle</p>
                                <p className="text-sm text-gray-900">{offer.vehicleType}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {isTrader && offer.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            onClick={() => router.push(`/trader/offers?quoteId=${id}`)}
                            className="ml-4"
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
                </div>
                
                {offersCount > 5 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/trader/offers?quoteId=${id}`)}
                    >
                      View All {offersCount} Offers
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isTrader && (
              <DocumentUpload
                quoteId={id as string}
                token={token!}
                onUploadComplete={() => fetchQuote()}
              />
            )}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardBody>
                {quote.documents && quote.documents.length > 0 ? (
                  <div className="space-y-2">
                    {quote.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {doc.documentType} • {(doc.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button variant="secondary" size="sm">
                          Download 🔒
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No documents uploaded yet
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
