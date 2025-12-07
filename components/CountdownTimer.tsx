import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  showSeconds?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  expiresAt, 
  onExpire,
  showSeconds = true 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !hasExpired) {
        setHasExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, hasExpired, onExpire]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (showSeconds) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getColorClass = () => {
    const minutes = Math.floor(timeRemaining / 1000 / 60);
    if (minutes <= 0) return 'text-red-600 bg-red-50';
    if (minutes <= 10) return 'text-orange-600 bg-orange-50';
    if (minutes <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (hasExpired || timeRemaining === 0) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
        Expired
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getColorClass()}`}>
      ⏱️ {formatTime(timeRemaining)}
    </span>
  );
};
