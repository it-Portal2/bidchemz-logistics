import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/router";

type ShipmentStatus =
  | "BOOKED"
  | "PICKUP_SCHEDULED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "DELAYED";

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { color: string; icon: string; label: string }
> = {
  BOOKED: { color: "blue", icon: "📋", label: "Booked" },
  PICKUP_SCHEDULED: { color: "yellow", icon: "📅", label: "Pickup Scheduled" },
  IN_TRANSIT: { color: "indigo", icon: "🚛", label: "In Transit" },
  DELIVERED: { color: "green", icon: "✅", label: "Delivered" },
  DELAYED: { color: "orange", icon: "⚠️", label: "Delayed" },
  CANCELLED: { color: "red", icon: "❌", label: "Cancelled" },
};

const getStatusBadge = (status: ShipmentStatus) => {
  const variants: Record<
    ShipmentStatus,
    "primary" | "warning" | "success" | "danger" | "neutral"
  > = {
    BOOKED: "primary",
    PICKUP_SCHEDULED: "warning",
    IN_TRANSIT: "primary",
    DELIVERED: "success",
    DELAYED: "warning",
    CANCELLED: "danger",
  };
  const config = STATUS_CONFIG[status] || { icon: "📦", label: status };
  return (
    <Badge variant={variants[status] || "neutral"}>
      {config.icon} {config.label}
    </Badge>
  );
};

export default function TraderShipmentDetail() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchShipment = useCallback(async () => {
    if (!id || !token) return;

    try {
      const response = await fetch(`/api/shipments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShipment(data.shipment);
      }
    } catch (error) {
      console.error("Error fetching shipment:", error);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!user || user.role !== "TRADER") {
      router.push("/");
      return;
    }
    fetchShipment();
  }, [user, router, fetchShipment]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading shipment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!shipment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Shipment not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const quote = shipment.quote || {};
  const offer = shipment.offer || {};

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/trader/shipments")}
            className="mb-4"
          >
            ← Back to Shipments
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shipment #{shipment.shipmentNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge(shipment.status)}
                {shipment.currentLocation && (
                  <span className="text-gray-500 text-sm">
                    📍 {shipment.currentLocation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>




        {/* BidChemz Reference */}
        {quote.bidId && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  BidChemz Reference
                </p>
                <p className="text-lg font-bold text-purple-800">
                  Bid ID: {quote.bidId}
                </p>
                {quote.counterpartyId && (
                  <p className="text-sm text-purple-600">
                    Counterparty: {quote.counterpartyId}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Shipment Status
          </h2>
          <div className="flex items-center justify-between">
            {["BOOKED", "PICKUP_SCHEDULED", "IN_TRANSIT", "DELIVERED"].map(
              (s, i) => {
                const isActive = shipment.status === s;
                const isPast =
                  [
                    "BOOKED",
                    "PICKUP_SCHEDULED",
                    "IN_TRANSIT",
                    "DELIVERED",
                  ].indexOf(shipment.status) >= i;

                return (
                  <React.Fragment key={s}>
                    <div
                      className={`flex flex-col items-center ${isPast ? "text-green-600" : "text-gray-400"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${isActive
                            ? "bg-blue-600 text-white ring-4 ring-blue-200"
                            : isPast
                              ? "bg-green-500 text-white"
                              : "bg-gray-200"
                          }`}
                      >
                        {STATUS_CONFIG[s as ShipmentStatus]?.icon}
                      </div>
                      <span className="text-xs mt-2 font-medium">
                        {STATUS_CONFIG[s as ShipmentStatus]?.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${isPast &&
                          i <
                          [
                            "BOOKED",
                            "PICKUP_SCHEDULED",
                            "IN_TRANSIT",
                            "DELIVERED",
                          ].indexOf(shipment.status)
                          ? "bg-green-500"
                          : "bg-gray-200"
                          }`}
                      />
                    )}
                  </React.Fragment>
                );
              }
            )}
          </div>
        </Card>

        {/* Pickup & Delivery Addresses */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📦 Pickup Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{quote.pickupAddress}</p>
                <p className="text-gray-600">
                  {quote.pickupCity}, {quote.pickupState} {quote.pickupPincode}
                </p>
              </div>
              {quote.pickupContactName && (
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{quote.pickupContactName}</p>
                  <p className="text-gray-600">{quote.pickupContactPhone}</p>
                </div>
              )}
              {shipment.actualPickupDate && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Picked up on{" "}
                    {new Date(shipment.actualPickupDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🏠 Delivery Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{quote.deliveryAddress}</p>
                <p className="text-gray-600">
                  {quote.deliveryCity}, {quote.deliveryState}{" "}
                  {quote.deliveryPincode}
                </p>
              </div>
              {quote.deliveryContactName && (
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{quote.deliveryContactName}</p>
                  <p className="text-gray-600">{quote.deliveryContactPhone}</p>
                </div>
              )}
              {shipment.actualDeliveryDate && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Delivered on{" "}
                    {new Date(shipment.actualDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {shipment.estimatedDelivery && !shipment.actualDeliveryDate && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-blue-600 font-medium">
                    🕐 Expected by{" "}
                    {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Logistics Partner */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚚 Logistics Partner
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {offer.partner?.companyName}
              </p>
              <p className="text-gray-600">{offer.partner?.email}</p>
              <p className="text-green-600 font-medium mt-1">
                ₹{offer.price?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Tracking History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📍 Tracking History
          </h2>

          {!shipment.trackingEvents || shipment.trackingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tracking updates yet
            </p>
          ) : (
            <div className="space-y-4">
              {(shipment.trackingEvents as any[])
                .slice()
                .reverse()
                .map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      {index < shipment.trackingEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-blue-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {event.status?.replace("_", " ")}
                        </p>
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-600">
                          📍 {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-500">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Cargo Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Cargo Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Cargo Name</p>
              <p className="font-medium">{quote.cargoName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium">
                {quote.quantity} {quote.quantityUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quote Number</p>
              <p className="font-medium">{quote.quoteNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CAS Number</p>
              <p className="font-medium">{quote.casNumber || "N/A"}</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
