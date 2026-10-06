import React from 'react';
import { SeatStatus } from '../types';
import { toPersianDigits } from '../utils/formatters';

interface ChairIconProps {
  status: SeatStatus;
  seatNumber: number;
  isDark?: boolean;
  className?: string;
}

export const ChairIcon: React.FC<ChairIconProps> = ({
  status,
  seatNumber,
  isDark = true,
  className = 'w-7 h-7 sm:w-8 sm:h-8',
}) => {
  // Determine color scheme based on status and theme
  let backColor = '';
  let seatColor = '';
  let armColor = '';
  let textColor = '';
  let ringClass = '';

  if (status === 'selected') {
    // Vibrant Golden Amber
    backColor = '#f59e0b';
    seatColor = '#d97706';
    armColor = '#b45309';
    textColor = '#ffffff';
    ringClass = 'drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] scale-105';
  } else if (status === 'sold') {
    // Dark/Muted Disabled
    backColor = isDark ? '#1e293b' : '#cbd5e1';
    seatColor = isDark ? '#0f172a' : '#94a3b8';
    armColor = isDark ? '#334155' : '#cbd5e1';
    textColor = isDark ? '#475569' : '#64748b';
    ringClass = 'opacity-40 cursor-not-allowed';
  } else if (status === 'reserved') {
    // Locked / Pending
    backColor = isDark ? '#334155' : '#e2e8f0';
    seatColor = isDark ? '#1e293b' : '#cbd5e1';
    armColor = isDark ? '#475569' : '#94a3b8';
    textColor = isDark ? '#64748b' : '#94a3b8';
    ringClass = 'opacity-50 cursor-not-allowed';
  } else {
    // Available
    if (isDark) {
      backColor = '#10b981';
      seatColor = '#059669';
      armColor = '#047857';
      textColor = '#ffffff';
    } else {
      backColor = '#10b981';
      seatColor = '#059669';
      armColor = '#047857';
      textColor = '#ffffff';
    }
    ringClass = 'hover:scale-110 hover:drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)] cursor-pointer transition-transform';
  }

  return (
    <div className={`relative inline-flex items-center justify-center transition-all duration-150 ${className} ${ringClass}`}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Armrest Left */}
        <rect
          x="2"
          y="10"
          width="4"
          height="18"
          rx="2"
          fill={armColor}
        />

        {/* Armrest Right */}
        <rect
          x="30"
          y="10"
          width="4"
          height="18"
          rx="2"
          fill={armColor}
        />

        {/* Chair Backrest (Top curved pillow) */}
        <path
          d="M7 6C7 3.79086 8.79086 2 11 2H25C27.2091 2 29 3.79086 29 6V18C29 19.1046 28.1046 20 27 20H9C7.89543 20 7 19.1046 7 18V6Z"
          fill={backColor}
        />

        {/* Subtle cushion contour line */}
        <path
          d="M10 5C10 4.44772 10.4477 4 11 4H25C25.5523 4 26 4.44772 26 5V14H10V5Z"
          fill="rgba(255,255,255,0.18)"
        />

        {/* Chair Bottom Cushion */}
        <path
          d="M6 18C6 16.8954 6.89543 16 8 16H28C29.1046 16 30 16.8954 30 18V28C30 31.3137 27.3137 34 24 34H12C8.68629 34 6 31.3137 6 28V18Z"
          fill={seatColor}
        />

        {/* Cushion highlight */}
        <ellipse
          cx="18"
          cy="26"
          rx="8"
          ry="4"
          fill="rgba(255,255,255,0.12)"
        />
      </svg>

      {/* Seat Number in center */}
      <span
        style={{ color: textColor }}
        className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-[11px] font-bold select-none pointer-events-none tracking-tight pt-0.5"
      >
        {status === 'selected' ? '✓' : toPersianDigits(seatNumber)}
      </span>
    </div>
  );
};
