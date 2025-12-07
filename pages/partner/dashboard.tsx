import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PartnerDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeOffers: 0,
    totalLeads: 0,
    walletBalance: 0,
    acceptanceRate: 0,
    earnings: 0,
    avgRating: 4.8,
  });
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'offer_submitted', title: 'Offer Submitted', description: 'Corrosive chemicals - Mumbai to Delhi', time: '2 hours ago', color: 'blue', icon: '📤' },
    { id: 2, type: 'offer_accepted', title: 'Offer Accepted', description: 'Sulfuric Acid transport - ₹95,000', time: '5 hours ago', color: 'green', icon: '✅' },
    { id: 3, type: 'lead_fee', title: 'Lead Fee Deducted', description: '₹500 deducted from wallet', time: '5 hours ago', color: 'orange', icon: '💰' },
    { id: 4, type: 'new_lead', title: 'New Lead Available', description: 'Flammable liquid - Pune to Surat', time: '1 day ago', color: 'purple', icon: '🆕' },
  ]);

  useEffect(() => {
    if (!user || user.role !== 'LOGISTICS_PARTNER') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      const [offersRes, walletRes, quotesRes] = await Promise.all([
        fetch('/api/offers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/wallet', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/quotes?status=MATCHING&status=OFFERS_AVAILABLE', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const offersData = await offersRes.json();
      const walletData = await walletRes.json();
      const quotesData = await quotesRes.json();

      const offers = offersData.offers || [];
      const selectedOffers = offers.filter((o: any) => o.status === 'SELECTED');
      const totalEarnings = selectedOffers.reduce((sum: number, o: any) => sum + (o.price || 0), 0);
      
      setStats({
        activeOffers: offers.filter((o: any) => o.status === 'PENDING').length,
        totalLeads: offers.length,
        walletBalance: walletData.wallet?.balance || 0,
        acceptanceRate: offers.length > 0 ? Math.round((selectedOffers.length / offers.length) * 100) : 0,
        earnings: totalEarnings,
        avgRating: 4.8,
      });

      setQuotes(quotesData.quotes || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const earningsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Earnings (₹)',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const offersStatusData = {
    labels: ['Pending', 'Accepted', 'Rejected'],
    datasets: [
      {
        data: [stats.activeOffers || 3, stats.totalLeads - stats.activeOffers || 8, 2],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Leads Won',
        data: [3, 5, 4, 7, 6, 8],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Leads Lost',
        data: [2, 3, 2, 1, 2, 1],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your performance overview</p>
          </div>
          <div className="flex gap-3">
            <Link href="/partner/leads">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Leads
              </Button>
            </Link>
            <Link href="/partner/wallet">
              <Button variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Recharge Wallet
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Active Offers</p>
              <p className="text-4xl font-bold text-blue-600">{stats.activeOffers}</p>
              <p className="text-xs text-blue-700 mt-2">Awaiting response</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">Total Leads</p>
              <p className="text-4xl font-bold text-purple-600">{stats.totalLeads}</p>
              <p className="text-xs text-purple-700 mt-2">Lifetime received</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-600 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">Total Earnings</p>
              <p className="text-4xl font-bold text-green-600">₹{stats.earnings.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-2">From accepted offers</p>
            </div>
          </Card>

          <Card className={`bg-gradient-to-br ${stats.walletBalance < 1000 ? 'from-red-50 to-red-100 border-l-red-600' : 'from-emerald-50 to-emerald-100 border-l-emerald-600'} border-l-4 hover:shadow-lg transition-shadow`}>
            <div>
              <p className={`text-sm font-medium ${stats.walletBalance < 1000 ? 'text-red-900' : 'text-emerald-900'} mb-1`}>Wallet Balance</p>
              <p className={`text-4xl font-bold ${stats.walletBalance < 1000 ? 'text-red-600' : 'text-emerald-600'}`}>₹{stats.walletBalance.toLocaleString()}</p>
              {stats.walletBalance < 1000 && (
                <p className="text-xs text-red-700 mt-2 font-semibold">Low balance - Recharge recommended</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Rating</h3>
            </div>
            <div className="text-center py-6">
              <div className="text-6xl font-bold text-yellow-500 mb-2">{stats.avgRating}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-6 h-6 ${star <= Math.floor(stats.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on trader feedback</p>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
            </div>
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                  <circle className="text-indigo-600" strokeWidth="10" strokeDasharray={`${stats.acceptanceRate * 3.51} 351`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                </svg>
                <span className="absolute text-3xl font-bold text-indigo-600">{stats.acceptanceRate}%</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Offers accepted by traders</p>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Offer Status</h3>
            </div>
            <div style={{ height: '180px' }}>
              <Doughnut data={offersStatusData} options={doughnutOptions} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Earnings Trend</h3>
              <Badge variant="success">+18%</Badge>
            </div>
            <div style={{ height: '250px' }}>
              <Line data={earningsChartData} options={chartOptions} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Win/Loss Ratio</h3>
              <Badge variant="primary">Last 6 Months</Badge>
            </div>
            <div style={{ height: '250px' }}>
              <Bar data={performanceData} options={chartOptions} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Available Freight Requests</h2>
                  <p className="text-sm text-gray-600 mt-1">Latest leads matching your capabilities</p>
                </div>
                <Link href="/partner/leads">
                  <Button variant="outline">
                    View All
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {quotes.length === 0 ? (
                  <EmptyState
                    icon="🚚"
                    title="No Active Leads"
                    description="Freight requests matching your capabilities will appear here. Complete your partner profile to start receiving leads."
                    actionLabel="Manage Capabilities"
                    actionHref="/partner/capabilities"
                  />
                ) : (
                  quotes.slice(0, 3).map((quote: any) => (
                    <div key={quote.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-lg transition-all bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{quote.cargoName}</h3>
                            {quote.isHazardous && (
                              <Badge variant="danger">⚠️ {quote.hazardClass || 'Hazardous'}</Badge>
                            )}
                            <Badge variant={quote.status === 'MATCHING' ? 'warning' : 'success'}>
                              {quote.status === 'MATCHING' ? '🔍 Matching' : '✅ Ready'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span><strong>From:</strong> {quote.pickupCity}, {quote.pickupState}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                              <span><strong>To:</strong> {quote.deliveryCity}, {quote.deliveryState}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span><strong>Qty:</strong> {quote.quantity} {quote.quantityUnit}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span><strong>Ready:</strong> {new Date(quote.cargoReadyDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/partner/submit-offer?quoteId=${quote.id}`}>
                          <Button variant="primary" className="ml-4 shadow-md hover:shadow-lg">
                            Submit Offer
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {quotes.length > 3 && (
                <div className="mt-6 text-center">
                  <Link href="/partner/leads">
                    <Button variant="secondary" size="lg">
                      View All {quotes.length} Available Leads
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Badge variant="primary">{recentActivity.length} new</Badge>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-${activity.color}-100`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="ghost" fullWidth size="sm">
                View All Activity
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/partner/leads">
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">Browse Leads</h3>
                <p className="text-blue-100 text-sm">Discover new freight opportunities matching your capabilities</p>
              </div>
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/partner/offers">
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">My Offers</h3>
                <p className="text-green-100 text-sm">Track your submitted bids and acceptance status</p>
              </div>
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/partner/capabilities">
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">Capabilities</h3>
                <p className="text-purple-100 text-sm">Manage your services and fleet information</p>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
