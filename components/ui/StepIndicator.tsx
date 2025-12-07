import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
}) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">
          {stepTitles[currentStep - 1] || `Step ${currentStep} of ${totalSteps}`}
        </p>
        <p className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div
              key={stepNumber}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-blue-600'
                  : isCurrent
                  ? 'bg-blue-400'
                  : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      {stepTitles.length > 0 && (
        <div className="hidden md:flex justify-between mt-2">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={index}
                className={`text-xs ${
                  isCompleted
                    ? 'text-blue-600 font-medium'
                    : isCurrent
                    ? 'text-blue-500 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                {title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StepIndicator;
