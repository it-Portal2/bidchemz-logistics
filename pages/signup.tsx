import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import PolicyAcceptanceModal from '@/components/PolicyAcceptanceModal';

type UserRole = 'TRADER' | 'LOGISTICS_PARTNER' | 'ADMIN';

const UserRole = {
  TRADER: 'TRADER' as const,
  LOGISTICS_PARTNER: 'LOGISTICS_PARTNER' as const,
  ADMIN: 'ADMIN' as const,
};

export default function Signup() {
  const { signup } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '' as UserRole | '',
    companyName: '',
    gstin: '',
  });
  const [consents, setConsents] = useState({
    termsOfService: false,
    privacyPolicy: false,
    partnerPolicy: false,
  });
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'partner' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsents({
      ...consents,
      [e.target.name]: e.target.checked,
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.role) {
      setError('Please select your role');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!consents.termsOfService) {
      setError('You must accept the Terms of Service to continue');
      setLoading(false);
      return;
    }

    if (!consents.privacyPolicy) {
      setError('You must accept the Privacy Policy to continue');
      setLoading(false);
      return;
    }

    if (formData.role === UserRole.LOGISTICS_PARTNER && !consents.partnerPolicy) {
      setError('Logistics Partners must accept the Partner Policy to continue');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          consents: {
            termsOfService: consents.termsOfService,
            privacyPolicy: consents.privacyPolicy,
            partnerPolicy: formData.role === UserRole.LOGISTICS_PARTNER ? consents.partnerPolicy : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      router.push('/');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    if (role === 'TRADER') {
      return {
        title: 'Chemical Trader',
        description: 'Post your freight requirements and receive competitive offers from verified logistics partners',
      };
    } else if (role === 'LOGISTICS_PARTNER') {
      return {
        title: 'Logistics Partner',
        description: 'Browse freight opportunities and submit competitive bids for chemical transport services',
      };
    }
    return null;
  };

  const roleInfo = formData.role ? getRoleInfo(formData.role) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            BidChemz Logistics
          </h1>
          <p className="text-gray-600 text-lg">Create your free account</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      s === step
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : s < step
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s < step ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${s === step ? 'text-blue-600' : s < step ? 'text-green-600' : 'text-gray-500'}`}>
                    {s === 1 ? 'Account' : s === 2 ? 'Security' : 'Policies'}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 1: Account Information</h3>
                  <p className="text-sm text-gray-600">Tell us about yourself and your business</p>
                </div>

                <Select
                  label="I am a"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { label: 'Select your role', value: '' },
                    { label: 'Chemical Trader (I need logistics)', value: UserRole.TRADER },
                    { label: 'Logistics Partner (I provide services)', value: UserRole.LOGISTICS_PARTNER },
                  ]}
                  required
                />

                {roleInfo && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{roleInfo.title}</h4>
                    <p className="text-sm text-blue-700">{roleInfo.description}</p>
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  autoComplete="email"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <Input
                  label="Company Name"
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company Ltd."
                  autoComplete="organization"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="tel"
                  />

                  <Input
                    label="GSTIN (Optional)"
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 2: Secure Your Account</h3>
                  <p className="text-sm text-gray-600">Create a strong password to protect your account</p>
                </div>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  showRequirements={true}
                />

                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  error={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : undefined}
                />

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Security Tip</p>
                      <p>Use a unique password that you don't use for other accounts. Consider using a password manager.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 3: Review Policies</h3>
                  <p className="text-sm text-gray-600">Please read and accept our policies to continue</p>
                </div>

                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${consents.termsOfService ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-gray-300 hover:border-blue-300'}`}>
                    <div className="flex items-center space-x-3">
                      {consents.termsOfService ? (
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      )}
                      <div>
                        <span className={`font-medium ${consents.termsOfService ? 'text-green-800' : 'text-gray-900'}`}>
                          Terms of Service
                        </span>
                        <p className="text-xs text-gray-600">Platform usage terms and conditions</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('terms')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {consents.termsOfService ? 'Review' : 'Read & Accept'}
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${consents.privacyPolicy ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-gray-300 hover:border-blue-300'}`}>
                    <div className="flex items-center space-x-3">
                      {consents.privacyPolicy ? (
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      )}
                      <div>
                        <span className={`font-medium ${consents.privacyPolicy ? 'text-green-800' : 'text-gray-900'}`}>
                          Privacy Policy
                        </span>
                        <p className="text-xs text-gray-600">How we handle your data</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('privacy')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {consents.privacyPolicy ? 'Review' : 'Read & Accept'}
                    </button>
                  </div>

                  {formData.role === UserRole.LOGISTICS_PARTNER && (
                    <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${consents.partnerPolicy ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-amber-50 border-amber-400 hover:border-amber-500'}`}>
                      <div className="flex items-center space-x-3">
                        {consents.partnerPolicy ? (
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        <div>
                          <span className={`font-medium ${consents.partnerPolicy ? 'text-green-800' : 'text-amber-800'}`}>
                            Logistics Partner Policy <span className="text-red-600">*Required</span>
                          </span>
                          <p className="text-xs text-gray-600">Partner-specific terms and lead fees</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModal('partner')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        {consents.partnerPolicy ? 'Review' : 'Read & Accept'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <PolicyAcceptanceModal
              isOpen={activeModal === 'terms'}
              policyType="terms"
              onAccept={() => {
                setConsents({ ...consents, termsOfService: true });
                setActiveModal(null);
              }}
              onDecline={() => setActiveModal(null)}
              requireScroll={true}
            />

            <PolicyAcceptanceModal
              isOpen={activeModal === 'privacy'}
              policyType="privacy"
              onAccept={() => {
                setConsents({ ...consents, privacyPolicy: true });
                setActiveModal(null);
              }}
              onDecline={() => setActiveModal(null)}
              requireScroll={true}
            />

            <PolicyAcceptanceModal
              isOpen={activeModal === 'partner'}
              policyType="partner"
              onAccept={() => {
                setConsents({ ...consents, partnerPolicy: true });
                setActiveModal(null);
              }}
              onDecline={() => setActiveModal(null)}
              requireScroll={true}
            />

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(step - 1);
                    setError('');
                  }}
                  className="flex-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  fullWidth={step === 1}
                  className="flex-1 shadow-lg"
                >
                  Continue
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  fullWidth={step === 1}
                  className="flex-1 shadow-lg"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold group">
                Sign in instead
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
