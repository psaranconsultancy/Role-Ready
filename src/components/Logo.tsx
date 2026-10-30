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
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
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
        className={`${iconDims} shrink-0 rounded-md bg-white object-contain`}
      />
      <span
        className={`font-display ${textSize} font-bold tracking-[-0.02em] ${
          theme === 'dark' ? 'text-[#f5f5f7]' : 'text-[#143566]'
        }`}
      >
        Role<span className="text-[#62a8da]">Ready</span>
      </span>
    </span>
  );
};
