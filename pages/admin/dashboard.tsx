import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalOffers: 0,
    totalShipments: 0,
    activePartners: 0,
    totalTraders: 0,
    platformGMV: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchAdminStats();
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalQuotes: data.totalQuotes || 0,
          totalOffers: data.totalOffers || 0,
          totalShipments: data.totalShipments || 0,
          activePartners: data.activePartners || 0,
          totalTraders: data.totalTraders || 0,
          platformGMV: data.platformGMV || 0,
          pendingPayments: data.pendingPayments || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-600 mt-1">Real-time system metrics and analytics</p>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/quotes">
            <Card className="border-l-4 border-l-blue-600 hover:shadow-lg hover:bg-blue-50 transition-all cursor-pointer">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Quotes</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalQuotes}</p>
              <p className="text-xs text-gray-600 mt-2">Freight requests posted</p>
              <p className="text-xs text-blue-600 font-semibold mt-3">Click to manage</p>
            </Card>
          </Link>

          <Link href="/admin/offers">
            <Card className="border-l-4 border-l-green-600 hover:shadow-lg hover:bg-green-50 transition-all cursor-pointer">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Offers</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalOffers}</p>
              <p className="text-xs text-gray-600 mt-2">Competitive bids submitted</p>
              <p className="text-xs text-green-600 font-semibold mt-3">Click to manage</p>
            </Card>
          </Link>

          <Link href="/admin/shipments">
            <Card className="border-l-4 border-l-purple-600 hover:shadow-lg hover:bg-purple-50 transition-all cursor-pointer">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Shipments</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalShipments}</p>
              <p className="text-xs text-gray-600 mt-2">In transit or processing</p>
              <p className="text-xs text-purple-600 font-semibold mt-3">Click to manage</p>
            </Card>
          </Link>

          <Link href="/admin/partners">
            <Card className="border-l-4 border-l-indigo-600 hover:shadow-lg hover:bg-indigo-50 transition-all cursor-pointer">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Partners</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.activePartners}</p>
              <p className="text-xs text-gray-600 mt-2">Verified logistics providers</p>
              <p className="text-xs text-indigo-600 font-semibold mt-3">Click to manage</p>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Traders</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.totalTraders}</p>
            <p className="text-xs text-gray-600 mt-2">Active trader accounts</p>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Platform GMV</h3>
            <p className="text-3xl font-bold text-emerald-600">₹{(stats.platformGMV / 100000).toFixed(1)}L</p>
            <p className="text-xs text-gray-600 mt-2">Total transaction value</p>
          </Card>

          <Card className={`border-l-4 ${stats.pendingPayments > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'} hover:shadow-lg transition-shadow`}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Approvals</h3>
            <p className={`text-3xl font-bold ${stats.pendingPayments > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.pendingPayments}</p>
            <p className="text-xs text-gray-600 mt-2">Payment requests awaiting action</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              System Management
            </h2>
            <div className="space-y-3">
              <Link href="/admin/users">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Manage Users</h3>
                      <p className="text-sm text-gray-600">View and manage all platform users</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
              <Link href="/admin/payments">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Payment Approvals</h3>
                      <p className="text-sm text-gray-600">Review and approve wallet recharges</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Platform Monitoring
            </h2>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">System Status</span>
                  <span className="flex items-center text-green-600 text-sm font-semibold">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Operational
                  </span>
                </div>
                <div className="text-xs text-gray-600">All systems running normally</div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <span className="flex items-center text-green-600 text-sm font-semibold">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Connected
                  </span>
                </div>
                <div className="text-xs text-gray-600">PostgreSQL operational</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
