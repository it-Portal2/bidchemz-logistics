import React, { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  showLabel?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  showLabel = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const hasExpiredRef = useRef<boolean>(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = expiry - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (!hasExpiredRef.current && onExpire) {
          hasExpiredRef.current = true;
          onExpire();
        }
        return 0;
      } else {
        if (hasExpiredRef.current) {
          hasExpiredRef.current = false;
        }
        return remaining;
      }
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getColorClass = () => {
    const minutesRemaining = timeRemaining / (1000 * 60);
    
    if (timeRemaining === 0) {
      return 'bg-gray-100 text-gray-600 border-gray-300';
    } else if (minutesRemaining < 10) {
      return 'bg-red-50 text-red-700 border-red-300 animate-pulse';
    } else if (minutesRemaining < 30) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    } else {
      return 'bg-green-50 text-green-700 border-green-300';
    }
  };

  const getIcon = () => {
    if (timeRemaining === 0) {
      return '⏰';
    }
    const minutesRemaining = timeRemaining / (1000 * 60);
    if (minutesRemaining < 10) {
      return '🔴';
    } else if (minutesRemaining < 30) {
      return '🟡';
    } else {
      return '🟢';
    }
  };

  const expiryDate = new Date(expiresAt);

  return (
    <div className={`inline-flex items-center px-4 py-3 rounded-lg border-2 ${getColorClass()}`}>
      <span className="text-2xl mr-2">{getIcon()}</span>
      <div>
        {showLabel && (
          <p className="text-xs font-medium uppercase tracking-wide opacity-75">
            {timeRemaining === 0 ? 'Expired' : 'Time Remaining'}
          </p>
        )}
        <p className="text-lg font-bold">
          {timeRemaining === 0 ? 'Quote Expired' : formatTime(timeRemaining)}
        </p>
        <p className="text-xs opacity-75">
          Expires: {expiryDate.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default CountdownTimer;
