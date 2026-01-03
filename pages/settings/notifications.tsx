import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/router';

const PARTNER_EVENT_TYPES = [
    { id: 'NEW_LEAD', label: 'New Lead Available', description: 'When a new lead matches your capabilities' },
    { id: 'LOW_BALANCE', label: 'Low Wallet Balance', description: 'When your wallet balance falls below threshold' },
    { id: 'QUOTE_DEADLINE', label: 'Quote Deadline Approaching', description: 'When a quote submission deadline is near' },
    { id: 'SYSTEM', label: 'System Notifications', description: 'General system announcements' },
];

const TRADER_EVENT_TYPES = [
    { id: 'OFFER_STATUS', label: 'Offer Updates', description: 'When you receive a new offer or offer status changes' },
    { id: 'SHIPMENT_UPDATE', label: 'Shipment Updates', description: 'Status updates on your active shipments' },
    { id: 'QUOTE_DEADLINE', label: 'Quote Expiry Alert', description: 'When your quote request is about to expire' },
    { id: 'SYSTEM', label: 'System Notifications', description: 'General system announcements' },
];

const ADMIN_EVENT_TYPES = [
    ...PARTNER_EVENT_TYPES,
    ...TRADER_EVENT_TYPES.filter(t => !PARTNER_EVENT_TYPES.find(p => p.id === t.id))
];

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600 bg-gray-100' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-700 bg-blue-100' },
    { value: 'HIGH', label: 'High', color: 'text-orange-700 bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-700 bg-red-100' },
];

export default function NotificationSettings() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [preferences, setPreferences] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (token) {
            fetchPreferences();
        }
    }, [token]);

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/settings/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPreferences(data.preferences || {});
            }
        } catch (error) {
            console.error('Failed to fetch preferences', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriorityChange = (eventId: string, priority: string) => {
        setPreferences(prev => ({
            ...prev,
            [eventId]: priority
        }));
    };

    const savePreferences = async () => {
        setSaving(true);
        setSuccessMessage('');
        try {
            const res = await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ preferences })
            });

            if (res.ok) {
                setSuccessMessage('Preferences saved successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Failed to save preferences', error);
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    let eventTypes = PARTNER_EVENT_TYPES;
    if (user.role === 'TRADER') {
        eventTypes = TRADER_EVENT_TYPES;
    } else if (user.role === 'ADMIN') {
        eventTypes = ADMIN_EVENT_TYPES;
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-600 mt-1">Customize the priority of notifications you receive.</p>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900">Priority Rules</h2>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading settings...</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {eventTypes.map((event) => {
                                        const currentPriority = preferences[event.id] || 'MEDIUM';
                                        return (
                                            <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="mb-3 sm:mb-0">
                                                    <h3 className="text-sm font-medium text-gray-900">{event.label}</h3>
                                                    <p className="text-xs text-gray-500">{event.description}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority:</span>
                                                    <div className="flex bg-white rounded-md shadow-sm">
                                                        {PRIORITIES.map((p) => (
                                                            <button
                                                                key={p.value}
                                                                onClick={() => handlePriorityChange(event.id, p.value)}
                                                                className={`px-3 py-2 text-xs font-medium first:rounded-l-md last:rounded-r-md border-y border-r first:border-l transition-all
                                  ${currentPriority === p.value
                                                                        ? `${p.color} border-current ring-1 ring-inset ring-current z-10`
                                                                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {p.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                    {successMessage && (
                                        <span className="mr-4 text-sm text-green-600 font-medium animate-fade-in">
                                            {successMessage}
                                        </span>
                                    )}
                                    <Button
                                        variant="primary"
                                        onClick={savePreferences}
                                        isLoading={saving}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </Layout>
    );
}
