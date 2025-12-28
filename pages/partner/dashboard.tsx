import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { MotionContainer, MotionItem } from '@/components/ui/Motion';
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
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    totalLeads: 0,
    walletBalance: 0,
    acceptanceRate: 0,
    earnings: 0,
    avgRating: 0,
    earningsTrend: 0,
  });
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earningsChartData, setEarningsChartData] = useState<any>(null);
  const [performanceChartData, setPerformanceChartData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [rawOffers, setRawOffers] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState('6M');
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'LOGISTICS_PARTNER') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [user, token, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const [offersRes, walletRes, quotesRes, activityRes] = await Promise.all([
        fetch('/api/offers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/wallet', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/quotes?status=MATCHING&status=OFFERS_AVAILABLE', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/partner/activity', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const offersData = await offersRes.json();
      const walletData = await walletRes.json();
      const quotesData = await quotesRes.json();
      const activityData = await activityRes.json();

      const offers = offersData.offers || [];
      setRawOffers(offers);
      const selectedOffers = offers.filter((o: any) => o.status === 'SELECTED' || o.status === 'ACCEPTED');
      const rejectedOffers = offers.filter((o: any) => o.status === 'REJECTED');
      const pendingOffers = offers.filter((o: any) => o.status === 'PENDING');

      const totalEarnings = selectedOffers.reduce((sum: number, o: any) => sum + (o.price || 0), 0);

      // Calculate Average Rating
      const ratedShipments = offers.filter((o: any) => o.shipment?.rating != null);
      const totalRating = ratedShipments.reduce((sum: number, o: any) => sum + o.shipment.rating, 0);
      const calculatedRating = ratedShipments.length > 0
        ? Number((totalRating / ratedShipments.length).toFixed(1))
        : 0; // Default to 0 if no ratings



      setQuotes(quotesData.quotes || []);
      setRecentActivity(activityData.activities || []);

      // Calculate Weekly Earnings (Last 7 Days)
      const last7Days: string[] = [];
      const earningsByDay: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d));

        const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
        const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();

        const dayEarnings = selectedOffers
          .filter((o: any) => {
            const dateValue = o.createdAt ?? o.submittedAt;
            if (!dateValue) return false;
            const t = new Date(dateValue).getTime();
            return t >= dayStart && t <= dayEnd;
          })
          .reduce((sum: number, o: any) => sum + (o.price || 0), 0);

        earningsByDay.push(dayEarnings);
      }

      // Calculate Trend (Current 7 days vs Previous 7 days)
      const now = new Date();
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - 6);
      currentPeriodStart.setHours(0, 0, 0, 0);

      const previousPeriodStart = new Date(now);
      previousPeriodStart.setDate(now.getDate() - 13);
      previousPeriodStart.setHours(0, 0, 0, 0);

      const previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(now.getDate() - 7);
      previousPeriodEnd.setHours(23, 59, 59, 999);

      const currentEarnings = selectedOffers
        .filter((o: any) => {
          const t = new Date(o.createdAt ?? o.submittedAt).getTime();
          return t >= currentPeriodStart.getTime();
        })
        .reduce((sum: number, o: any) => sum + (o.price || 0), 0);

      const previousEarnings = selectedOffers
        .filter((o: any) => {
          const t = new Date(o.createdAt ?? o.submittedAt).getTime();
          return t >= previousPeriodStart.getTime() && t <= previousPeriodEnd.getTime();
        })
        .reduce((sum: number, o: any) => sum + (o.price || 0), 0);

      let trendPercentage = 0;
      if (previousEarnings === 0) {
        trendPercentage = currentEarnings > 0 ? 100 : 0;
      } else {
        trendPercentage = Math.round(((currentEarnings - previousEarnings) / previousEarnings) * 100);
      }

      setStats({
        activeOffers: pendingOffers.length,
        acceptedOffers: selectedOffers.length,
        rejectedOffers: rejectedOffers.length,
        totalLeads: offers.length,
        walletBalance: walletData.wallet?.balance || 0,
        acceptanceRate: offers.length > 0 ? Math.round((selectedOffers.length / offers.length) * 100) : 0,
        earnings: totalEarnings,
        avgRating: calculatedRating,
        earningsTrend: trendPercentage,
      });

      setEarningsChartData({
        labels: last7Days,
        datasets: [
          {
            label: 'Earnings (₹)',
            data: earningsByDay,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rawOffers.length === 0 && !loading) return;

    const selectedOffers = rawOffers.filter((o: any) => o.status === 'SELECTED' || o.status === 'ACCEPTED');
    const rejectedOffers = rawOffers.filter((o: any) => o.status === 'REJECTED');

    const labels: string[] = [];
    const winsByPeriod: number[] = [];
    const lossesByPeriod: number[] = [];

    const now = new Date();
    let monthsToProcess = 6;

    if (timeFilter === '3M') monthsToProcess = 3;
    if (timeFilter === '6M') monthsToProcess = 6;
    if (timeFilter === '12M') monthsToProcess = 12;
    if (timeFilter === 'LIFETIME') {
      // Find oldest offer
      if (rawOffers.length > 0) {
        const oldest = rawOffers.reduce((oldest: number, current: any) => {
          const date = new Date(current.createdAt).getTime();
          return date < oldest ? date : oldest;
        }, now.getTime());

        const diffMonths = (now.getFullYear() - new Date(oldest).getFullYear()) * 12 + (now.getMonth() - new Date(oldest).getMonth());
        monthsToProcess = Math.max(diffMonths + 1, 1);
      } else {
        monthsToProcess = 1;
      }
    }

    for (let i = monthsToProcess - 1; i >= 0; i--) {
      const base = new Date();
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);

      labels.push(
        d.toLocaleString('en-US', { month: 'short' })
      );

      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

      const wins = selectedOffers.filter((o: any) => {
        const t = new Date(o.createdAt ?? o.submittedAt).getTime();
        return t >= monthStart && t <= monthEnd;
      }).length;

      const losses = rejectedOffers.filter((o: any) => {
        const t = new Date(o.createdAt ?? o.submittedAt).getTime();
        return t >= monthStart && t <= monthEnd;
      }).length;

      winsByPeriod.push(wins);
      lossesByPeriod.push(losses);

    }


    setPerformanceChartData({
      labels,
      datasets: [
        {
          label: 'Leads Won',
          data: winsByPeriod,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
        {
          label: 'Leads Lost',
          data: lossesByPeriod,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
        },
      ],
    });

  }, [rawOffers, timeFilter, loading]);

  const offersStatusData = {
    labels: ['Pending', 'Accepted', 'Rejected'],
    datasets: [
      {
        data: [stats.activeOffers, stats.acceptedOffers, stats.rejectedOffers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
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

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
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
            <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your performance overview</p>
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

        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeOffers}</p>
                  <p className="text-xs text-blue-600 mt-1">Awaiting response</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  <p className="text-xs text-purple-600 mt-1">Lifetime received</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.earnings.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">From accepted offers</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Wallet Balance</p>
                  <p className={`text-3xl font-bold ${stats.walletBalance < 1000 ? 'text-red-600' : 'text-gray-900'}`}>₹{stats.walletBalance.toLocaleString()}</p>
                  {stats.walletBalance < 1000 ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">Low Balance - Recharge!</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Available funds</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stats.walletBalance < 1000 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>
        </MotionContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Rating</h3>
            </div>
            <div className="text-center py-6">
              {stats.avgRating > 0 ? (
                <>
                  <div className="text-6xl font-bold text-yellow-500 mb-2">{stats.avgRating}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-6 h-6 ${star <= Math.floor(stats.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Based on trader feedback</p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-2">
                  <div className="p-3 bg-gray-50 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">No ratings yet</p>
                  <p className="text-xs text-gray-500 mt-1">Complete shipments to earn ratings</p>
                </div>
              )}
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
              <Badge variant={stats.earningsTrend > 0 ? "success" : stats.earningsTrend < 0 ? "danger" : "neutral"}>
                {stats.earningsTrend > 0 ? "+" : ""}{stats.earningsTrend}%
              </Badge>
            </div>
            <div style={{ height: '250px' }}>
              {earningsChartData && <Line data={earningsChartData} options={chartOptions} />}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Win/Loss Ratio</h3>
              <div className="relative inline-block text-left">
                <div>
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-full border border-gray-300 shadow-sm px-4 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setShowTimeFilter(!showTimeFilter)}
                    onBlur={() => setTimeout(() => setShowTimeFilter(false), 200)}
                  >
                    {timeFilter === '3M' ? 'Last 3 Months' :
                      timeFilter === '6M' ? 'Last 6 Months' :
                        timeFilter === '12M' ? 'Last 12 Months' : 'Lifetime'}
                    <svg className="-mr-1 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {showTimeFilter && (
                  <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {[
                        { value: '3M', label: 'Last 3 Months' },
                        { value: '6M', label: 'Last 6 Months' },
                        { value: '12M', label: 'Last 12 Months' },
                        { value: 'LIFETIME', label: 'Lifetime' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          className={`block w-full text-left px-4 py-2 text-sm ${timeFilter === opt.value ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTimeFilter(opt.value);
                            setShowTimeFilter(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: '250px' }}>
              {performanceChartData && (
                <Bar
                  redraw
                  data={performanceChartData}
                  options={chartOptions}
                />
              )}

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

              <MotionContainer className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {quotes.length === 0 ? (
                  <EmptyState
                    icon="🚚"
                    title="No Active Leads"
                    description="Freight requests matching your capabilities will appear here. Complete your partner profile to start receiving leads."
                    actionLabel="Manage Capabilities"
                    actionHref="/partner/capabilities"
                  />
                ) : (
                  quotes.map((quote: any) => (
                    <MotionItem key={quote.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-lg transition-all bg-white">
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
                    </MotionItem>
                  ))
                )}
              </MotionContainer>

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
            <MotionContainer className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No recent activity found.
                </div>
              ) : (
                recentActivity.map((activity) => {
                  const colorClasses: { [key: string]: string } = {
                    blue: 'bg-blue-100',
                    green: 'bg-green-100',
                    red: 'bg-red-100',
                    orange: 'bg-orange-100',
                    purple: 'bg-purple-100',
                  };
                  return (
                    <MotionItem key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${colorClasses[activity.color] || 'bg-gray-100'}`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </MotionItem>
                  );
                })
              )}
            </MotionContainer>
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
