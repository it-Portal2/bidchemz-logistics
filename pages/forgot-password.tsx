import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For now, send email to support
      const subject = encodeURIComponent('Password Reset Request');
      const body = encodeURIComponent(
        `I would like to reset my password for the account: ${email}\n\nPlease send me instructions to reset my password.`
      );
      
      // Open mailto link
      window.location.href = `mailto:support@bidchemz.com?subject=${subject}&body=${body}`;
      
      // Show success message
      setSubmitted(true);
    } catch (err) {
      setError('Failed to process your request. Please try again or contact support directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">BidChemz Logistics</h1>
          <h2 className="text-xl text-gray-900">Reset your password</h2>
        </div>

        <Card>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-sm text-gray-600">
                <p className="mb-4">
                  Enter your email address and we'll help you reset your password.
                </p>
                <p className="text-xs bg-blue-50 border border-blue-200 rounded p-3">
                  Note: Password reset requests are currently handled by our support team. 
                  Your email client will open with a pre-filled message to our support team.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !email}
                className="w-full py-3"
              >
                {loading ? 'Processing...' : 'Request Password Reset'}
              </Button>

              <div className="text-center text-sm">
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
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
              
              <h3 className="text-lg font-semibold text-gray-900">Request Sent!</h3>
              
              <p className="text-sm text-gray-600">
                Your email client should have opened with a pre-filled message to our support team. 
                Please send the email to complete your password reset request.
              </p>
              
              <p className="text-xs text-gray-500">
                If your email client didn't open, you can email us directly at{' '}
                <a href="mailto:support@bidchemz.com" className="text-blue-600 hover:underline">
                  support@bidchemz.com
                </a>
              </p>

              <div className="pt-4">
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
