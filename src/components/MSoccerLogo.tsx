import React from 'react';

interface MSoccerLogoProps {
  className?: string;
  size?: number;
}

export const MSoccerLogo: React.FC<MSoccerLogoProps> = ({ className = "w-9 h-9", size }) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shrink-0 shadow-md border border-zinc-800 bg-[#0A0B0E] flex items-center justify-center ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="mSoccer"
    >
      <svg 
        viewBox="0 0 120 120" 
        className="w-full h-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Black Squircle Background */}
        <rect width="120" height="120" rx="28" fill="#0A0B0E" />
        
        {/* White Center Dot */}
        <circle 
          cx="60" 
          cy="60" 
          r="18" 
          fill="#FFFFFF" 
        />
      </svg>
    </div>
  );
};

export default MSoccerLogo;
