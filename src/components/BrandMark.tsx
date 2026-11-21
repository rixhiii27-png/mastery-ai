import React from 'react';

export const BrandLogo: React.FC<{ lightText?: boolean; compact?: boolean }> = ({
  lightText = true,
  compact = false,
}) => (
  <div className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
    <svg
      width="32"
      height="32"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="36" height="36" rx="10" fill="url(#mastery_olive_grad)" />
      <path
        d="M9.5 25V12.5L18 19.5L26.5 12.5V25"
        stroke="#FEFAE0"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="11" r="2.3" fill="#DDA15E" />
      <defs>
        <linearGradient id="mastery_olive_grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#606C38" />
          <stop offset="1" stopColor="#283618" />
        </linearGradient>
      </defs>
    </svg>
    {!compact && (
      <span
        className={`font-bold text-lg tracking-tight ${
          lightText ? 'text-[#FEFAE0]' : 'text-[#283618] dark:text-[#FEFAE0]'
        }`}
      >
        MASTERY <span className={lightText ? 'text-[#DDA15E]' : 'text-[#BC6C25] dark:text-[#DDA15E]'}>AI</span>
      </span>
    )}
  </div>
);

/**
 * Circular mastery ring rendered in MASTERY AI's Olive, Warm Ivory, Golden Sand & Burnt Orange system.
 */
export const CircularMasteryRing: React.FC<{
  percent: number;
  label: string;
  sublabel?: string;
  size?: number;
  onClick?: () => void;
}> = ({ percent, label, sublabel, size = 76, onClick }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const strokeWidth = 6.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 80 ? '#606C38' : clamped >= 55 ? '#DDA15E' : '#BC6C25';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group flex flex-col items-center text-center p-2.5 rounded-2xl transition-colors ${
        onClick
          ? 'hover:bg-[#FEFAE0] dark:hover:bg-[#283618]/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E]'
          : ''
      }`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#E5E0C5] dark:text-[#283618]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums text-[#283618] dark:text-[#FEFAE0]">
            {clamped}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] line-clamp-2 leading-snug max-w-[110px]">
        {label}
      </p>
      {sublabel && (
        <span className="mt-0.5 text-[11px] text-[#606C38] dark:text-[#FEFAE0]/75 truncate max-w-[110px]">
          {sublabel}
        </span>
      )}
    </Wrapper>
  );
};

/**
 * Academic study illustration for the Dashboard Welcome Hero Banner in Olive, Ivory & Golden Sand.
 */
export const StudyHeroIllustration: React.FC = () => (
  <svg
    viewBox="0 0 220 140"
    fill="none"
    aria-hidden="true"
    className="w-44 md:w-52 h-auto shrink-0 select-none"
  >
    <ellipse cx="115" cy="122" rx="82" ry="10" fill="#283618" fillOpacity="0.45" />
    <rect x="22" y="18" width="54" height="36" rx="10" fill="#283618" fillOpacity="0.65" stroke="#DDA15E" strokeOpacity="0.5" />
    <path d="M32 32H62M32 41H52" stroke="#FEFAE0" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="176" cy="30" r="18" fill="#DDA15E" fillOpacity="0.28" stroke="#FEFAE0" strokeOpacity="0.6" strokeWidth="2" />
    <path d="M170 30L174 34L183 25" stroke="#FEFAE0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="38" y="96" width="144" height="10" rx="5" fill="#283618" />
    <rect x="74" y="48" width="76" height="48" rx="9" fill="#283618" stroke="#DDA15E" strokeWidth="2" />
    <rect x="82" y="57" width="34" height="6" rx="3" fill="#DDA15E" />
    <rect x="82" y="68" width="56" height="4" rx="2" fill="#FEFAE0" fillOpacity="0.9" />
    <rect x="82" y="76" width="44" height="4" rx="2" fill="#BC6C25" fillOpacity="0.9" />
    <rect x="44" y="82" width="24" height="14" rx="3" fill="#FEFAE0" />
    <rect x="46" y="71" width="20" height="11" rx="3" fill="#DDA15E" />
    <rect x="158" y="74" width="7" height="22" rx="3.5" fill="#FEFAE0" fillOpacity="0.8" />
    <rect x="169" y="64" width="7" height="32" rx="3.5" fill="#DDA15E" />
    <rect x="180" y="54" width="7" height="42" rx="3.5" fill="#FEFAE0" />
  </svg>
);
