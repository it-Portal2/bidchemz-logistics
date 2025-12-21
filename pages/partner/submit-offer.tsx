import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubmitOffer() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { quoteId } = router.query;

  const [quote, setQuote] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estimatedCost, setEstimatedCost] = useState<number>(0);

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

  /* =======================
     Guards & Initial Load
  ======================= */
  useEffect(() => {
    if (!router.isReady || !token || !quoteId) return;

    if (typeof quoteId !== 'string') {
      setError('Invalid quote reference');
      setLoading(false);
      return;
    }

    fetchQuote(quoteId);
    fetchWallet();
  }, [router.isReady, token, quoteId]);

  /* =======================
     API Calls
  ======================= */
  const fetchQuote = async (id: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data?.quote) {
        throw new Error();
      }

      setQuote(data.quote);
      calculateEstimatedCost(data.quote.id);
    } catch {
      setError('Quote not found or expired');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setWallet(data.wallet);
    } catch { }
  };

  const calculateEstimatedCost = async (quoteId: string) => {
    try {
      const res = await fetch('/api/calculate-lead-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quoteId }),
      });

      const data = await res.json();
      if (res.ok) {
        setEstimatedCost(data.estimatedLeadCost);
      }
    } catch { }
  };

  /* =======================
     Handlers
  ======================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quote || !wallet) return;

    if (wallet.balance < estimatedCost) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quoteId: quote.id,
          price: Number(formData.price),
          transitDays: Number(formData.transitDays),
          offerValidUntil: formData.offerValidUntil,
          pickupAvailableFrom: formData.pickupAvailableFrom,
          insuranceIncluded: formData.insuranceIncluded,
          trackingIncluded: formData.trackingIncluded,
          customsClearance: formData.customsClearance,
          valueAddedServices: formData.valueAddedServices
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          termsAndConditions: formData.termsAndConditions,
          remarks: formData.remarks,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server response:', text);
        throw new Error('Server returned an invalid or HTML response');
      }

      if (!res.ok) throw new Error(data.error || 'Submission failed');

      toast.success('Offer submitted successfully!');
      router.push('/partner/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     UI States
  ======================= */
  if (!user || user.role !== 'LOGISTICS_PARTNER') {
    return (
      <Layout>
        <EmptyState title="Access denied" description="Partners only" />
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (error || !quote) {
    return (
      <Layout>
        <EmptyState
          title="Quote not available"
          description={error || 'This quote may have expired'}
          actionLabel="Back to Leads"
          onAction={() => router.push('/partner/leads')}
        />
      </Layout>
    );
  }

  /* =======================
     Page
  ======================= */
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Submit Offer</h1>
          {quote.expiresAt && <CountdownTimer expiresAt={quote.expiresAt} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Price (INR)"
                  name="price"
                  type="number"
                  required
                  value={formData.price}
                  onChange={handleChange}
                />

                <FormField
                  label="Transit Days"
                  name="transitDays"
                  type="number"
                  required
                  value={formData.transitDays}
                  onChange={handleChange}
                />

                <FormField
                  label="Offer Valid Until"
                  name="offerValidUntil"
                  type="date"
                  required
                  value={formData.offerValidUntil}
                  onChange={handleChange}
                />

                <FormField
                  label="Pickup Available From"
                  name="pickupAvailableFrom"
                  type="date"
                  required
                  value={formData.pickupAvailableFrom}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-600">
                  Estimated Lead Cost: <strong>₹{estimatedCost}</strong>
                </p>

                <div className="flex gap-3">
                  <Button variant="secondary" type="button" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Offer'}
                  </Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
