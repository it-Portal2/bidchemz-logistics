import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';

export default function EditOfferPage() {
  const router = useRouter();
  const { offerId } = router.query;
  const { token } = useAuth();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    price: 0,
    transitDays: 0,
    remarks: '',
  });

  useEffect(() => {
    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  const fetchOffer = async () => {
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOffer(data.offer);
        setFormData({
          price: data.offer.price,
          transitDays: data.offer.transitDays,
          remarks: data.offer.remarks || '',
        });
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to fetch offer' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Offer updated successfully!' });
        setTimeout(() => router.push('/partner/offers'), 2000);
      } else {
        const data = await response.json();
        setAlert({ type: 'danger', message: data.error });
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to update offer' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (confirm('Are you sure you want to withdraw this offer?')) {
      try {
        const response = await fetch(`/api/offers/${offerId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setAlert({ type: 'success', message: 'Offer withdrawn successfully!' });
          setTimeout(() => router.push('/partner/offers'), 2000);
        } else {
          const data = await response.json();
          setAlert({ type: 'danger', message: data.error });
        }
      } catch (error) {
        setAlert({ type: 'danger', message: 'Failed to withdraw offer' });
      }
    }
  };

  if (loading) return <Layout><div className="text-center py-12">Loading...</div></Layout>;
  if (!offer) return <Layout><div className="text-center py-12">Offer not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Offer</h1>
            <p className="text-gray-600 mt-2">Quote: {offer.quote.quoteNumber}</p>
          </div>

          {alert && <Alert type={alert.type}>{alert.message}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transit Days
              </label>
              <Input
                type="number"
                min="1"
                value={formData.transitDays}
                onChange={(e) =>
                  setFormData({ ...formData, transitDays: parseInt(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Offer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleWithdraw}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Withdraw Offer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
