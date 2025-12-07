import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'LOGISTICS_PARTNER') {
        router.push('/partner/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'TRADER') {
        router.push('/trader/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 bg-opacity-80 border border-blue-400 mb-6">
                <span className="text-sm font-semibold text-white">Powered by BidChemz Chemical Marketplace</span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                India's First<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-200">
                  Chemical Logistics Exchange
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 mb-4 max-w-4xl mx-auto leading-relaxed">
                Connecting chemical traders with verified logistics partners through reverse bidding. Get competitive quotes for your hazardous and non-hazardous freight in minutes.
              </p>
              <p className="text-lg text-blue-200 mb-10 max-w-3xl mx-auto">
                Built by BidChemz, India's leading chemical marketplace, to solve the logistics challenge for our buyers and sellers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <button 
                  onClick={() => router.push('/signup')}
                  className="group inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 px-10 py-5 text-lg font-bold shadow-2xl rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
                >
                  Get Started Free
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center justify-center bg-transparent text-white hover:bg-white hover:bg-opacity-10 px-10 py-5 text-lg font-semibold border-2 border-white rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
                >
                  Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>ISO Certified Partners</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>DG Class 1-9 Handling</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-Time GPS Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 border-t border-blue-600 border-opacity-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="group">
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">500+</div>
                  <div className="text-blue-300 font-medium">Verified Logistics Partners</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">50K+</div>
                  <div className="text-blue-300 font-medium">Chemical Traders Served</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">1M+</div>
                  <div className="text-blue-300 font-medium">Tons Transported Safely</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">₹500Cr+</div>
                  <div className="text-blue-300 font-medium">Freight Value Processed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About BidChemz Platform */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  About BidChemz Logistics
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                  Born from India's Largest Chemical Marketplace
                </h2>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  BidChemz started as India's premier B2B chemical marketplace, connecting thousands of chemical buyers and sellers across the country. As we grew, we identified a critical gap: <strong>efficient, reliable logistics for chemical freight</strong>.
                </p>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  Our traders were spending hours calling multiple logistics companies, negotiating prices, and worrying about compliance. We built this logistics exchange to solve that problem once and for all.
                </p>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Today, BidChemz Logistics seamlessly integrates with our chemical marketplace, giving our existing buyers and sellers instant access to India's largest network of verified chemical logistics providers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => router.push('/signup')}
                    className="inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 text-base font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
                  >
                    Join the Platform
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Marketplace Integration</h4>
                        <p className="text-gray-600">Seamlessly book logistics while buying or selling chemicals on BidChemz marketplace</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Pre-Verified Partners</h4>
                        <p className="text-gray-600">All logistics partners vetted by BidChemz quality team for compliance and reliability</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Transparent Pricing</h4>
                        <p className="text-gray-600">Competitive reverse bidding ensures you always get the best market rates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get your chemical freight moving in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow border border-gray-100 h-full">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-6 mx-auto">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Post Your Requirement</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Submit your freight details - cargo type, DG class, weight, origin, destination, and special handling needs. Our comprehensive form captures all requirements.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-blue-300">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow border border-gray-100 h-full">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-6 mx-auto">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Receive Competitive Quotes</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Multiple verified logistics partners bid on your requirement. Review detailed quotes with pricing breakdowns, transit times, and value-added services.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-blue-300">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow border border-gray-100 h-full">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full text-2xl font-bold mb-6 mx-auto">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Book & Track</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Select your preferred partner and confirm booking. Track your shipment in real-time with GPS, receive automated updates, and access all documents securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Subscription Model */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border border-green-100">
              <div className="text-center mb-12">
                <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  For Logistics Partners
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  Grow Your Chemical Logistics Business
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Access high-quality leads from BidChemz's 50,000+ chemical traders through our transparent subscription model
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Verified Leads</h4>
                    <p className="text-gray-600">Access to pre-qualified freight requirements from active chemical traders</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Prepaid Wallet System</h4>
                    <p className="text-gray-600">Pay-per-lead model with transparent pricing based on freight value and complexity</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Flexible Tiers</h4>
                    <p className="text-gray-600">Choose from Free, Standard, or Premium plans with different lead access and discounts</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => router.push('/signup')}
                  className="inline-flex items-center justify-center bg-green-600 text-white hover:bg-green-700 px-10 py-5 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300 cursor-pointer"
                >
                  Join as Logistics Partner
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Why BidChemz Logistics?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Enterprise-grade features purpose-built for chemical logistics
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">DG Class 1-9 Compliance</h3>
                <p className="text-gray-600">
                  All partners verified for Dangerous Goods handling across all 9 UN classifications with proper certifications
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">ISO & PESO Certified</h3>
                <p className="text-gray-600">
                  Partners hold ISO 9001, ISO 14001, and PESO certifications ensuring quality and safety standards
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AES-256 Document Security</h3>
                <p className="text-gray-600">
                  Military-grade encryption for MSDS, SDS, and all shipment documents with role-based access control
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time GPS Tracking</h3>
                <p className="text-gray-600">
                  Live shipment tracking with automated status updates, milestone notifications, and ETA predictions
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
                <p className="text-gray-600">
                  Round-the-clock customer support for traders and partners with dedicated account managers for premium tiers
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-lg mb-6">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics Dashboard</h3>
                <p className="text-gray-600">
                  Comprehensive insights on freight costs, transit times, partner performance, and spending patterns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Ready to Transform Your Chemical Logistics?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of chemical traders and logistics partners using BidChemz to streamline their freight operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/signup')}
                className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 px-10 py-5 text-lg font-bold shadow-2xl rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
              >
                Start Free Today
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
