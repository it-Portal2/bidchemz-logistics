import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from '@/components/ui/Skeleton';
import { MotionContainer, MotionItem } from '@/components/ui/Motion';
import Link from "next/link";
import { useRouter } from "next/router";

type OfferStatus =
  | "PENDING"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";
type TabType = "all" | "pending" | "accepted" | "other";

interface Offer {
  id: string;
  quoteId: string;
  price: number;
  currency: string;
  transitDays: number;
  status: OfferStatus;
  isSelected: boolean;
  selectedAt: string | null;
  submittedAt: string;
  expiresAt: string;
  quote: {
    id: string;
    quoteNumber: string;
    cargoName: string;
    quantity: number;
    quantityUnit: string;
    pickupCity: string;
    deliveryCity: string;
    cargoReadyDate: string;
  };
  shipment?: {
    id: string;
    shipmentNumber: string;
    status: string;
  };
}

export default function PartnerOffers() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const fetchOffers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/offers", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "LOGISTICS_PARTNER") {
      router.push("/");
      return;
    }
    fetchOffers();
  }, [user, token, fetchOffers, router, authLoading]);

  const getStatusBadge = (status: OfferStatus, isSelected: boolean) => {
    if (isSelected || status === "SELECTED") {
      return <Badge variant="success">✅ Accepted</Badge>;
    }
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">⏳ Pending</Badge>;
      case "REJECTED":
        return <Badge variant="danger">❌ Rejected</Badge>;
      case "WITHDRAWN":
        return <Badge variant="neutral">🔙 Withdrawn</Badge>;
      case "EXPIRED":
        return <Badge variant="danger">⏰ Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filterOffers = (tab: TabType): Offer[] => {
    switch (tab) {
      case "pending":
        return offers.filter((o) => o.status === "PENDING");
      case "accepted":
        return offers.filter((o) => o.isSelected || o.status === "SELECTED");
      case "other":
        return offers.filter((o) =>
          ["REJECTED", "WITHDRAWN", "EXPIRED"].includes(o.status)
        );
      default:
        return offers;
    }
  };

  const filteredOffers = filterOffers(activeTab);
  const pendingCount = offers.filter((o) => o.status === "PENDING").length;
  const acceptedCount = offers.filter(
    (o) => o.isSelected || o.status === "SELECTED"
  ).length;
  const otherCount = offers.filter((o) =>
    ["REJECTED", "WITHDRAWN", "EXPIRED"].includes(o.status)
  ).length;

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
            <p className="text-gray-600 mt-1">
              Track your submitted bids and acceptance status
            </p>
          </div>
          <Link href="/partner/leads">
            <Button variant="primary">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse More Leads
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-600">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Total Offers
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {offers.length}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-600">
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-600">
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">
                Accepted
              </p>
              <p className="text-3xl font-bold text-green-600">
                {acceptedCount}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-l-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Other</p>
              <p className="text-3xl font-bold text-gray-600">{otherCount}</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b flex space-x-8">
          {[
            { key: "all", label: "All Offers", count: offers.length },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "accepted", label: "Accepted", count: acceptedCount },
            { key: "other", label: "Rejected/Expired", count: otherCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`pb-3 border-b-2 px-1 font-medium text-sm ${activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Offer List */}
        <MotionContainer className="space-y-4">
          {filteredOffers.length === 0 ? (
            <EmptyState
              icon="📦"
              title={`No ${activeTab === "all" ? "" : activeTab} offers`}
              description={
                activeTab === "pending"
                  ? "You don't have any pending offers. Browse leads to submit new offers."
                  : activeTab === "accepted"
                    ? "No accepted offers yet. Keep submitting competitive offers!"
                    : "No offers in this category."
              }
              actionLabel="Browse Leads"
              actionHref="/partner/leads"
            />
          ) : (
            filteredOffers.map((offer) => (
              <MotionItem key={offer.id}>
                <Card
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      {/* Left - Offer Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {offer.quote.cargoName}
                          </h3>
                          {getStatusBadge(offer.status, offer.isSelected)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            <span>
                              {offer.quote.pickupCity} →{" "}
                              {offer.quote.deliveryCity}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            <span>
                              {offer.quote.quantity} {offer.quote.quantityUnit}
                            </span>
                          </div>
                          <div className="flex items-center text-green-600 font-semibold">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>₹{offer.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{offer.transitDays} days transit</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Quote #{offer.quote.quoteNumber} • Submitted{" "}
                          {new Date(offer.submittedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Right - Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {offer.status === "PENDING" && (
                          <Link href={`/partner/edit-offer?offerId=${offer.id}`}>
                            <Button variant="outline" size="sm">
                              Edit Offer
                            </Button>
                          </Link>
                        )}

                        {(offer.isSelected || offer.status === "SELECTED") && (
                          <Link
                            href={`/partner/shipments/${offer.shipment?.id || offer.id
                              }`}
                          >
                            <Button variant="primary" size="sm">
                              📦 Manage Shipment
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Accepted Offer - Shipment Section */}
                    {(offer.isSelected || offer.status === "SELECTED") && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🚚</span>
                            <span className="font-medium text-gray-900">
                              Shipment Status
                            </span>
                            {offer.shipment ? (
                              <Badge variant="primary">
                                {offer.shipment.status.replace("_", " ")}
                              </Badge>
                            ) : (
                              <Badge variant="warning">
                                Awaiting Shipment Creation
                              </Badge>
                            )}
                          </div>
                          {offer.shipment && (
                            <span className="text-sm text-gray-500">
                              #{offer.shipment.shipmentNumber}
                            </span>
                          )}
                        </div>

                        {!offer.shipment && (
                          <p className="mt-2 text-sm text-gray-600">
                            Shipment will be created once the trader confirms the
                            booking.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </MotionItem>
            ))
          )}
        </MotionContainer>
      </div>
    </Layout>
  );
}
