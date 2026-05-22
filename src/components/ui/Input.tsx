import React from 'react';

interface Option {
  label: string;
  value: string | number;
}

interface InputProps {
  label: string;
  name?: string;
  type?: string; // 'text', 'number', 'date', 'select', 'textarea', etc.
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  defaultValue, 
  onChange, 
  required, 
  options,
  placeholder
}) => {
  const baseClasses = "w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border transition-colors";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      
      {type === 'select' ? (
        <select 
          name={name} 
          value={value} 
          defaultValue={defaultValue} 
          onChange={onChange} 
          required={required} 
          className={baseClasses}
        >
          <option value="">Seleccionar...</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea 
          name={name} 
          value={value} 
          defaultValue={defaultValue} 
          onChange={onChange} 
          required={required}
          placeholder={placeholder}
          rows={3} 
          className={baseClasses} 
        />
      ) : (
        <input 
          name={name} 
          type={type} 
          value={value} 
          defaultValue={defaultValue} 
          onChange={onChange} 
          required={required}
          placeholder={placeholder}
          className={baseClasses} 
        />
      )}
    </div>
  );
};
