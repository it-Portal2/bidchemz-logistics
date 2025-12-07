import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  balance: number;
  currency: string;
  lowBalanceAlert: boolean;
  alertThreshold: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  description: string;
  transactionDate: string;
  leadId?: string;
}

interface PaymentRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  referenceNumber?: string;
  transactionId?: string;
  requestNotes?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function PartnerWallet() {
  const { user, token } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('');
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    transactionId: '',
    paymentDate: '',
    requestNotes: '',
  });

  useEffect(() => {
    if (token) {
      fetchWallet();
      fetchPaymentRequests();
    }
  }, [token]);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
        setAlertThreshold(data.wallet.alertThreshold.toString());
        setLowBalanceAlert(data.wallet.lowBalanceAlert);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      const response = await fetch('/api/payment-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    }
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!rechargeForm.paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          paymentMethod: rechargeForm.paymentMethod,
          referenceNumber: rechargeForm.referenceNumber,
          transactionId: rechargeForm.transactionId,
          paymentDate: rechargeForm.paymentDate || null,
          requestNotes: rechargeForm.requestNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Payment request submitted successfully! Admin will review and approve your recharge.');
        setRechargeForm({
          amount: '',
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: '',
          transactionId: '',
          paymentDate: '',
          requestNotes: '',
        });
        setShowRechargeModal(false);
        fetchPaymentRequests();
      } else {
        alert(data.error || 'Failed to submit payment request');
      }
    } catch (error) {
      alert('Failed to submit payment request');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateSettings = async () => {
    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold < 0) {
      alert('Please enter a valid threshold');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/wallet/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lowBalanceAlert,
          alertThreshold: threshold,
        }),
      });

      if (response.ok) {
        alert('Settings updated successfully');
        fetchWallet();
      } else {
        const data = await response.json();
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      alert('Update failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (!user || user.role !== 'LOGISTICS_PARTNER') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Partners only.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const isLowBalance = wallet && wallet.lowBalanceAlert && wallet.balance <= wallet.alertThreshold;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Lead Wallet</h1>

        {successMessage && (
          <Alert type="success" className="mb-6">
            {successMessage}
          </Alert>
        )}

        {isLowBalance && (
          <Alert type="warning" className="mb-6">
            ⚠️ Low balance alert! Your current balance (₹{wallet?.balance.toLocaleString()}) is below your threshold (₹{wallet?.alertThreshold.toLocaleString()}). Please recharge to continue receiving leads.
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-center py-6">
                <p className="text-5xl font-bold text-blue-600 mb-2">
                  ₹{wallet?.balance.toLocaleString() || '0'}
                </p>
                <p className="text-gray-600">Available Credits</p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => setShowRechargeModal(true)}
                >
                  Request Wallet Recharge
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  All recharges require admin verification
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="lowBalanceAlert"
                    checked={lowBalanceAlert}
                    onChange={(e) => setLowBalanceAlert(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="lowBalanceAlert" className="ml-2 text-sm text-gray-700">
                    Low balance alerts
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="100"
                  />
                </div>

                <Button
                  variant="secondary"
                  onClick={handleUpdateSettings}
                  disabled={processing}
                  className="w-full"
                >
                  Update Settings
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Payment Requests Section */}
        {paymentRequests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recharge Requests</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{request.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.referenceNumber || request.transactionId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {request.reviewNotes || request.requestNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wallet?.transactions?.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          transaction.transactionType === 'CREDIT'
                            ? 'bg-green-100 text-green-800'
                            : transaction.transactionType === 'DEBIT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={transaction.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.transactionType === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {showRechargeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Request Wallet Recharge</CardTitle>
              </CardHeader>
              <CardBody>
                <Alert type="info" className="mb-4">
                  <strong>Manual Approval Required:</strong> Submit your payment details below. An admin will verify your payment and approve the recharge. Credits will be added to your wallet only after admin approval.
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recharge Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={rechargeForm.amount}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="100"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1000, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setRechargeForm({ ...rechargeForm, amount: amount.toString() })}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                      >
                        ₹{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={rechargeForm.paymentMethod}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="ONLINE">Online Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={rechargeForm.referenceNumber}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, referenceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter reference number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={rechargeForm.transactionId}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, transactionId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter transaction ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={rechargeForm.paymentDate}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={rechargeForm.requestNotes}
                      onChange={(e) => setRechargeForm({ ...rechargeForm, requestNotes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Any additional information about the payment..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowRechargeModal(false);
                        setRechargeForm({
                          amount: '',
                          paymentMethod: 'BANK_TRANSFER',
                          referenceNumber: '',
                          transactionId: '',
                          paymentDate: '',
                          requestNotes: '',
                        });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRecharge}
                      disabled={processing || !rechargeForm.amount}
                      className="flex-1"
                    >
                      {processing ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
