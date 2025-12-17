import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying email...');

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || typeof token !== 'string') {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStatus('success');
        setMessage('Email verified successfully. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed or link expired.');
      });
  }, [router.isReady, token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className={status === 'error' ? 'text-red-600' : 'text-gray-700'}>
        {message}
      </p>
    </div>
  );
}
