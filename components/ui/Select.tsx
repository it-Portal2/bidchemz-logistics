import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
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
            appearance-none bg-white
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export default Select;
