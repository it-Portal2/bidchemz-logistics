import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/router";
import Link from "next/link";

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Shipments</p>
            <p className="text-2xl font-bold text-blue-700">
              {shipments.length}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">In Transit</p>
            <p className="text-2xl font-bold text-yellow-700">
              {shipments.filter((s) => s.status === "IN_TRANSIT").length}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-green-600 font-medium">Delivered</p>
            <p className="text-2xl font-bold text-green-700">
              {shipments.filter((s) => s.status === "DELIVERED").length}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Booked</p>
            <p className="text-2xl font-bold text-purple-700">
              {shipments.filter((s) => s.status === "BOOKED").length}
            </p>
          </Card>
        </div>

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
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <Card
                key={shipment.id}
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

                    {/* BidChemz Reference */}
                    {shipment.quote?.bidId && (
                      <div className="mt-3 text-xs text-gray-400">
                        BidChemz Ref: {shipment.quote.bidId}
                        {shipment.quote?.counterpartyId &&
                          ` | Counterparty: ${shipment.quote.counterpartyId}`}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link href={`/trader/shipments/${shipment.id}`}>
                      <Button variant="outline">Track Shipment</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
