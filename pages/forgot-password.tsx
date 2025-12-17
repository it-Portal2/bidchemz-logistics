import React, { useState } from 'react';
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
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setSubmitted(true);
    } catch {
      setError('Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">

        {/* LOGO / BRAND */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            BidChemz Logistics
          </h1>
        </div>

        {/* ================= REQUEST FORM ================= */}
        {!submitted && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Reset your password
            </h2>

            <p className="text-sm text-gray-600 text-center mb-6">
              Enter the email associated with your account and we’ll send you a
              secure reset link.
            </p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? 'Sending reset link…' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        {/* ================= SUCCESS STATE ================= */}
        {submitted && (
          <div className="text-center">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check your email
            </h2>

            <p className="text-sm text-gray-700 mb-4">
              We’ve sent a secure password reset link to your email address.
            </p>

            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              If an account exists with the email you entered, you’ll receive the
              link shortly. The link will expire in <strong>30 minutes</strong>.
              Please check your spam or promotions folder if you don’t see it.
            </p>

            <Link
              href="/login"
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Back to Sign In
            </Link>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Resend email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
