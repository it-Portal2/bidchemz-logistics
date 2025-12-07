import React from 'react';

interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
}

interface CheckboxGroupProps {
  label: string;
  name: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (values: string[]) => void;
  error?: string;
  required?: boolean;
}

export function CheckboxGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required = false,
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <input
              type="checkbox"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className="ml-3 cursor-pointer"
            >
              <span className="block text-sm text-gray-900">{option.label}</span>
              {option.description && (
                <span className="block text-xs text-gray-500">{option.description}</span>
              )}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
