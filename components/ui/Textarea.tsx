import React, { useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = providedId || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`
            w-full px-4 py-2 border rounded-md transition-all duration-200
            ${error 
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
              : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-secondary-50 disabled:cursor-not-allowed
            resize-vertical min-h-[100px]
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-secondary-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
