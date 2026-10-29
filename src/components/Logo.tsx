import React from 'react';

interface LogoProps {
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  theme = 'dark',
  size = 'md',
  showBadge = false,
}) => {
  const iconDims =
    size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const textSize =
    size === 'sm'
      ? 'text-[14px]'
      : size === 'lg'
        ? 'text-[20px]'
        : 'text-[15px]';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 32 32"
        className={`${iconDims} shrink-0`}
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={theme === 'dark' ? '#1c1c1e' : '#1d1d1f'}
          stroke={
            theme === 'dark'
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(0,0,0,0.12)'
          }
          strokeWidth="1.5"
        />
        <path
          d="M9.5 16.5L14 21L22.5 11.5"
          stroke="#0071e3"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="22.5" cy="11.5" r="2" fill="#30d158" />
      </svg>
      <span
        className={`font-display ${textSize} font-bold tracking-[-0.02em] ${
          theme === 'dark' ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'
        }`}
      >
        Role<span className="text-[#0071e3]">Ready</span>
      </span>
      {showBadge && (
        <span
          className={`hidden rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider sm:inline-block ${
            theme === 'dark'
              ? 'bg-white/10 text-[#a1a1a6] border border-white/10'
              : 'bg-black/5 text-[#6e6e73] border border-black/10'
          }`}
        >
          Studio
        </span>
      )}
    </span>
  );
};
