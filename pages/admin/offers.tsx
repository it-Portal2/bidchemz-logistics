import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/router';

export default function AdminOffers() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (offer: any) => {
    setEditingId(offer.id);
    setEditForm({
      status: offer.status,
      price: offer.price,
      transitDays: offer.transitDays,
    });
  };

  const updateOffer = async (id: string) => {
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchOffers();
        setEditingId(null);
        alert('Offer updated successfully');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Failed to update offer');
    }
  };

  const deleteOffer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setOffers(offers.filter(o => o.id !== id));
        alert('Offer deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  };

  if (loading) return <Layout><div className="text-center py-12">Loading offers...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Offers</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Partner</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Transit Days</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Insurance</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No offers found
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{offer.partner?.companyName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {editingId === offer.id ? (
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="px-2 py-1 border rounded text-xs w-24"
                          />
                        ) : (
                          `₹${offer.price?.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === offer.id ? (
                          <input
                            type="number"
                            value={editForm.transitDays}
                            onChange={(e) => setEditForm({ ...editForm, transitDays: e.target.value })}
                            className="px-2 py-1 border rounded text-xs w-16"
                          />
                        ) : (
                          `${offer.transitDays} days`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === offer.id ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            <option>PENDING</option>
                            <option>ACCEPTED</option>
                            <option>REJECTED</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {offer.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {offer.insuranceIncluded ? '✓ Yes' : '✗ No'}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {editingId === offer.id ? (
                          <>
                            <button
                              onClick={() => updateOffer(offer.id)}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(offer)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteOffer(offer.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
