import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useAuth } from '@/contexts/AuthContext';

export default function SubmitOffer() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { quoteId } = router.query;
  const [quote, setQuote] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const [formData, setFormData] = useState({
    price: '',
    transitDays: '',
    offerValidUntil: '',
    pickupAvailableFrom: '',
    insuranceIncluded: false,
    trackingIncluded: true,
    customsClearance: false,
    valueAddedServices: '',
    termsAndConditions: '',
    remarks: '',
  });

  useEffect(() => {
    if (token && quoteId) {
      fetchQuote();
      fetchWallet();
    }
  }, [token, quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setQuote(data.quote);
        calculateEstimatedCost(data.quote);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const calculateEstimatedCost = async (quoteData: any) => {
    setLoadingPricing(true);
    try {
      const response = await fetch('/api/calculate-lead-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quoteId: quoteData.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setEstimatedCost(data.estimatedLeadCost);
        setPricingBreakdown(data);
      } else {
        throw new Error(data.error || 'Failed to calculate pricing');
      }
    } catch (error) {
      console.error('Error calculating lead cost:', error);
      setEstimatedCost(0);
      setPricingBreakdown(null);
      alert('Failed to calculate lead cost. Please refresh and try again.');
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quoteId) return;

    if (!pricingBreakdown || estimatedCost === 0) {
      alert('Lead cost calculation failed. Please refresh the page and try again.');
      return;
    }

    if (wallet && wallet.balance < estimatedCost) {
      alert(`Insufficient balance. You need ₹${estimatedCost} to submit this offer. Current balance: ₹${wallet.balance}`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quoteId,
          ...formData,
          price: parseFloat(formData.price),
          transitDays: parseInt(formData.transitDays),
          valueAddedServices: formData.valueAddedServices.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit offer');
      }

      router.push('/partner/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit Offer</h1>
          {quote.expiresAt && <CountdownTimer expiresAt={quote.expiresAt} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Your Price (INR)"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter your competitive price"
                    />
                    <FormField
                      label="Transit Days"
                      name="transitDays"
                      type="number"
                      value={formData.transitDays}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Number of days"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Offer Valid Until"
                      name="offerValidUntil"
                      type="datetime-local"
                      value={formData.offerValidUntil}
                      onChange={handleChange}
                      required
                    />
                    <FormField
                      label="Pickup Available From"
                      name="pickupAvailableFrom"
                      type="datetime-local"
                      value={formData.pickupAvailableFrom}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Value-Added Services
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="insuranceIncluded"
                          name="insuranceIncluded"
                          checked={formData.insuranceIncluded}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="insuranceIncluded" className="ml-2 text-sm text-gray-700">
                          Insurance Included
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="trackingIncluded"
                          name="trackingIncluded"
                          checked={formData.trackingIncluded}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="trackingIncluded" className="ml-2 text-sm text-gray-700">
                          Real-time Tracking Included
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="customsClearance"
                          name="customsClearance"
                          checked={formData.customsClearance}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="customsClearance" className="ml-2 text-sm text-gray-700">
                          Customs Clearance Assistance
                        </label>
                      </div>
                    </div>
                  </div>

                  <FormField
                    label="Additional Services (comma-separated)"
                    name="valueAddedServices"
                    type="textarea"
                    value={formData.valueAddedServices}
                    onChange={handleChange}
                    placeholder="e.g., Warehousing, Packing, Loading assistance"
                  />

                  <FormField
                    label="Terms & Conditions"
                    name="termsAndConditions"
                    type="textarea"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    placeholder="Your terms and conditions"
                  />

                  <FormField
                    label="Remarks"
                    name="remarks"
                    type="textarea"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Any additional information"
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Offer'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Cargo</p>
                    <p className="font-medium">{quote.cargoName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{quote.quantity} {quote.quantityUnit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{quote.pickupCity}, {quote.pickupState}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{quote.deliveryCity}, {quote.deliveryState}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ready Date</p>
                    <p className="font-medium">{new Date(quote.cargoReadyDate).toLocaleDateString()}</p>
                  </div>
                  {quote.isHazardous && (
                    <div className="pt-2 border-t">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Hazardous: {quote.hazardClass}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Cost</CardTitle>
              </CardHeader>
              <CardBody>
                {loadingPricing ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500 mt-2">Calculating...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-2">
                        ₹{estimatedCost.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        This amount will be deducted upon submission
                      </p>
                    </div>

                    {pricingBreakdown && pricingBreakdown.breakdown && pricingBreakdown.breakdown.explanation && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Pricing Breakdown:</p>
                        <div className="space-y-1">
                          {pricingBreakdown.breakdown.explanation.map((item: string, index: number) => (
                            <p key={index} className="text-xs text-gray-600">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {wallet && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">Current Wallet Balance</p>
                        <p className={`text-xl font-semibold ${wallet.balance >= estimatedCost ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{wallet.balance.toLocaleString()}
                        </p>
                        {wallet.balance < estimatedCost ? (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            ⚠️ Insufficient balance - Please recharge
                          </p>
                        ) : (
                          <p className="text-xs text-green-600 mt-2">
                            ✓ Balance after submission: ₹{(wallet.balance - estimatedCost).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
