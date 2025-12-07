import React from 'react';
import { PARTNER_POLICY } from '@/lib/policy';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

export default function PartnerPolicyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <div className="prose prose-sm max-w-none">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Logistics Partner Policy</h1>
              <p className="text-sm text-gray-600">
                Version {PARTNER_POLICY.version} | Effective Date: {PARTNER_POLICY.effectiveDate.toLocaleDateString()}
              </p>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This policy applies to all logistics partners offering services through the BidChemz platform.
                  Acceptance of this policy is mandatory for all logistics partners.
                </p>
              </div>
            </div>
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {PARTNER_POLICY.content}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
