import React from 'react';

interface LogoUVProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LogoUV: React.FC<LogoUVProps> = ({
  className = '',
  size = 'lg',
}) => {
  const sizeStyles = {
    sm: 'w-20',
    md: 'w-28',
    lg: 'w-36 sm:w-40',
    xl: 'w-48',
  };

  return (
    <div className={`select-none flex flex-col items-center ${sizeStyles[size]} ${className}`}>
      <img
        src="/Logo_UV.png"
        alt="Universidad Veracruzana"
        className="w-full h-auto object-contain drop-shadow-xs"
        draggable={false}
      />
    </div>
  );
};
