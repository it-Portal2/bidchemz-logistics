import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { CheckboxGroup } from '@/components/forms/CheckboxGroup';
import { useRouter } from 'next/router';
import { HazardClass, VehicleType, PackagingType, SubscriptionTier } from '@prisma/client';

export default function PartnerCapabilities() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [capabilities, setCapabilities] = useState({
    dgClasses: [] as string[],
    serviceStates: [] as string[],
    fleetTypes: [] as string[],
    packagingCapabilities: [] as string[],
    temperatureControlled: false,
    subscriptionTier: 'FREE' as SubscriptionTier,
  });

  useEffect(() => {
    if (!user || user.role !== 'LOGISTICS_PARTNER') {
      router.push('/');
      return;
    }

    fetchCapabilities();
  }, [user, token]);

  const fetchCapabilities = async () => {
    try {
      const response = await fetch('/api/partner/capabilities', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.capabilities) {
          setCapabilities(data.capabilities);
        }
      }
    } catch (error) {
      console.error('Error fetching capabilities:', error);
    }
  };

  const handleCheckboxChange = (field: string, values: string[]) => {
    setCapabilities(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/partner/capabilities', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(capabilities),
      });

      if (response.ok) {
        alert('Capabilities updated successfully!');
      } else {
        alert('Failed to update capabilities');
      }
    } catch (error) {
      console.error('Error saving capabilities:', error);
      alert('Failed to update capabilities');
    } finally {
      setSaving(false);
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Partner Capabilities</h1>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Service Capabilities</h2>

            <CheckboxGroup
              label="Hazard Classes Handled"
              name="dgClasses"
              value={capabilities.dgClasses}
              onChange={(values) => handleCheckboxChange('dgClasses', values)}
              options={Object.values(HazardClass).map(hc => ({
                label: hc.replace('_', ' '),
                value: hc,
              }))}
            />

            <CheckboxGroup
              label="States Served"
              name="serviceStates"
              value={capabilities.serviceStates}
              onChange={(values) => handleCheckboxChange('serviceStates', values)}
              options={indianStates.map(state => ({
                label: state,
                value: state,
              }))}
              required
            />

            <CheckboxGroup
              label="Fleet Types Available"
              name="fleetTypes"
              value={capabilities.fleetTypes}
              onChange={(values) => handleCheckboxChange('fleetTypes', values)}
              options={Object.values(VehicleType).map(vt => ({
                label: vt.replace('_', ' '),
                value: vt,
              }))}
              required
            />

            <CheckboxGroup
              label="Packaging Types Handled"
              name="packagingCapabilities"
              value={capabilities.packagingCapabilities}
              onChange={(values) => handleCheckboxChange('packagingCapabilities', values)}
              options={Object.values(PackagingType).map(pt => ({
                label: pt.replace('_', ' '),
                value: pt,
              }))}
              required
            />

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="temperatureControlled"
                checked={capabilities.temperatureControlled}
                onChange={(e) =>
                  setCapabilities(prev => ({
                    ...prev,
                    temperatureControlled: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="temperatureControlled" className="ml-2 text-sm text-gray-700">
                Temperature Controlled Transportation Available
              </label>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Capabilities'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
