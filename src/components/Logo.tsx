import React from 'react';

interface LogoProps {
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  theme = 'dark',
  size = 'md',
}) => {
  const iconDims =
    size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8';
  const textSize =
    size === 'sm'
      ? 'text-[14px]'
      : size === 'lg'
        ? 'text-[20px]'
        : 'text-[15px]';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <img
        src="/assets/img/roleready-mark.png"
        alt=""
        aria-hidden="true"
        width={198}
        height={160}
        className={`${iconDims} w-auto shrink-0 rounded-md`}
      />
      <span
        className={`font-display ${textSize} font-bold tracking-[-0.02em] ${
          theme === 'dark' ? 'text-[#e2e8f0]' : 'text-[#0f172a]'
        }`}
      >
        Role
        <span
          className={`font-semibold ${
            theme === 'dark' ? 'text-[#38bdf8]' : 'text-[#0f766e]'
          }`}
        >
          Ready
        </span>
      </span>
    </span>
  );
};
