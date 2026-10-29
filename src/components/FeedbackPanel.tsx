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
import { ScoreRing } from './ScoreRing';

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
      badgeClass: 'border-[#30d158]/35 bg-[#30d158]/15 text-[#15803d]',
      barClass: 'bg-[#30d158]',
      textSignalClass: 'text-[#15803d]',
    };
  }
  if (score >= 50) {
    return {
      label: 'Solid start',
      badgeClass: 'border-[#ff9f0a]/35 bg-[#ff9f0a]/15 text-[#b45309]',
      barClass: 'bg-[#ff9f0a]',
      textSignalClass: 'text-[#b45309]',
    };
  }
  return {
    label: 'Needs work',
    badgeClass: 'border-[#ff453a]/35 bg-[#ff453a]/15 text-[#d70015]',
    barClass: 'bg-[#ff453a]',
    textSignalClass: 'text-[#d70015]',
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
    description: 'Answers the prompt for this role',
  },
  {
    key: 'evidence',
    label: 'Evidence',
    description: 'Uses verified facts from your resume',
  },
  {
    key: 'structure',
    label: 'Structure',
    description: 'Clear STAR flow (Situation, Task, Action, Result)',
  },
  {
    key: 'impact',
    label: 'Impact',
    description: 'Quantified outcome or business result',
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
    <div className="mt-6 space-y-5 rounded-[22px] border border-black/10 bg-[#f5f5f7] p-5 sm:p-6">
      {/* Top Row: ScoreRing + Verdict + Try Again Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <div className="flex items-center gap-4">
          <ScoreRing score={feedback.overall} size="md" theme="light" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${band.badgeClass}`}
              >
                {band.label}
              </span>
              <span className="font-mono text-xs text-[#6e6e73]">
                {feedback.overall} / 100
              </span>
            </div>
            <p className="mt-1 font-display text-base font-bold text-[#1d1d1f]">
              Hiring-Manager Scorecard
            </p>
            <p className="text-xs text-[#6e6e73]">
              Checked against your cited resume lines and role requirements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTryAgain}
          className="btn-pill-secondary-light min-h-[38px] px-4 py-1.5 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Try again</span>
        </button>
      </div>

      {/* 4 Criterion Bento Cells (1–5) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CRITERIA_LABELS.map(({ key, label, description }) => {
          const val = feedback.scores[key];
          const pct = Math.max(0, Math.min(100, (val / 5) * 100));
          return (
            <div
              key={key}
              className="rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1d1d1f]">
                  {label}
                </span>
                <span
                  className="font-mono text-xs font-bold text-[#0071e3]"
                  aria-label={`${label} score ${val} out of 5`}
                >
                  {val}/5
                </span>
              </div>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-[#6e6e73]">
                {description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Unsupported Claims Warning (Evidence Check) */}
      {feedback.unsupported_claims &&
        feedback.unsupported_claims.length > 0 && (
          <div
            role="note"
            aria-label="Unsupported claims warning"
            className="rounded-2xl border border-[#ff9f0a]/40 bg-[#fffbeb] p-4 text-[#92400e]"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]"
                aria-hidden="true"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#92400e]">
                    Evidence Check · Not in your resume
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#92400e]/90">
                  These statements in your answer could not be verified against
                  your uploaded resume lines:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-medium">
                  {feedback.unsupported_claims.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      {/* What Worked & What to Fix Next */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803d]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>What worked</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#1d1d1f]">
            {feedback.what_worked}
          </p>
        </div>

        <div className="rounded-2xl border border-[#0071e3]/25 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0071e3]">
            <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>What to fix next</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#1d1d1f]">
            {feedback.one_fix}
          </p>
        </div>
      </div>

      {/* Stronger Rewrite Quote Block */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
          <div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0071e3]">
              Stronger Rewrite
            </span>
            <h4 className="font-display text-sm font-bold text-[#1d1d1f]">
              Hiring-Manager Example Grounded in Your Resume
            </h4>
          </div>
          <button
            type="button"
            onClick={handleCopyStronger}
            className="btn-pill-secondary-light min-h-[32px] px-3 py-1 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check
                  className="h-3.5 w-3.5 text-[#15803d]"
                  aria-hidden="true"
                />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy rewrite</span>
              </>
            )}
          </button>
        </div>
        <blockquote className="mt-3.5 border-l-2 border-[#0071e3] pl-4 text-sm leading-relaxed text-[#1d1d1f]">
          {feedback.stronger_answer}
        </blockquote>
      </div>
    </div>
  );
};
