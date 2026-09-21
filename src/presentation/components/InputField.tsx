import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  variant?: 'filled' | 'outline';
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      id,
      error,
      helperText,
      leftIcon,
      rightElement,
      variant = 'filled',
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    const variantStyles = {
      filled:
        'bg-[#cfd2d8] border border-transparent text-slate-900 placeholder:text-slate-500 focus:bg-[#d9dce2] focus:border-[#003882]/40 focus:ring-2 focus:ring-[#003882]/20',
      outline:
        'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/15',
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="block text-sm sm:text-base font-medium text-slate-900 tracking-tight"
        >
          {label}
        </label>
        <div className="relative rounded-lg sm:rounded-xl">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base transition-all duration-150 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-4'
            } ${rightElement ? 'pr-11' : 'pr-4'} ${variantStyles[variant]} ${
              error
                ? '!border-red-400 !bg-red-50/70 text-red-900 focus:!ring-red-500/20'
                : ''
            } ${className}`}
            aria-invalid={!!error}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
            <span>•</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
