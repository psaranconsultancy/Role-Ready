import React, { useState, useId } from 'react';
import { FileText, Target } from 'lucide-react';

interface ReferenceChipProps {
  id: string; // e.g. "R4" or "J2"
  text: string;
  kind: 'resume' | 'jd';
}

export const ReferenceChip: React.FC<ReferenceChipProps> = ({
  id,
  text,
  kind,
}) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  const isResume = kind === 'resume';
  const badgeClasses = isResume
    ? 'border-[#1d5fbf]/35 bg-[#1d5fbf]/10 text-[#1d5fbf] hover:bg-[#1d5fbf]/15'
    : 'border-[#cfd5de] bg-[#eaecef] text-[#383c42] hover:bg-[#dfe3e8]';

  const labelPrefix = isResume ? 'Resume line' : 'JD requirement';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-h-[26px] items-center gap-1 rounded-[4px] border px-2 py-0.5 font-mono text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] ${badgeClasses}`}
      >
        {isResume ? (
          <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
        ) : (
          <Target className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <span>{id}</span>
        <span className="sr-only">
          ({labelPrefix}: {text})
        </span>
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-2 w-64 sm:w-80 rounded-[8px] border border-[#2e2e2e] bg-[#141414] p-3 text-left text-xs leading-relaxed text-[#ffffff]"
        >
          <div className="mb-1 flex items-center gap-1.5 font-medium text-[#b4b4b4]">
            <span>{labelPrefix}</span>
            <span className="font-mono text-[#ffffff]">{id}</span>
          </div>
          <p className="text-[#f2f4f7]">{text}</p>
        </div>
      )}
    </div>
  );
};
