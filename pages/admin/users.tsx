import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function AdminUsersPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [user, filter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditForm({
      companyName: u.companyName || '',
      phone: u.phone || '',
      gstin: u.gstin || '',
      isVerified: u.isVerified,
    });
  };

  const updateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        fetchUsers();
        setEditingId(null);
        alert('User updated successfully');
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchUsers();
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="TRADER">Traders</option>
              <option value="LOGISTICS_PARTNER">Partners</option>
              <option value="ADMIN">Admins</option>
            </select>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email & Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.email}</div>
                          {editingId === u.id ? (
                            <input
                              type="text"
                              value={editForm.companyName}
                              onChange={(e) =>
                                setEditForm({ ...editForm, companyName: e.target.value })
                              }
                              className="text-xs px-2 py-1 border rounded w-40"
                              placeholder="Company name"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{u.companyName || '—'}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {editingId === u.id ? (
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="text-xs px-2 py-1 border rounded w-32"
                            placeholder="Phone"
                          />
                        ) : (
                          u.phone || '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            u.role === 'ADMIN' ? 'danger' : u.role === 'TRADER' ? 'primary' : 'success'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={u.isActive ? 'success' : 'neutral'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === u.id ? (
                          <label className="text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.isVerified}
                              onChange={(e) =>
                                setEditForm({ ...editForm, isVerified: e.target.checked })
                              }
                              className="mr-2"
                            />
                            Verified
                          </label>
                        ) : (
                          <Badge variant={u.isVerified ? 'success' : 'neutral'}>
                            {u.isVerified ? 'Yes' : 'No'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {editingId === u.id ? (
                          <>
                            <button
                              onClick={() => updateUser(u.id)}
                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(u)}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u.id, u.isActive)}
                              className={`px-2 py-1 text-white text-xs rounded ${
                                u.isActive
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => toggleVerification(u.id, u.isVerified)}
                              className={`px-2 py-1 text-white text-xs rounded ${
                                u.isVerified
                                  ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {u.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="px-2 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-800"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
