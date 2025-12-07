import React from 'react';
import { TERMS_OF_SERVICE } from '@/lib/policy';
import { Layout } from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

export default function TermsOfServicePage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <div className="prose prose-sm max-w-none">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-sm text-gray-600">
                Version {TERMS_OF_SERVICE.version} | Effective Date: {TERMS_OF_SERVICE.effectiveDate.toLocaleDateString()}
              </p>
            </div>
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {TERMS_OF_SERVICE.content}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
