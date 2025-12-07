import React from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  disabled?: boolean;
  helperText?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
  disabled = false,
  helperText,
  min,
  max,
  step,
}: FormFieldProps) {
  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={error ? 'border-red-500' : ''}
        />
      );
    }

    if (type === 'select' && options) {
      const selectOptions = [
        { label: `Select ${label}`, value: '' },
        ...options.map(opt => ({ label: opt.label, value: String(opt.value) }))
      ];
      return (
        <Select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          options={selectOptions}
          className={error ? 'border-red-500' : ''}
        />
      );
    }

    return (
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
        min={min}
        max={max}
        step={step}
      />
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
