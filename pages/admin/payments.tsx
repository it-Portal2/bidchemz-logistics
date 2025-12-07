import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Badge, Button, Table, Modal, Alert } from '@/components/ui';
import { useRouter } from 'next/router';

export default function AdminPayments() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchPaymentRequests();
  }, [user, token]);

  useEffect(() => {
    if (!requests || requests.length === 0) {
      setFilteredRequests([]);
      return;
    }
    if (filter === 'ALL') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((r) => r?.status === filter));
    }
  }, [filter, requests]);

  const fetchPaymentRequests = async () => {
    try {
      const response = await fetch('/api/payment-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/payment-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: actionType,
          reviewNotes,
        }),
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: `Payment request ${actionType.toLowerCase()} successfully`,
        });
        setShowModal(false);
        setReviewNotes('');
        setSelectedRequest(null);
        fetchPaymentRequests();
      } else {
        const data = await response.json();
        setAlert({ type: 'danger', message: data.error || 'Failed to review request' });
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred' });
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (request: any, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
    setReviewNotes('');
  };

  const columns = [
    { key: 'id', header: 'Request ID', render: (val: any, row: any) => (!row || !row.id ? 'N/A' : row.id.slice(0, 8)) },
    {
      key: 'user',
      header: 'Partner',
      render: (val: any, row: any) => {
        if (!row) return 'N/A';
        return (
          <div>
            <div className="font-medium">{row.user?.companyName || row.user?.email || 'Unknown'}</div>
            <div className="text-sm text-gray-500">{row.user?.email || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (val: any, row: any) => {
        if (!row) return 'N/A';
        return (
          <span className="font-semibold text-green-600">
            ₹{(row.amount || 0).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (val: any, row: any) => {
        if (!row) return 'N/A';
        return row.paymentMethod ? row.paymentMethod.replace(/_/g, ' ') : 'N/A';
      },
    },
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (val: any, row: any) => (!row ? 'N/A' : (row.referenceNumber || '-')),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (val: any, row: any) => {
        if (!row || !row.createdAt) return 'N/A';
        return new Date(row.createdAt).toLocaleDateString();
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (val: any, row: any) => {
        if (!row || !row.status) return <Badge variant="neutral">UNKNOWN</Badge>;
        const statusColors: any = {
          PENDING: 'yellow',
          APPROVED: 'green',
          REJECTED: 'red',
        };
        return <Badge variant={statusColors[row.status] || 'neutral'}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (val: any, row: any) => {
        if (!row) return <span className="text-sm text-gray-500">-</span>;
        return row.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => openModal(row, 'APPROVED')}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openModal(row, 'REJECTED')}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Requests</h1>
          <p className="text-gray-600">Review and approve wallet recharge requests from partners</p>
        </div>

        {alert && (
          <Alert type={alert.type} className="mb-6" onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Card className="mb-6">
          <div className="flex gap-4 mb-4">
            <Button
              variant={filter === 'PENDING' ? 'primary' : 'secondary'}
              onClick={() => setFilter('PENDING')}
            >
              Pending ({requests?.filter((r) => r?.status === 'PENDING')?.length || 0})
            </Button>
            <Button
              variant={filter === 'APPROVED' ? 'primary' : 'secondary'}
              onClick={() => setFilter('APPROVED')}
            >
              Approved ({requests?.filter((r) => r?.status === 'APPROVED')?.length || 0})
            </Button>
            <Button
              variant={filter === 'REJECTED' ? 'primary' : 'secondary'}
              onClick={() => setFilter('REJECTED')}
            >
              Rejected ({requests?.filter((r) => r?.status === 'REJECTED')?.length || 0})
            </Button>
            <Button
              variant={filter === 'ALL' ? 'primary' : 'secondary'}
              onClick={() => setFilter('ALL')}
            >
              All ({requests?.length || 0})
            </Button>
          </div>

          {filteredRequests.length > 0 ? (
            <Table columns={columns} data={filteredRequests} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No {filter.toLowerCase()} payment requests found
            </div>
          )}
        </Card>
      </div>

      {showModal && selectedRequest && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Payment Request`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Partner:</span>
                  <div className="font-medium">{selectedRequest?.user?.companyName || selectedRequest?.user?.email || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-semibold text-green-600">
                    ₹{(selectedRequest?.amount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Method:</span>
                  <div className="font-medium">
                    {(selectedRequest?.paymentMethod || 'N/A').replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <div className="font-medium">{selectedRequest?.referenceNumber || '-'}</div>
                </div>
              </div>
              {selectedRequest?.requestNotes && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-600">Request Notes:</span>
                  <div className="mt-1">{selectedRequest.requestNotes}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes {actionType === 'REJECTED' && '(Required for rejection)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={3}
                placeholder="Add notes about your decision..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'APPROVED' ? 'primary' : 'secondary'}
                onClick={handleReviewRequest}
                disabled={processing || (actionType === 'REJECTED' && !reviewNotes.trim())}
              >
                {processing ? 'Processing...' : `${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Request`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
