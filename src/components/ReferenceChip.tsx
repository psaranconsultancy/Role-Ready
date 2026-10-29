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
    ? 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200';

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
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${badgeClasses}`}
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
          className="absolute bottom-full left-0 z-20 mb-2 w-64 sm:w-80 rounded-xl border border-slate-200 bg-slate-900 p-3 text-left text-xs leading-relaxed text-white shadow-xl"
        >
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-300">
            <span>
              {labelPrefix} {id}
            </span>
          </div>
          <p className="text-slate-100">{text}</p>
        </div>
      )}
    </div>
  );
};

