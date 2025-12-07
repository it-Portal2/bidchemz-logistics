import React, { ReactNode } from 'react';
import Card from '../ui/Card';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <Card className="mb-6">
      <div
        className={`border-b border-gray-200 pb-4 mb-4 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {collapsible && (
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {isExpanded && <div className="space-y-4">{children}</div>}
    </Card>
  );
}
