import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button, Input, Select, Alert, Badge, Table } from '@/components/ui';
import { useRouter } from 'next/router';

export default function PartnerRecharge() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'LOGISTICS_PARTNER') {
      router.push('/');
      return;
    }

    fetchPaymentRequests();
  }, [user, token]);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      setAlert({ type: 'danger', message: 'Please enter a valid amount' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          referenceNumber,
          transactionId,
          paymentDate: paymentDate || null,
          requestNotes,
        }),
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Recharge request submitted successfully! Admin will review it shortly.',
        });
        setAmount('');
        setReferenceNumber('');
        setTransactionId('');
        setPaymentDate('');
        setRequestNotes('');
        fetchPaymentRequests();
      } else {
        const data = await response.json();
        setAlert({ type: 'danger', message: data.error || 'Failed to submit request' });
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'ONLINE', label: 'Online Payment' },
  ];

  const columns = [
    { key: 'id', header: 'Request ID', render: (row: any) => (!row || !row.id ? 'N/A' : row.id.slice(0, 8)) },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: any) => !row ? 'N/A' : `₹${(row.amount || 0).toLocaleString()}`,
    },
    { key: 'paymentMethod', header: 'Method', render: (row: any) => !row ? 'N/A' : (row.paymentMethod || 'N/A').replace(/_/g, ' ') },
    { key: 'referenceNumber', header: 'Reference', render: (row: any) => !row ? 'N/A' : (row.referenceNumber || '-') },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (row: any) => !row ? 'N/A' : new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => {
        if (!row) return 'N/A';
        const colors: any = {
          PENDING: 'yellow',
          APPROVED: 'green',
          REJECTED: 'red',
        };
        return <Badge variant={colors[row.status] || 'gray'}>{row.status || 'UNKNOWN'}</Badge>;
      },
    },
    {
      key: 'reviewNotes',
      header: 'Admin Notes',
      render: (row: any) => !row ? 'N/A' : (row.reviewNotes || '-'),
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Wallet Recharge</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-xl font-semibold mb-6">Submit Recharge Request</h2>

            {alert && (
              <Alert type={alert.type} className="mb-4" onClose={() => setAlert(null)}>
                {alert.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={paymentMethods}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <Input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <Input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Bank/UPI transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Any additional information..."
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Recharge Request'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Bank Details</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Account Name:</strong> BidChemz Logistics Pvt Ltd</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>IFSC Code:</strong> ABCD0001234</p>
                <p><strong>Bank:</strong> Sample Bank, Mumbai Branch</p>
              </div>
            </div>
          </Card>

          <div>
            <Card>
              <h2 className="text-xl font-semibold mb-6">Your Recharge Requests</h2>

              {requests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table columns={columns} data={requests} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No recharge requests yet
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
