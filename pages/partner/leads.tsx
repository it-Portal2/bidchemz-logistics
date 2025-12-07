import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { CountdownTimer } from '@/components/CountdownTimer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';

interface Lead {
  id: string;
  quoteNumber: string;
  cargoName: string;
  quantity: number;
  quantityUnit: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  cargoReadyDate: string;
  isHazardous: boolean;
  hazardClass: string | null;
  expiresAt: string;
  status: string;
  packagingType: string;
}

export default function PartnerLeads() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (token) {
      fetchLeads();
    }
  }, [token, filter]);

  const fetchLeads = async () => {
    try {
      const url = filter === 'all' ? '/api/quotes' : `/api/quotes?status=${filter}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setLeads(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Hazard filter
    if (hazardFilter === 'hazardous' && !lead.isHazardous) return false;
    if (hazardFilter === 'non-hazardous' && lead.isHazardous) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.cargoName.toLowerCase().includes(query) ||
        lead.quoteNumber.toLowerCase().includes(query) ||
        lead.pickupCity.toLowerCase().includes(query) ||
        lead.deliveryCity.toLowerCase().includes(query) ||
        lead.pickupState.toLowerCase().includes(query) ||
        lead.deliveryState.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleSubmitOffer = (leadId: string) => {
    router.push(`/partner/submit-offer?quoteId=${leadId}`);
  };

  if (!user || user.role !== 'LOGISTICS_PARTNER') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Partners only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Available Leads</h1>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </Button>
          </div>

          {showFilters && (
            <Card className="mb-4">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="MATCHING">Active</option>
                      <option value="OFFERS_AVAILABLE">With Offers</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hazard Type
                    </label>
                    <select
                      value={hazardFilter}
                      onChange={(e) => setHazardFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="hazardous">Hazardous Only</option>
                      <option value="non-hazardous">Non-Hazardous Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search cargo, location, or quote ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {(hazardFilter !== 'all' || searchQuery) && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {filteredLeads.length} of {leads.length} leads
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHazardFilter('all');
                        setSearchQuery('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <EmptyState
                icon="📦"
                title={searchQuery || hazardFilter !== 'all' ? "No matching leads found" : "No leads available"}
                description={searchQuery || hazardFilter !== 'all' ? "Try adjusting your filters" : "New freight requests matching your capabilities will appear here"}
                actionLabel={searchQuery || hazardFilter !== 'all' ? "Clear Filters" : undefined}
                onAction={searchQuery || hazardFilter !== 'all' ? () => {
                  setSearchQuery('');
                  setHazardFilter('all');
                } : undefined}
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {lead.cargoName}
                        </h3>
                        {lead.isHazardous && (
                          <Badge variant="danger">
                            ⚠️ Hazardous {lead.hazardClass}
                          </Badge>
                        )}
                        <Badge variant={lead.status === 'MATCHING' ? 'success' : 'neutral'}>
                          {lead.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Quote ID</p>
                          <p className="font-medium text-gray-900">{lead.quoteNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">
                            {lead.quantity} {lead.quantityUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Packaging</p>
                          <p className="font-medium text-gray-900">{lead.packagingType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ready Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(lead.cargoReadyDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{lead.pickupCity}, {lead.pickupState}</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{lead.deliveryCity}, {lead.deliveryState}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      {lead.expiresAt && (
                        <CountdownTimer expiresAt={lead.expiresAt} />
                      )}
                      <Button
                        variant="primary"
                        onClick={() => handleSubmitOffer(lead.id)}
                        disabled={lead.status === 'EXPIRED'}
                      >
                        Submit Offer
                      </Button>
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
