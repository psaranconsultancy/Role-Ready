import React, { useState, useId } from 'react';
import { FileText, Briefcase } from 'lucide-react';

interface ReferenceChipProps {
  id: string;
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

  return (
    <span className="relative inline-block" data-ui="reference-chip">
      <button
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums transition-colors ${
          isResume
            ? 'border-[#0071e3]/25 bg-[#0071e3]/10 text-[#0071e3] hover:border-[#0071e3]/50 hover:bg-[#0071e3]/15'
            : 'border-black/15 bg-black/[0.04] text-[#1d1d1f] hover:border-black/30 hover:bg-black/[0.08]'
        }`}
      >
        {isResume ? (
          <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
        ) : (
          <Briefcase className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <code>{id}</code>
        <span className="sr-only">
          ({isResume ? 'Resume line' : 'Job requirement'}: {text})
        </span>
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="frosted-globalnav-dark pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 max-w-[85vw] rounded-[16px] border border-white/15 bg-[#161617]/95 p-3.5 text-left text-xs leading-relaxed text-[#f5f5f7] sm:w-80"
        >
          <span className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[#86868b]">
            <span className={isResume ? 'text-[#2997ff]' : 'text-[#30d158]'}>
              {isResume ? `Resume line ${id}` : `Job requirement ${id}`}
            </span>
          </span>
          <span className="block font-sans text-[13px] font-normal leading-snug text-[#f5f5f7]">
            “{text}”
          </span>
        </span>
      )}
    </span>
  );
};
