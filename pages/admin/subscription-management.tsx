import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const SubscriptionTiers = ['FREE', 'STANDARD', 'PREMIUM'];

export default function SubscriptionManagementPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [newTier, setNewTier] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/users?role=LOGISTICS_PARTNER');
      if (response.ok) {
        const data = await response.json();
        setPartners(data.users || []);
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to fetch partners' });
    } finally {
      setLoading(false);
    }
  };

  const handleTierUpdate = async (userId: string, tier: string) => {
    try {
      const response = await fetch('/api/admin/subscription-tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscriptionTier: tier,
        }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Subscription tier updated!' });
        fetchPartners();
        setSelectedPartner(null);
      } else {
        const data = await response.json();
        setAlert({ type: 'danger', message: data.error });
      }
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to update tier' });
    }
  };

  const getTierColor = (tier: string) => {
    const colors: any = {
      FREE: 'gray',
      STANDARD: 'blue',
      PREMIUM: 'purple',
    };
    return colors[tier] || 'gray';
  };

  if (loading) return <Layout><div className="text-center py-12">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage partner subscription tiers and pricing</p>
        </div>

        {alert && <Alert type={alert.type}>{alert.message}</Alert>}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Current Tier
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {partner.companyName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {partner.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getTierColor(partner.partnerCapability?.subscriptionTier || 'FREE')}>
                        {partner.partnerCapability?.subscriptionTier || 'FREE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newTier === partner.id ? selectedPartner : ''}
                        onChange={(e) => {
                          setSelectedPartner(partner);
                          setNewTier(e.target.value);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                      >
                        <option value="">Select tier...</option>
                        {SubscriptionTiers.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                      {newTier && selectedPartner?.id === partner.id && (
                        <Button
                          size="sm"
                          onClick={() => handleTierUpdate(partner.id, newTier)}
                          className="ml-2"
                        >
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
