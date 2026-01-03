import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { MotionContainer, MotionItem } from '@/components/ui/Motion';

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

  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
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
  }, [token]);

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
  }, [token, fetchNotifications]);

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
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
            <Link href="/settings/notifications" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors" title="Notification Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0 flex-1 min-h-0">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No notifications</p>
          </div>
        ) : (
          <MotionContainer className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.map((notification) => (
              <MotionItem
                key={notification.id}
                className={`p-3 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0 relative pl-4 group ${!notification.read ? 'bg-indigo-50/40' : ''
                  }`}
              >
                {/* Left Priority Border Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${notification.priority === 'URGENT' ? 'bg-red-500' :
                  notification.priority === 'HIGH' ? 'bg-orange-500' :
                    notification.priority === 'MEDIUM' ? 'bg-blue-500' :
                      'bg-gray-300'
                  }`} />

                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium leading-snug ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${notification.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                        notification.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          notification.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {notification.priority}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1.5">
                      {notification.message}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </MotionItem>
            ))}
          </MotionContainer>
        )}
      </CardBody>
    </Card>
  );
};
