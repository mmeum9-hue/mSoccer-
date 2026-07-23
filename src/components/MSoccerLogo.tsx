import React from 'react';

interface MSoccerLogoProps {
  className?: string;
  size?: number;
}

export const MSoccerLogo: React.FC<MSoccerLogoProps> = ({ className = "w-9 h-9", size }) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div 
      className={`relative overflow-hidden rounded-xl shrink-0 shadow-md border border-zinc-800 bg-[#0A0B0E] flex items-center justify-center ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="mSoccer"
    >
      {!imgError ? (
        <img 
          src="/logo.png" 
          alt="mSoccer" 
          className="w-full h-full object-cover rounded-xl"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg 
          viewBox="0 0 120 120" 
          className="w-full h-full p-0.5" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dark Squircle Background */}
          <rect width="120" height="120" rx="26" fill="#0D0E11" />
          
          {/* Main Emblem */}
          <path 
            d="
              M 26 86 
              V 42 
              C 26 26, 42 20, 53 31 
              C 64 20, 80 26, 80 42 
              V 45 
              C 86 45, 87 50, 80 52 
              V 58 
              C 86 58, 87 63, 80 65 
              V 71 
              C 86 71, 87 76, 80 78 
              V 86 
              C 80 91, 66 91, 66 86 
              V 52 
              C 66 42, 58 40, 53 45 
              C 48 40, 40 42, 40 52 
              V 86 
              C 40 91, 26 91, 26 86 
              Z
            "
            fill="#9DA2AB" 
            stroke="#FFFFFF" 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Center Circular Dot */}
          <circle 
            cx="53" 
            cy="75" 
            r="9.5" 
            fill="#9DA2AB" 
            stroke="#FFFFFF" 
            strokeWidth="5.5" 
          />
        </svg>
      )}
    </div>
  );
};

export default MSoccerLogo;
