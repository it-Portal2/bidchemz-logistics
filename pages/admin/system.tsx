import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: string;
    memory: {
      used: number;
      total: number;
    };
  };
}

export default function SystemHealth() {
  const { user } = useAuth();
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [user, router]);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <button
              onClick={fetchHealth}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading system health...</p>
          ) : health ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`text-2xl font-bold ${
                    health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {health.status.toUpperCase()}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatUptime(health.uptime)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Database</p>
                  <p className={`text-2xl font-bold ${
                    health.checks.database === 'ok' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {health.checks.database.toUpperCase()}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {health.checks.memory.used} / {health.checks.memory.total} MB
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(health.checks.memory.used / health.checks.memory.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Last Updated</p>
                <p className="text-gray-900">
                  {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  System Information
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Database</p>
                    <p className="text-gray-900">PostgreSQL (Neon)</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Runtime</p>
                    <p className="text-gray-900">Node.js</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Framework</p>
                    <p className="text-gray-900">Next.js 14</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deployment</p>
                    <p className="text-gray-900">Replit Autoscale</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Failed to load system health</p>
          )}
        </div>
      </div>
    </div>
  );
}
