import React, { useState } from 'react';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timestamp: string;
  read: boolean;
  type: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Lead Available',
      message: 'Sulfuric Acid transport from Mumbai to Delhi - 25 MT',
      priority: 'HIGH',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false,
      type: 'NEW_LEAD',
    },
    {
      id: '2',
      title: 'Quote Deadline Approaching',
      message: 'Only 10 minutes remaining to submit your offer',
      priority: 'URGENT',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: false,
      type: 'TIMER_WARNING',
    },
    {
      id: '3',
      title: 'Low Wallet Balance',
      message: 'Your current balance is ₹450. Please recharge soon.',
      priority: 'MEDIUM',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      type: 'LOW_BALANCE',
    },
  ]);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
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
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
