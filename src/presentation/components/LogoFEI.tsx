import React from 'react';

interface LogoFEIProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoFEI: React.FC<LogoFEIProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'w-24',
    md: 'w-32 sm:w-36 lg:w-40',
    lg: 'w-48',
  };

  return (
    <div className={`select-none flex flex-col items-end ${sizeStyles[size]} ${className}`}>
      <img
        src="/Logo_FEI.png"
        alt="Facultad de Estadística e Informática"
        className="w-full h-auto object-contain drop-shadow-xs"
        draggable={false}
      />
    </div>
  );
};
