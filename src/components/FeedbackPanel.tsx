import React, { useState } from 'react';
import {
  CheckCircle2,
  Wrench,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { Feedback } from '@contracts';

interface FeedbackPanelProps {
  feedback: Feedback;
  onTryAgain: () => void;
}

export function getScoreBand(score: number): {
  label: string;
  badgeClass: string;
  barClass: string;
  textSignalClass: string;
} {
  if (score >= 75) {
    return {
      label: 'Strong',
      badgeClass: 'border-[#b7e4c7] bg-[#dcfae5] text-[#04250e]',
      barClass: 'bg-[#1d5fbf]',
      textSignalClass: 'text-[#247b50]',
    };
  }
  if (score >= 50) {
    return {
      label: 'Solid start',
      badgeClass: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
      barClass: 'bg-[#141414]',
      textSignalClass: 'text-[#92400e]',
    };
  }
  return {
    label: 'Needs work',
    badgeClass: 'border-[#f5c2c0] bg-[#ffedea] text-[#831c1e]',
    barClass: 'bg-[#c4242a]',
    textSignalClass: 'text-[#c4242a]',
  };
}

const CRITERIA_LABELS: Array<{
  key: keyof Feedback['scores'];
  label: string;
  description: string;
}> = [
  {
    key: 'relevance',
    label: 'Relevance',
    description: 'Answers the question asked for this role',
  },
  {
    key: 'evidence',
    label: 'Evidence',
    description: 'Uses verified facts from your resume',
  },
  {
    key: 'structure',
    label: 'Structure',
    description: 'Clear STAR story (Situation, Task, Action, Result)',
  },
  {
    key: 'impact',
    label: 'Impact',
    description: 'Concrete outcome or metric',
  },
];

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  onTryAgain,
}) => {
  const [copied, setCopied] = useState(false);
  const band = getScoreBand(feedback.overall);

  const handleCopyStronger = async () => {
    try {
      await navigator.clipboard.writeText(feedback.stronger_answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="mt-5 space-y-4 rounded-[8px] border border-[#e2e5ea] bg-[#f8f9fb] p-4 sm:p-5">
      {/* Top row: overall score + Try again */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e5ea] pb-4">
        <div className="flex items-baseline gap-3">
          <div
            className="flex items-baseline gap-1"
            aria-label={`Overall score ${feedback.overall} out of 100 (${band.label})`}
          >
            <span className="num text-[30px] font-normal leading-none tracking-tight text-[#0a0a0a]">
              {feedback.overall}
            </span>
            <span className="num text-xs text-[#5a6069]">/100</span>
          </div>

          <span
            className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${band.badgeClass}`}
          >
            {band.label}
          </span>

          <span className="hidden sm:inline-block text-xs text-[#5a6069]">
            Checked against cited resume lines and JD requirements
          </span>
        </div>

        <button
          type="button"
          onClick={onTryAgain}
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-1 text-xs font-medium text-[#0a0a0a] transition hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#5a6069]" aria-hidden="true" />
          <span>Try again</span>
        </button>
      </div>

      {/* Four 1-5 criterion strip split by 1px hairlines (achromatic-ledger style) */}
      <div className="grid grid-cols-2 divide-y divide-[#e2e5ea] overflow-hidden rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {CRITERIA_LABELS.map(({ key, label, description }, idx) => {
          const val = feedback.scores[key];
          const pct = Math.max(0, Math.min(100, (val / 5) * 100));
          return (
            <div
              key={key}
              className={`p-3.5 ${idx % 2 === 1 ? 'border-l border-[#e2e5ea] sm:border-l-0' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-[#5a6069]">
                  {label}
                </span>
                <span className="num text-sm font-medium text-[#0a0a0a]">
                  {val}
                  <span className="text-xs font-normal text-[#5a6069]">/5</span>
                </span>
              </div>
              <div
                className="mt-2 flex h-1.5 w-full overflow-hidden rounded-[2px] bg-[#eaecef]"
                role="progressbar"
                aria-valuenow={val}
                aria-valuemin={1}
                aria-valuemax={5}
                aria-label={`${label}: ${val} out of 5`}
              >
                <div
                  className={`h-full ${
                    val >= 4
                      ? 'bg-[#1d5fbf]'
                      : val === 3
                        ? 'bg-[#141414]'
                        : 'bg-[#c4242a]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs leading-snug text-[#5a6069]">
                {description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Unsupported claims warning (only if any) */}
      {feedback.unsupported_claims && feedback.unsupported_claims.length > 0 && (
        <div
          role="region"
          aria-label="Unsupported claims warning"
          className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] p-3.5 text-[#92400e]"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-[#92400e]"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm">
              <div className="font-medium text-[#92400e]">
                Claims not backed by your resume
              </div>
              <p className="text-xs text-[#92400e]">
                Hiring managers probe metrics and team scope. Remove claims that do not appear in R1..Rn:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs font-medium text-[#92400e]">
                {feedback.unsupported_claims.map((claim, idx) => (
                  <li key={idx}>“{claim}”</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* What worked & One fix */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#247b50]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>What worked</span>
          </div>
          <p className="text-sm leading-relaxed text-[#0a0a0a]">
            {feedback.what_worked}
          </p>
        </div>

        <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#1d5fbf]">
            <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>One fix</span>
          </div>
          <p className="text-sm leading-relaxed text-[#0a0a0a]">
            {feedback.one_fix}
          </p>
        </div>
      </div>

      {/* Stronger answer with copy button */}
      <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-[#5a6069]">
            Stronger answer (built strictly from your resume facts)
          </div>
          <button
            type="button"
            onClick={handleCopyStronger}
            className="inline-flex min-h-[30px] items-center gap-1.5 rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-2.5 py-1 text-xs font-medium text-[#0a0a0a] transition hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#247b50]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#5a6069]" aria-hidden="true" />
                <span>Copy answer</span>
              </>
            )}
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#0a0a0a]">
          {feedback.stronger_answer}
        </p>
      </div>

      {/* Submitted answer */}
      <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-3.5">
        <div className="mb-1 text-xs font-medium text-[#5a6069]">
          Your submitted answer
        </div>
        <p className="whitespace-pre-line text-sm text-[#5a6069]">
          {feedback.answer_text}
        </p>
      </div>
    </div>
  );
};
