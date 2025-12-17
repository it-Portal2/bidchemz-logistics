import Link from 'next/link';

export default function VerifyPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>

        <p className="text-gray-600 mb-6">
          We’ve sent a verification link to your email address.
          Please check your inbox and click the link to activate your account.
        </p>

        <p className="text-sm text-gray-500">
          Didn’t receive the email? Check spam or&nbsp;
          <Link href="/resend-verification" className="text-blue-600 underline">
            resend verification email
          </Link>
        </p>
      </div>
    </div>
  );
}
