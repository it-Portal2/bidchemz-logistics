import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/router";

import Link from "next/link";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { MotionContainer, MotionItem } from "@/components/ui/Motion";

type ShipmentStatus =
  | "BOOKED"
  | "PICKUP_SCHEDULED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "DELAYED";

const getStatusBadge = (status: ShipmentStatus) => {
  const config: Record<
    ShipmentStatus,
    {
      variant: "primary" | "warning" | "success" | "danger" | "neutral";
      icon: string;
    }
  > = {
    BOOKED: { variant: "primary", icon: "📋" },
    PICKUP_SCHEDULED: { variant: "warning", icon: "📅" },
    IN_TRANSIT: { variant: "primary", icon: "🚛" },
    DELIVERED: { variant: "success", icon: "✅" },
    DELAYED: { variant: "warning", icon: "⚠️" },
    CANCELLED: { variant: "danger", icon: "❌" },
  };
  const { variant, icon } = config[status] || {
    variant: "neutral",
    icon: "📦",
  };
  return (
    <Badge variant={variant}>
      {icon} {status.replace("_", " ")}
    </Badge>
  );
};

export default function TraderShipments() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const openReviewModal = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setRating(0);
    setFeedback("");
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedShipmentId) return;
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/shipments/${selectedShipmentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, feedback }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setIsReviewOpen(false);
        fetchShipments(); // Refresh list to show updated status
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchShipments = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/shipments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user || user.role !== "TRADER") {
      router.push("/");
      return;
    }
    fetchShipments();
  }, [user, router, fetchShipments]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading shipments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Shipments</h1>
            <p className="text-gray-500 mt-1">Track your booked shipments</p>
          </div>
          <Link href="/quotes">
            <Button variant="primary">View My Quotes</Button>
          </Link>
        </div>

        {/* Stats */}
        <MotionContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MotionItem>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Total Shipments</p>
              <p className="text-2xl font-bold text-blue-700">
                {shipments.length}
              </p>
            </Card>
          </MotionItem>
          <MotionItem>
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">In Transit</p>
              <p className="text-2xl font-bold text-yellow-700">
                {shipments.filter((s) => s.status === "IN_TRANSIT").length}
              </p>
            </Card>
          </MotionItem>
          <MotionItem>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <p className="text-sm text-green-600 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-700">
                {shipments.filter((s) => s.status === "DELIVERED").length}
              </p>
            </Card>
          </MotionItem>
          <MotionItem>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Booked</p>
              <p className="text-2xl font-bold text-purple-700">
                {shipments.filter((s) => s.status === "BOOKED").length}
              </p>
            </Card>
          </MotionItem>
        </MotionContainer>

        {/* Shipments List */}
        {shipments.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Shipments Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Your booked shipments will appear here once you accept an offer.
            </p>
            <Link href="/quotes">
              <Button variant="primary">View My Quotes</Button>
            </Link>
          </Card>
        ) : (
          <MotionContainer className="space-y-4">
            {shipments.map((shipment) => (
              <MotionItem key={shipment.id}>
                <Card
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          Shipment #{shipment.shipmentNumber}
                        </h3>
                        {getStatusBadge(shipment.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Cargo</p>
                          <p className="font-medium">
                            {shipment.quote?.cargoName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Route</p>
                          <p className="font-medium">
                            {shipment.quote?.pickupCity} →{" "}
                            {shipment.quote?.deliveryCity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Partner</p>
                          <p className="font-medium">
                            {shipment.offer?.partner?.companyName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Current Location</p>
                          <p className="font-medium">
                            {shipment.currentLocation || "Not updated"}
                          </p>
                        </div>
                      </div>


                    </div>

                    <div className="ml-4 flex flex-col space-y-2 align-end">
                      <Link href={`/trader/shipments/${shipment.id}`}>
                        <Button variant="outline" size="sm">Track Shipment</Button>
                      </Link>

                      {shipment.status === 'DELIVERED' && !shipment.rating && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openReviewModal(shipment.id)}
                        >
                          ★ Write Review
                        </Button>
                      )}

                      {shipment.rating && (
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">
                            {"★".repeat(shipment.rating)}{"☆".repeat(5 - shipment.rating)}
                          </div>
                          <p className="text-xs text-gray-500">Reviewed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>
        )}

        <Modal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title="Rate Logistics Partner"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReviewSubmit}
                isLoading={submittingReview}
              >
                Submit Review
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">How was your experience?</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl focus:outline-none transition-transform hover:scale-110 ${rating >= star ? "text-yellow-500" : "text-gray-300"
                      }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share more details about the service..."
              />
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
