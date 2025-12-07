import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, PARTNER_POLICY } from '@/lib/policy';

export default function PoliciesPage() {
  const policies = [
    {
      title: 'Terms of Service',
      description: 'Understand your rights and responsibilities when using BidChemz Logistics platform',
      link: '/policies/terms',
      version: TERMS_OF_SERVICE.version,
      effectiveDate: TERMS_OF_SERVICE.effectiveDate,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Privacy Policy',
      description: 'Learn how we collect, use, and protect your personal information',
      link: '/policies/privacy',
      version: PRIVACY_POLICY.version,
      effectiveDate: PRIVACY_POLICY.effectiveDate,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Logistics Partner Policy',
      description: 'Requirements and standards for logistics partners on our platform',
      link: '/policies/partner',
      version: PARTNER_POLICY.version,
      effectiveDate: PARTNER_POLICY.effectiveDate,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal & Compliance</h1>
          <p className="text-lg text-gray-600">
            Review our policies to understand how we operate and protect your rights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {policies.map((policy) => (
            <Link href={policy.link} key={policy.link}>
              <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-500">
                <div className="p-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    {policy.icon}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{policy.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">{policy.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>Version {policy.version}</p>
                    <p>Effective: {policy.effectiveDate.toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Questions about our policies?</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about our terms, privacy practices, or partner requirements, please don&apos;t hesitate to contact us.
            </p>
            <a href="mailto:legal@bidchemz.com" className="text-blue-600 hover:text-blue-800 font-semibold">
              legal@bidchemz.com
            </a>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
