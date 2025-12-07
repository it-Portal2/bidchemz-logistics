import React, { useState, useRef, useEffect } from 'react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, PARTNER_POLICY } from '@/lib/policy';
import Button from '@/components/ui/Button';

interface PolicyAcceptanceModalProps {
  isOpen: boolean;
  policyType: 'terms' | 'privacy' | 'partner';
  onAccept: () => void;
  onDecline: () => void;
  requireScroll?: boolean;
}

export default function PolicyAcceptanceModal({
  isOpen,
  policyType,
  onAccept,
  onDecline,
  requireScroll = true,
}: PolicyAcceptanceModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!requireScroll);
  const contentRef = useRef<HTMLDivElement>(null);

  const policies = {
    terms: TERMS_OF_SERVICE,
    privacy: PRIVACY_POLICY,
    partner: PARTNER_POLICY,
  };

  const titles = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    partner: 'Logistics Partner Policy',
  };

  const policy = policies[policyType];
  const title = titles[policyType];

  useEffect(() => {
    if (!requireScroll) {
      setHasScrolledToBottom(true);
    }
  }, [requireScroll]);

  const handleScroll = () => {
    if (!contentRef.current || !requireScroll) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollThreshold = 20; // pixels from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Version {policy.version} | Effective: {policy.effectiveDate.toLocaleDateString()}
          </p>
          {requireScroll && !hasScrolledToBottom && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Please scroll to the bottom to read the entire policy before accepting
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {policy.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {hasScrolledToBottom ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">You've read the policy</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">
                  Scroll to bottom to enable acceptance
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onDecline}>
                Decline
              </Button>
              <Button
                variant="primary"
                onClick={onAccept}
                disabled={!hasScrolledToBottom}
              >
                I Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
