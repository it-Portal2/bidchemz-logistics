import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useRouter } from "next/router";

export default function QuoteDetails() {
  const { user, token } = useAuth();
  const router = useRouter();
  const quoteId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "offers" | "documents"
  >("details");
  const [sortBy, setSortBy] = useState<"price" | "transit" | "rating">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* =========================
     Fetch Quote
  ========================== */
  const fetchQuote = useCallback(async () => {
    if (!quoteId || !token) return;

    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setQuote(null);
        return;
      }

      const data = await res.json();
      setQuote(data.quote);
    } catch (err) {
      console.error("Fetch quote failed:", err);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [quoteId, token]);

  useEffect(() => {
    if (user && quoteId) {
      setLoading(true);
      fetchQuote();
    }
  }, [user, quoteId, fetchQuote]);

  /* =========================
     Derived Values (SAFE)
  ========================== */
  const isTrader = user?.role === "TRADER";
  const offersCount = quote?.offers?.length || 0;

  const sortedOffers = useMemo(() => {
    if (!quote?.offers) return [];

    const offers = [...quote.offers];
    offers.sort((a: any, b: any) => {
      let diff = 0;

      switch (sortBy) {
        case "price":
          diff = a.price - b.price;
          break;
        case "transit":
          diff = a.transitDays - b.transitDays;
          break;
        case "rating":
          diff = (b.partner?.rating || 0) - (a.partner?.rating || 0);
          break;
      }

      return sortOrder === "asc" ? diff : -diff;
    });

    return offers;
  }, [quote?.offers, sortBy, sortOrder]);

  /* =========================
     Early Returns
  ========================== */
  if (loading) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout>
        <div className="py-12 text-center text-gray-600">Quote not found</div>
      </Layout>
    );
  }

  /* =========================
     UI
  ========================== */
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>

          {quote.expiresAt && quote.status === "MATCHING" && (
            <CountdownTimer expiresAt={quote.expiresAt} showSeconds />
          )}
        </div>

        {/* Quote Summary */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{quote.cargoName}</h1>
                <p className="text-gray-600">{quote.quoteNumber}</p>
              </div>

              <Badge variant="primary">{quote.status.replace("_", " ")}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Info
                label="Quantity"
                value={`${quote.quantity} ${quote.quantityUnit}`}
              />
              <Info label="Packaging" value={quote.packagingType} />
              <Info
                label="Ready Date"
                value={new Date(quote.cargoReadyDate).toLocaleDateString()}
              />
              <Info label="Offers" value={offersCount} highlight />
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <div className="border-b mb-6 flex space-x-8">
          {["details", "offers", "documents"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* DETAILS */}
        {activeTab === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Shipment Details</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4">
              {quote.bidId && (
                <Info label="BidChemz Bid ID" value={quote.bidId} highlight />
              )}
              <Info label="CAS Number" value={quote.casNumber || "N/A"} />
              <Info
                label="From"
                value={`${quote.pickupCity}, ${quote.pickupState}`}
              />
              <Info
                label="To"
                value={`${quote.deliveryCity}, ${quote.deliveryState}`}
              />
              {quote.isHazardous && <Badge variant="danger">⚠ Hazardous</Badge>}
            </CardBody>
          </Card>
        )}

        {/* OFFERS */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            {offersCount === 0 ? (
              <Card>
                <CardBody className="text-center py-12 text-gray-500">
                  No offers received yet
                </CardBody>
              </Card>
            ) : (
              sortedOffers.map((offer: any) => (
                <Card key={offer.id}>
                  <CardBody className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {offer.partner?.companyName}
                      </p>
                      <p className="text-blue-600 font-bold">₹{offer.price}</p>
                      <p className="text-sm">{offer.transitDays} days</p>
                    </div>

                    {isTrader && (
                      <Button
                        variant="primary"
                        onClick={() =>
                          router.push(`/trader/offers?quoteId=${quoteId}`)
                        }
                      >
                        View
                      </Button>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isTrader && (
              <DocumentUpload
                quoteId={quoteId as string}
                token={token!}
                onUploadComplete={fetchQuote}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardBody>
                {quote.documents?.length ? (
                  quote.documents.map((d: any) => (
                    <div key={d.id} className="border p-3 rounded mb-2">
                      {d.fileName}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">
                    No documents uploaded
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* =========================
   Helper Component
========================== */
function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-semibold ${highlight ? "text-green-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
