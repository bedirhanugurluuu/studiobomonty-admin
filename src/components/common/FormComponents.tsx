import React, { useState, useEffect, useRef } from 'react';

// Form Input Component
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'url';
  className?: string;
  helperText?: string;
  min?: number;
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  className = '',
  helperText,
  min
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        required={required}
        min={min}
      />
      {helperText && (
        <p className="text-sm text-gray-500 mt-2">{helperText}</p>
      )}
    </div>
  );
}

// Form File Input Component
interface FormFileInputProps {
  label: string;
  onChange: (file: File | null) => void;
  accept?: string;
  required?: boolean;
  className?: string;
  helperText?: string;
}

export function FormFileInput({
  label,
  onChange,
  accept = 'image/*',
  required = false,
  className = '',
  helperText
}: FormFileInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        accept={accept}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
        required={required}
      />
      {helperText && (
        <p className="text-sm text-gray-500 mt-2">{helperText}</p>
      )}
    </div>
  );
}

// Form Textarea Component
interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  className = ''
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

// Form Select Component
interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  required?: boolean;
  className?: string;
  helperText?: string;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  className = '',
  helperText
}: FormSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required={required}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-sm text-gray-500 mt-2">{helperText}</p>
      )}
    </div>
  );
}

// Form Button Component
interface FormButtonProps {
  type?: 'submit' | 'button';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

export function FormButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  children,
  variant = 'primary',
  className = ''
}: FormButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Form Actions Component
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`flex space-x-4 pt-6 ${className}`}>
      {children}
    </div>
  );
}

// Form Checkbox Component
interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  helperText?: string;
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  className = '',
  helperText
}: FormCheckboxProps) {
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      </div>
      {helperText && (
        <p className="text-sm text-gray-500 mt-1 ml-6">{helperText}</p>
      )}
    </div>
  );
}

// Form Multi-Select Component (Dropdown with Checkboxes)
interface FormMultiSelectOption {
  value: string | number;
  label: string;
}

interface FormMultiSelectProps {
  label: string;
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  options: FormMultiSelectOption[];
  required?: boolean;
  className?: string;
  helperText?: string;
}

export function FormMultiSelect({
  label,
  values,
  onChange,
  options,
  required = false,
  className = '',
  helperText
}: FormMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (optionValue: string | number) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  // Seçili kategorilerin isimlerini al
  const selectedLabels = options
    .filter(opt => values.includes(opt.value))
    .map(opt => opt.label);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={className} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white flex items-center justify-between"
        >
          <span className="text-sm text-gray-700 truncate">
            {selectedLabels.length > 0 
              ? `${selectedLabels.length} kategori seçildi: ${selectedLabels.join(', ')}`
              : 'Kategori seçiniz...'
            }
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Kategori bulunamadı</div>
            ) : (
              <div className="p-2">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleToggle(option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={values.includes(option.value)}
                      onChange={() => handleToggle(option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="ml-2 block text-sm text-gray-700 cursor-pointer flex-1">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-sm text-gray-500 mt-2">{helperText}</p>
      )}
    </div>
  );
}

