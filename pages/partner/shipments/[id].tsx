import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import { useRouter } from "next/router";

type ShipmentStatus =
  | "BOOKED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED"
  | "CANCELLED"
  | "DELAYED";

const STATUS_OPTIONS: { value: ShipmentStatus; label: string; icon: string }[] =
  [
    { value: "BOOKED", label: "Booked", icon: "📦" },
    { value: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: "📅" },
    { value: "PICKED_UP", label: "Picked Up", icon: "📦" },
    { value: "IN_TRANSIT", label: "In Transit", icon: "🚛" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
    { value: "DELIVERED", label: "Delivered", icon: "✅" },
    { value: "EXCEPTION", label: "Exception", icon: "⚠️" },
    { value: "RETURNED", label: "Returned", icon: "↩️" },
    { value: "DELAYED", label: "Delayed", icon: "⏳" },
    { value: "CANCELLED", label: "Cancelled", icon: "❌" },
  ];

const getStatusBadge = (status: ShipmentStatus) => {
  const variants: Record<
    ShipmentStatus,
    "primary" | "warning" | "success" | "danger" | "neutral"
  > = {
    BOOKED: "primary",
    PICKUP_SCHEDULED: "warning",
    PICKED_UP: "primary",
    IN_TRANSIT: "primary",
    OUT_FOR_DELIVERY: "success",
    DELIVERED: "success",
    EXCEPTION: "danger",
    RETURNED: "warning",
    DELAYED: "warning",
    CANCELLED: "danger",
  };
  return (
    <Badge variant={variants[status] || "neutral"}>
      {status.replace("_", " ")}
    </Badge>
  );
};

export default function ShipmentDetail() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  // Status update form
  const [newStatus, setNewStatus] = useState<ShipmentStatus | "">("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [notes, setNotes] = useState("");

  const fetchShipment = useCallback(async () => {
    if (!id || !token) return;

    try {
      const response = await fetch(`/api/shipments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShipment(data.shipment);
        setNewStatus(data.shipment.status);
        setCurrentLocation(data.shipment.currentLocation || "");
      } else {
        setAlert({ type: "danger", message: "Failed to fetch shipment" });
      }
    } catch (error) {
      console.error("Error fetching shipment:", error);
      setAlert({ type: "danger", message: "Failed to fetch shipment" });
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!user || user.role !== "LOGISTICS_PARTNER") {
      router.push("/");
      return;
    }
    fetchShipment();
  }, [user, router, fetchShipment]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    setUpdating(true);
    setAlert(null);

    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          currentLocation,
          notes,
        }),
      });

      if (response.ok) {
        setAlert({
          type: "success",
          message: "Shipment status updated successfully!",
        });
        setNotes("");
        fetchShipment();
      } else {
        const data = await response.json();
        setAlert({
          type: "danger",
          message: data.error || "Failed to update status",
        });
      }
    } catch (error) {
      setAlert({ type: "danger", message: "Failed to update status" });
    } finally {
      setUpdating(false);
    }
  };

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Offers
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Shipment #{shipment.shipmentNumber}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(shipment.status)}
              <span className="text-gray-500">
                Quote: {shipment.quote.quoteNumber}
              </span>
            </div>
          </div>
        </div>

        {alert && <Alert type={alert.type}>{alert.message}</Alert>}

        {/* Shipment Details */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shipment Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cargo</p>
                <p className="font-medium">{shipment.quote.cargoName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">
                  {shipment.quote.quantity} {shipment.quote.quantityUnit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium">
                  {shipment.quote.pickupCity} → {shipment.quote.deliveryCity}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                <p className="font-medium">
                  {shipment.currentLocation || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium">
                  {shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium text-green-600">
                  ₹{shipment.offer.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Update Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Update Shipment Status
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as ShipmentStatus)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Location
                </label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., Mumbai Warehouse, Highway NH-48"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                onClick={handleStatusUpdate}
                disabled={updating || !newStatus}
                variant="primary"
              >
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tracking History */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tracking History
            </h2>

            {!shipment.trackingEvents ||
            shipment.trackingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No tracking events yet
              </p>
            ) : (
              <div className="space-y-4">
                {(shipment.trackingEvents as any[])
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 border-l-2 border-blue-200 pl-4"
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500 -ml-6 mt-1.5"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.status?.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
