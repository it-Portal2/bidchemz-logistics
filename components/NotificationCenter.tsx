import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timestamp: string; // Map createdAt to timestamp
  createdAt?: string;
  read: boolean;
  type: string;
}

export const NotificationCenter: React.FC = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const controller = new AbortController();
      fetchNotifications(controller.signal);

      const interval = setInterval(() => {
        fetchNotifications(controller.signal);
      }, 30000);

      return () => {
        controller.abort();
        clearInterval(interval);
      };
    }
  }, [token]);

  const fetchNotifications = async (signal?: AbortSignal) => {
    if (!token || typeof token !== "string") return;

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        const mapped = data.notifications.map((n: any) => ({
          ...n,
          timestamp: n.createdAt
        }));
        setNotifications(mapped);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      // Use warn to avoid Red Box in dev which happens on network disconnects/halts
      console.warn('Failed to fetch notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [] }), // Empty array = mark all
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0 flex-1 min-h-0">
        <div className="h-[400px] overflow-y-auto divide-y divide-gray-200">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};
