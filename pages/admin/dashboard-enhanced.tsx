import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Badge, Button } from '@/components/ui';
import { ChartCard } from '@/components/Dashboard/ChartCard';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminDashboardEnhanced() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalOffers: 0,
    totalShipments: 0,
    activePartners: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchAdminStats();
  }, [user, token]);

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
          totalRevenue: data.totalRevenue || 0,
          pendingPayments: data.pendingPayments || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quotesByStatusData = {
    labels: ['Draft', 'Matching', 'Offers Available', 'Selected', 'Expired'],
    datasets: [
      {
        label: 'Quotes',
        data: [5, 12, 18, 45, 8],
        backgroundColor: [
          'rgba(156, 163, 175, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
      },
    ],
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const partnerActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Offers Submitted',
        data: [12, 19, 15, 25, 22, 30, 28],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
      },
      {
        label: 'Leads Assigned',
        data: [8, 11, 9, 15, 13, 18, 16],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
      },
    ],
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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive system overview and analytics</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/payments">
              <Button variant="primary">Payment Requests</Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="secondary">Manage Users</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Quotes</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalQuotes}</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Offers</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalOffers}</p>
                <p className="text-sm text-green-600 mt-1">↑ 8% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Partners</p>
                <p className="text-3xl font-bold text-purple-600">{stats.activePartners}</p>
                <p className="text-sm text-green-600 mt-1">↑ 5 new this month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-indigo-600">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">↑ 18% from last month</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Quotes by Status"
            type="doughnut"
            data={quotesByStatusData}
            height={300}
          />

          <ChartCard
            title="Revenue Trend (6 Months)"
            type="line"
            data={revenueData}
            height={300}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Partner Activity (Last 7 Days)"
            type="bar"
            data={partnerActivityData}
            height={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: 'New quote submitted', user: 'ABC Chemicals', time: '2 mins ago', color: 'blue' },
                { action: 'Offer selected', user: 'XYZ Logistics', time: '15 mins ago', color: 'green' },
                { action: 'Payment approved', user: 'Partner Ltd', time: '1 hour ago', color: 'purple' },
                { action: 'Shipment delivered', user: 'Transport Co', time: '2 hours ago', color: 'indigo' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Pending Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Requests</p>
                  <p className="text-xs text-gray-600">{stats.pendingPayments} requests awaiting review</p>
                </div>
                <Link href="/admin/payments">
                  <Button size="sm">Review</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">KYC Verifications</p>
                  <p className="text-xs text-gray-600">3 partners pending verification</p>
                </div>
                <Link href="/admin/users">
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
