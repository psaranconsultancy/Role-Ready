import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showLabel?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 'md',
  theme = 'light',
  showLabel = false,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  const band =
    clamped >= 75
      ? {
          label: 'Strong',
          stroke: '#14b8a6',
          textLight: 'text-[#0f766e]',
          textDark: 'text-[#14b8a6]',
        }
      : clamped >= 50
        ? {
            label: 'Solid',
            stroke: '#ff9f0a',
            textLight: 'text-[#b45309]',
            textDark: 'text-[#ff9f0a]',
          }
        : {
            label: 'Focus area',
            stroke: '#ff453a',
            textLight: 'text-[#b91c1c]',
            textDark: 'text-[#ff453a]',
          };

  const dims =
    size === 'sm'
      ? { px: 48, strokeWidth: 4.5, fontSize: 'text-[14px]' }
      : size === 'lg'
        ? { px: 96, strokeWidth: 7, fontSize: 'text-[28px]' }
        : { px: 68, strokeWidth: 5.5, fontSize: 'text-[20px]' };

  const radius = (dims.px - dims.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const trackColor =
    theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const numberColor =
    theme === 'dark' ? 'text-[#f8fafc]' : 'text-[#0f172a]';

  return (
    <div
      className="inline-flex flex-col items-center gap-1"
      role="img"
      aria-label={`Score ${clamped} out of 100, ${band.label.toLowerCase()}`}
    >
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: dims.px, height: dims.px }}
      >
        <svg
          width={dims.px}
          height={dims.px}
          viewBox={`0 0 ${dims.px} ${dims.px}`}
          className="-rotate-90 transform"
          aria-hidden="true"
        >
          <circle
            cx={dims.px / 2}
            cy={dims.px / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={dims.strokeWidth}
          />
          <circle
            cx={dims.px / 2}
            cy={dims.px / 2}
            r={radius}
            fill="none"
            stroke={band.stroke}
            strokeWidth={dims.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <span
          className={`absolute font-display ${dims.fontSize} font-bold tracking-tight tabular-nums ${numberColor}`}
        >
          {clamped}
        </span>
      </div>
      {showLabel && (
        <span
          className={`text-xs font-semibold tracking-tight ${
            theme === 'dark' ? band.textDark : band.textLight
          }`}
        >
          {band.label}
        </span>
      )}
    </div>
  );
};
