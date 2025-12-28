import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import { NotificationCenter } from "@/components/NotificationCenter";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { MotionContainer, MotionItem } from '@/components/ui/Motion';
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

export default function TraderDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    withOffers: 0,
    selected: 0,
    total: 0,
    totalSpend: 0,
    avgQuoteValue: 0,
    lowestRate: 0,
    completedShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch("/api/quotes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const quotesList = data.quotes || [];
        setQuotes(quotesList);

        const selectedQuotes = quotesList.filter(
          (q: any) => q.status === "SELECTED"
        );
        const totalSpend = selectedQuotes.reduce(
          (sum: number, q: any) => sum + (q.selectedOffer?.price || 0),
          0
        );
        const allOffers = selectedQuotes.flatMap((q: any) => q.offers || []);
        const lowestRate =
          allOffers.length > 0
            ? Math.min(...allOffers.map((o: any) => o.price || Infinity))
            : 0;

        setStats({
          active: quotesList.filter((q: any) => q.status === "MATCHING").length,
          withOffers: quotesList.filter(
            (q: any) => q.status === "OFFERS_AVAILABLE"
          ).length,
          selected: selectedQuotes.length,
          total: quotesList.length,
          totalSpend: totalSpend,
          avgQuoteValue:
            quotesList.length > 0 ? totalSpend / quotesList.length : 0,
          lowestRate: lowestRate === Infinity ? 0 : lowestRate,
          completedShipments: selectedQuotes.length,
        });
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (token) {
      fetchQuotes();
    }
  }, [token, fetchQuotes, authLoading]);

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonCard />
            </div>
            <div>
              <SkeletonCard />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== "TRADER") {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Traders only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trader Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user.companyName || user.email}
            </p>
          </div>
          <Link href="/quotes/new">
            <Button variant="primary" className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Freight Request</span>
            </Button>
          </Link>
        </div>

        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Quotes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-xs text-blue-600 mt-1">Awaiting offers</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">With Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.withOffers}</p>
                  <p className="text-xs text-green-600 mt-1">Ready to select</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedShipments}</p>
                  <p className="text-xs text-purple-600 mt-1">Shipments</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Link href="/trader/shipments">
              <Card className="hover:shadow-lg transition-shadow border-indigo-200 cursor-pointer h-full group">
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">My Shipments</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.completedShipments}</p>
                    <p className="text-xs text-indigo-600 mt-1 group-hover:underline">Track Now →</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          </MotionItem>
        </MotionContainer>

        <MotionContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Quote Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.avgQuoteValue.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>

          <MotionItem>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Lowest Rate</p>
                  <p className="text-2xl font-bold text-green-600">₹{stats.lowestRate.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </MotionItem>
        </MotionContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Freight Requests</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {quotes.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="No Freight Requests Yet"
                    description="Create your first request to receive competitive quotations from pre-verified logistics partners."
                    actionLabel="+ Create Your First Quote"
                    actionHref="/quotes/new"
                  />
                ) : (
                  <div className="h-[400px] overflow-y-auto divide-y divide-gray-200">
                    {quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/quotes/${quote.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {quote.cargoName}
                              </h4>
                              <Badge
                                variant={
                                  quote.status === "SELECTED"
                                    ? "success"
                                    : quote.status === "OFFERS_AVAILABLE"
                                      ? "primary"
                                      : quote.status === "MATCHING"
                                        ? "warning"
                                        : "neutral"
                                }
                              >
                                {quote.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {quote.pickupCity} → {quote.deliveryCity} |{" "}
                              {quote.quantity} {quote.quantityUnit}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {quote.quoteNumber} | {quote.offers?.length || 0}{" "}
                              offers
                            </p>
                          </div>
                          <div>
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {quotes.length > 5 && (
                  <div className="p-4 border-t">
                    <Link href="/quotes">
                      <Button variant="secondary" className="w-full">
                        View All Requests
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <NotificationCenter />
          </div>
        </div>
      </div>
    </Layout>
  );
}
