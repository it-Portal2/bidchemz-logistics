import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/router';

export default function AdminShipments() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchShipments();
  }, [user]);

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (shipment: any) => {
    setEditingId(shipment.id);
    setEditForm({
      status: shipment.status,
      currentLocation: shipment.currentLocation || '',
    });
  };

  const updateShipment = async (id: string) => {
    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchShipments();
        setEditingId(null);
        alert('Shipment updated successfully');
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('Failed to update shipment');
    }
  };

  const deleteShipment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    
    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setShipments(shipments.filter(s => s.id !== id));
        alert('Shipment deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
      alert('Failed to delete shipment');
    }
  };

  if (loading) return <Layout><div className="text-center py-12">Loading shipments...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Shipments</h1>
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
                  <th className="px-4 py-2 text-left text-sm font-semibold">Shipment #</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Current Location</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Est. Delivery</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Cargo</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => (
                    <tr key={shipment.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{shipment.shipmentNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === shipment.id ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            <option>BOOKED</option>
                            <option>IN_TRANSIT</option>
                            <option>DELIVERED</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            shipment.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            shipment.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {editingId === shipment.id ? (
                          <input
                            type="text"
                            value={editForm.currentLocation}
                            onChange={(e) => setEditForm({ ...editForm, currentLocation: e.target.value })}
                            className="px-2 py-1 border rounded text-xs w-32"
                          />
                        ) : (
                          shipment.currentLocation || '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {shipment.quote?.cargoName || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {editingId === shipment.id ? (
                          <>
                            <button
                              onClick={() => updateShipment(shipment.id)}
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
                              onClick={() => startEdit(shipment)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteShipment(shipment.id)}
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
