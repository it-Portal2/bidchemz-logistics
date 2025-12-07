import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/router';

export default function AdminQuotes() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (quote: any) => {
    setEditingId(quote.id);
    setEditForm({
      status: quote.status,
      paymentTerms: quote.paymentTerms,
      additionalNotes: quote.additionalNotes,
    });
  };

  const updateQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchQuotes();
        setEditingId(null);
        alert('Quote updated successfully');
      } else {
        alert('Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Failed to update quote');
    }
  };

  const deleteQuote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== id));
        alert('Quote deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  if (loading) return <Layout><div className="text-center py-12">Loading quotes...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Quotes</h1>
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
                  <th className="px-4 py-2 text-left text-sm font-semibold">Quote #</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Cargo</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Route</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => (
                    <React.Fragment key={quote.id}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{quote.quoteNumber}</td>
                        <td className="px-4 py-3 text-sm">{quote.cargoName}</td>
                        <td className="px-4 py-3 text-sm">{quote.quantity} {quote.quantityUnit}</td>
                        <td className="px-4 py-3 text-sm">
                          {editingId === quote.id ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option>DRAFT</option>
                              <option>SUBMITTED</option>
                              <option>MATCHING</option>
                              <option>OFFERS_AVAILABLE</option>
                              <option>SELECTED</option>
                              <option>EXPIRED</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              quote.status === 'OFFERS_AVAILABLE' ? 'bg-green-100 text-green-800' :
                              quote.status === 'SELECTED' ? 'bg-blue-100 text-blue-800' :
                              quote.status === 'MATCHING' ? 'bg-yellow-100 text-yellow-800' :
                              quote.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {quote.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {quote.pickupCity} → {quote.deliveryCity}
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          {editingId === quote.id ? (
                            <>
                              <button
                                onClick={() => updateQuote(quote.id)}
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
                                onClick={() => startEdit(quote)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteQuote(quote.id)}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
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
