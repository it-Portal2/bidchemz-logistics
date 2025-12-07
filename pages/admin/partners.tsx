import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/router';

export default function AdminPartners() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchPartners();
  }, [user]);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/users?filter=LOGISTICS_PARTNER', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.users || data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (partner: any) => {
    setEditingId(partner.id);
    setEditForm({
      isActive: partner.isActive,
      isVerified: partner.isVerified,
      gstin: partner.gstin || '',
    });
  };

  const updatePartner = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchPartners();
        setEditingId(null);
        alert('Partner updated successfully');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Failed to update partner');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchPartners();
        alert(currentStatus ? 'Partner deactivated' : 'Partner activated');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Failed to update partner');
    }
  };

  if (loading) return <Layout><div className="text-center py-12">Loading partners...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Logistics Partners</h1>
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
                  <th className="px-4 py-2 text-left text-sm font-semibold">Company</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Contact Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">GSTIN</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Verified</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No logistics partners found
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{partner.companyName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{partner.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{partner.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {editingId === partner.id ? (
                          <input
                            type="text"
                            value={editForm.gstin}
                            onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                            className="px-2 py-1 border rounded text-xs w-32"
                          />
                        ) : (
                          partner.gstin || '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {partner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === partner.id ? (
                          <label className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.isVerified}
                              onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                              className="mr-2"
                            />
                            Verified
                          </label>
                        ) : (
                          partner.isVerified ? '✓ Yes' : '✗ No'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {editingId === partner.id ? (
                          <>
                            <button
                              onClick={() => updatePartner(partner.id)}
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
                              onClick={() => startEdit(partner)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleActive(partner.id, partner.isActive)}
                              className={`px-3 py-1 text-white text-xs rounded ${
                                partner.isActive 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {partner.isActive ? 'Deactivate' : 'Activate'}
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
