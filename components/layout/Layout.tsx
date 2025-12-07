import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-blue-600">
                BidChemz Logistics
              </Link>
              
              {user && user.role === 'TRADER' && (
                <div className="hidden md:flex items-center space-x-6">
                  <Link 
                    href="/trader/dashboard" 
                    className={`text-sm ${router.pathname === '/trader/dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/quotes" 
                    className={`text-sm ${router.pathname.includes('/quotes') ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    My Requests
                  </Link>
                  <Link 
                    href="/quotes/new" 
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    + New Request
                  </Link>
                </div>
              )}
              
              {user && user.role === 'LOGISTICS_PARTNER' && (
                <div className="hidden md:flex items-center space-x-6">
                  <Link 
                    href="/partner/dashboard" 
                    className={`text-sm ${router.pathname === '/partner/dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/partner/leads" 
                    className={`text-sm ${router.pathname === '/partner/leads' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Active Leads
                  </Link>
                  <Link 
                    href="/partner/wallet" 
                    className={`text-sm ${router.pathname === '/partner/wallet' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Wallet
                  </Link>
                  <Link 
                    href="/partner/recharge" 
                    className={`text-sm ${router.pathname === '/partner/recharge' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Recharge
                  </Link>
                  <Link 
                    href="/partner/capabilities" 
                    className={`text-sm ${router.pathname === '/partner/capabilities' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Capabilities
                  </Link>
                </div>
              )}
              
              {user && user.role === 'ADMIN' && (
                <div className="hidden md:flex items-center space-x-6">
                  <Link 
                    href="/admin/dashboard" 
                    className={`text-sm ${router.pathname === '/admin/dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className={`text-sm ${router.pathname === '/admin/users' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Users
                  </Link>
                  <Link 
                    href="/admin/payments" 
                    className={`text-sm ${router.pathname === '/admin/payments' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Payments
                  </Link>
                  <Link 
                    href="/admin/pricing" 
                    className={`text-sm ${router.pathname === '/admin/pricing' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Pricing
                  </Link>
                  <Link 
                    href="/admin/system" 
                    className={`text-sm ${router.pathname === '/admin/system' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    System
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">
                    {user.companyName || user.email}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {user.role === 'LOGISTICS_PARTNER' ? 'Partner' : user.role === 'TRADER' ? 'Trader' : 'Admin'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
                    Login
                  </Link>
                  <Link href="/signup" className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
