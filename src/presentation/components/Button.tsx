import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'green' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] select-none';

  const shapeStyle = pill ? 'rounded-full' : 'rounded-xl';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-2.5 sm:py-3 text-sm sm:text-base gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#003882] hover:bg-[#002d6b] text-white focus:ring-[#003882]/50 shadow-sm hover:shadow-md',
    secondary:
      'bg-[#00873e] hover:bg-[#007033] text-white focus:ring-[#00873e]/50 shadow-sm hover:shadow-md',
    green:
      'bg-[#27a745] hover:bg-[#218838] text-white focus:ring-[#27a745]/50 shadow-sm hover:shadow-md',
    outline:
      'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 bg-white shadow-xs',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none focus:ring-slate-300',
  };

  return (
    <button
      className={`${baseStyles} ${shapeStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
