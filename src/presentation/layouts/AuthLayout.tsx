import React from 'react';
import { LogoUV } from '@/presentation/components/LogoUV';
import { LogoFEI } from '@/presentation/components/LogoFEI';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-white flex flex-col justify-between relative selection:bg-[#003882] selection:text-white">
      {/* Top Left: Official UV Logo */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-10 z-20">
        <LogoUV size="lg" />
      </div>

      {/* Center: Title and Form Content */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 z-10 pt-16 sm:pt-0 pb-12 sm:pb-8">
        {children}
      </main>

      {/* Bottom Right: Official FEI Logo */}
      <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-10 z-20 pointer-events-none">
        <LogoFEI size="md" />
      </div>

      {/* Bottom: Dual Institutional Stripes */}
      <div className="w-full relative select-none z-10 shrink-0">
        {/* Blue Stripe */}
        <div className="w-full h-5 sm:h-6 bg-[#0b4d9c]" />
        
        {/* White separator line */}
        <div className="w-full h-1.5 sm:h-2 bg-white" />
        
        {/* Green Stripe */}
        <div className="w-full h-12 sm:h-16 bg-[#22a353]" />
      </div>
    </div>
  );
};
