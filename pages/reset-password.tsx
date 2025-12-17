import { useRouter } from 'next/router';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">Invalid or missing reset token.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } else {
      setError('Invalid or expired reset link');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">BidChemz Logistics</h1>
          <p className="text-gray-600 mt-2">Reset your account password</p>
        </div>

        <Card>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
              />

              <p className="text-xs text-gray-500">
                Password should be at least 8 characters and include a number & symbol.
              </p>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3"
                disabled={loading}
              >
                {loading ? 'Updating password...' : 'Update Password'}
              </Button>

              <div className="text-center text-sm pt-2">
                <Link href="/login" className="text-blue-600 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Password Updated Successfully
              </h3>

              <p className="text-sm text-gray-600">
                You’ll be redirected to the login page shortly.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
