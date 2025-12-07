import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminPricingConfig() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [pricing, setPricing] = useState({
    baseLeadCost: 100,
    hazardMultipliers: {
      CLASS_1: 3.0,
      CLASS_2: 2.5,
      CLASS_3: 2.0,
      CLASS_4: 1.8,
      CLASS_5: 1.5,
      CLASS_6: 1.7,
      CLASS_7: 1.3,
      CLASS_8: 2.2,
      CLASS_9: 1.4,
    },
    distanceMultipliers: {
      local: 1.0,
      intracity: 1.2,
      interstate: 1.5,
      international: 2.5,
    },
    subscriptionDiscounts: {
      FREE: 0,
      BASIC: 10,
      PRO: 20,
      ENTERPRISE: 30,
    },
  });

  const hazardClassInfo: Record<string, { name: string; icon: string; description: string }> = {
    CLASS_1: { name: 'Explosives', icon: '💥', description: 'Fireworks, ammunition, flares' },
    CLASS_2: { name: 'Gases', icon: '🔥', description: 'Compressed, liquefied gases' },
    CLASS_3: { name: 'Flammable Liquids', icon: '🔥', description: 'Petrol, diesel, solvents' },
    CLASS_4: { name: 'Flammable Solids', icon: '🔥', description: 'Matches, sulfur' },
    CLASS_5: { name: 'Oxidizing Agents', icon: '⚗️', description: 'Peroxides, fertilizers' },
    CLASS_6: { name: 'Toxic Substances', icon: '☠️', description: 'Pesticides, medical waste' },
    CLASS_7: { name: 'Radioactive', icon: '☢️', description: 'Medical isotopes' },
    CLASS_8: { name: 'Corrosives', icon: '🧪', description: 'Acids, alkalies' },
    CLASS_9: { name: 'Miscellaneous', icon: '⚠️', description: 'Batteries, dry ice' },
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchPricingConfig();
  }, [user, router]);

  const fetchPricingConfig = async () => {
    try {
      const response = await fetch('/api/admin/pricing-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setPricing({
            baseLeadCost: data.config.baseLeadCost || 100,
            hazardMultipliers: data.config.hazardMultipliers || pricing.hazardMultipliers,
            distanceMultipliers: data.config.distanceMultipliers || pricing.distanceMultipliers,
            subscriptionDiscounts: data.config.subscriptionDiscounts || pricing.subscriptionDiscounts,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/admin/pricing-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricing),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Pricing configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save pricing configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const calculateExample = (hazardClass: string) => {
    const base = pricing.baseLeadCost;
    const multiplier = pricing.hazardMultipliers[hazardClass as keyof typeof pricing.hazardMultipliers];
    return Math.round(base * multiplier);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pricing configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Pricing Configuration</h1>
          <p className="text-gray-600">Configure how much logistics partners pay for each lead based on cargo type, distance, and subscription tier</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 How it Works</h3>
                <p className="text-sm text-blue-800">
                  <strong>Final Price</strong> = Base Cost × Hazard Multiplier × Distance Multiplier - Subscription Discount%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Base Lead Cost (₹)
                </label>
                <input
                  type="number"
                  value={pricing.baseLeadCost}
                  onChange={(e) => setPricing({ ...pricing, baseLeadCost: Number(e.target.value) })}
                  className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Starting price before any multipliers are applied
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hazard Class Risk Multipliers
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Higher multipliers for more dangerous cargo types. Each class increases the base cost by this factor.
                </p>
                
                <div className="space-y-3">
                  {Object.entries(pricing.hazardMultipliers).map(([key, value]) => {
                    const info = hazardClassInfo[key];
                    const examplePrice = calculateExample(key);
                    
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{info.name}</div>
                              <div className="text-xs text-gray-500">{info.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Example Price</div>
                            <div className="text-lg font-bold text-blue-600">₹{examplePrice}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.1"
                            value={value}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                hazardMultipliers: {
                                  ...pricing.hazardMultipliers,
                                  [key]: Number(e.target.value),
                                },
                              })
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={value}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                hazardMultipliers: {
                                  ...pricing.hazardMultipliers,
                                  [key]: Number(e.target.value),
                                },
                              })
                            }
                            className="w-20 px-3 py-1 border border-gray-300 rounded text-center font-semibold"
                          />
                          <span className="text-gray-500 text-sm">×</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distance Multipliers</h3>
              <p className="text-sm text-gray-600 mb-4">
                Longer distances cost more for logistics partners
              </p>
              <div className="space-y-3">
                {Object.entries(pricing.distanceMultipliers).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {key === 'local' && '📍 Local (Same City)'}
                      {key === 'intracity' && '🚗 Intra-City (< 100 km)'}
                      {key === 'interstate' && '🚚 Interstate (> 100 km)'}
                      {key === 'international' && '✈️ International'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={value}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            distanceMultipliers: {
                              ...pricing.distanceMultipliers,
                              [key]: Number(e.target.value),
                            },
                          })
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={value}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            distanceMultipliers: {
                              ...pricing.distanceMultipliers,
                              [key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-semibold text-sm"
                      />
                      <span className="text-gray-500 text-sm">×</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Discounts (%)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Reward premium partners with better pricing
              </p>
              <div className="space-y-3">
                {Object.entries(pricing.subscriptionDiscounts).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {key === 'FREE' && '🆓 Free Tier'}
                      {key === 'BASIC' && '⭐ Basic Tier'}
                      {key === 'PRO' && '💎 Pro Tier'}
                      {key === 'ENTERPRISE' && '👑 Enterprise Tier'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={value}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            subscriptionDiscounts: {
                              ...pricing.subscriptionDiscounts,
                              [key]: Number(e.target.value),
                            },
                          })
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg"
                      />
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="50"
                        value={value}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            subscriptionDiscounts: {
                              ...pricing.subscriptionDiscounts,
                              [key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-semibold text-sm"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💰 Example Calculation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Cost:</span>
                  <span className="font-semibold">₹{pricing.baseLeadCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Corrosive (Class 8):</span>
                  <span className="font-semibold">× {pricing.hazardMultipliers.CLASS_8}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interstate:</span>
                  <span className="font-semibold">× {pricing.distanceMultipliers.interstate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pro Discount:</span>
                  <span className="font-semibold">-{pricing.subscriptionDiscounts.PRO}%</span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Final Price:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{Math.round(pricing.baseLeadCost * pricing.hazardMultipliers.CLASS_8 * pricing.distanceMultipliers.interstate * (1 - pricing.subscriptionDiscounts.PRO / 100))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            className="min-w-[150px]"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
