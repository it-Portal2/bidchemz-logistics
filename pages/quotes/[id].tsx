import React, { useEffect, useState, useCallback, useMemo } from "react";
import toast from 'react-hot-toast';
import { playNotificationSound } from "@/utils/sound";
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
              className={`pb-3 border-b-2 ${activeTab === tab
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
                      {offer.partner?.email && (
                        <p className="text-xs text-gray-500">{offer.partner.email}</p>
                      )}
                      {offer.partner?.phone && (
                        <p className="text-xs text-gray-500">{offer.partner.phone}</p>
                      )}
                      <p className="text-blue-600 font-bold mt-1">₹{offer.price}</p>
                      <p className="text-sm">
                        {offer.transitDays ? `${offer.transitDays} days` : "Transit days N/A"}
                      </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isTrader && (
              <DocumentUpload
                quoteId={quoteId as string}
                token={token!}
                onUploadComplete={() => {
                  fetchQuote();
                  playNotificationSound();
                  toast.success("Document list refreshed");
                }}
              />
            )}

            <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${!isTrader ? 'col-span-2' : ''}`}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
                <span className="text-sm text-gray-500">{quote.documents?.length || 0} files</span>
              </div>
              <div className="p-0">
                {quote.documents?.length ? (
                  <ul className="divide-y divide-gray-100">
                    {quote.documents.map((d: any) => (
                      <li key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center min-w-0 gap-4">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate" title={d.fileName}>
                              {d.fileName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{(d.fileSize / 1024).toFixed(1)} KB</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="uppercase text-xs font-semibold tracking-wider text-gray-600">{d.documentType}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const toastId = toast.loading("Downloading...");
                              try {
                                const res = await fetch(`/api/documents/${d.id}/download`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) throw new Error('Download failed');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = d.fileName;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                toast.dismiss(toastId);
                                toast.success("Download started");
                              } catch (err) {
                                console.error(err);
                                toast.error('Failed to download document', { id: toastId });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>

                          {isTrader && (
                            <button
                              onClick={() => {
                                toast.custom((t) => (
                                  <div
                                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                                      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                                  >
                                    <div className="flex-1 w-0 p-4">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                          </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            Delete Document?
                                          </p>
                                          <p className="mt-1 text-sm text-gray-500">
                                            Are you sure you want to delete this document? This action cannot be undone.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex border-l border-gray-200">
                                      <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={async () => {
                                          toast.dismiss(t.id);
                                          const deleteToastId = toast.loading("Deleting...");
                                          try {
                                            const res = await fetch(`/api/documents/${d.id}`, {
                                              method: 'DELETE',
                                              headers: { Authorization: `Bearer ${token}` },
                                            });

                                            if (!res.ok) {
                                              const data = await res.json();
                                              throw new Error(data.error || 'Delete failed');
                                            }

                                            playNotificationSound();
                                            toast.success("Document deleted", { id: deleteToastId });
                                            fetchQuote();
                                          } catch (err) {
                                            console.error(err);
                                            toast.error(err instanceof Error ? err.message : 'Failed to delete document', { id: deleteToastId });
                                          }
                                        }}
                                        className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 border-l border-gray-200"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ));
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">No documents yet</h3>
                    <p className="text-gray-500 text-sm">Upload files to share with partners</p>
                  </div>
                )}
              </div>
            </div>
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
