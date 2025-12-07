import React from 'react';
import { PRIVACY_POLICY } from '@/lib/policy';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <div className="prose prose-sm max-w-none">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-sm text-gray-600">
                Version {PRIVACY_POLICY.version} | Effective Date: {PRIVACY_POLICY.effectiveDate.toLocaleDateString()}
              </p>
            </div>
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {PRIVACY_POLICY.content}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
