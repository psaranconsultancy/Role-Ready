import React, { useState } from 'react';
import {
  CheckCircle2,
  Wrench,
  Sparkles,
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
} {
  if (score >= 75) {
    return {
      label: 'Strong',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      barClass: 'bg-emerald-600',
    };
  }
  if (score >= 50) {
    return {
      label: 'Solid start',
      badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
      barClass: 'bg-amber-500',
    };
  }
  return {
    label: 'Needs work',
    badgeClass: 'border-red-300 bg-red-50 text-red-900',
    barClass: 'bg-red-600',
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
    description: 'Uses real facts from your resume',
  },
  {
    key: 'structure',
    label: 'Structure',
    description: 'Clear STAR-style story',
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
    <div className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      {/* Top row: overall score badge + Try again button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 font-bold shadow-sm ${band.badgeClass}`}
            aria-label={`Overall score ${feedback.overall} out of 100 (${band.label})`}
          >
            <span className="text-2xl leading-none">{feedback.overall}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
              / 100
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                Overall Feedback Score
              </span>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${band.badgeClass}`}
              >
                {band.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Grounded against your cited resume lines and JD requirements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTryAgain}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Try again</span>
        </button>
      </div>

      {/* Submitted answer preview */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Your Answer
        </div>
        <p className="whitespace-pre-line text-sm text-slate-800">
          {feedback.answer_text}
        </p>
      </div>

      {/* Four 1-5 bars */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CRITERIA_LABELS.map(({ key, label, description }) => {
          const val = feedback.scores[key];
          const pct = Math.max(0, Math.min(100, (val / 5) * 100));
          return (
            <div
              key={key}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span>{label}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                  {val} / 5
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
              <div
                className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={val}
                aria-valuemin={1}
                aria-valuemax={5}
                aria-label={`${label}: ${val} out of 5`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    val >= 4
                      ? 'bg-emerald-600'
                      : val === 3
                        ? 'bg-amber-500'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Unsupported claims warning (only if any) */}
      {feedback.unsupported_claims && feedback.unsupported_claims.length > 0 && (
        <div
          role="region"
          aria-label="Unsupported claims warning"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold text-amber-900">
                Unsupported claims detected (not backed by your resume)
              </div>
              <p className="text-xs text-amber-800">
                Interviewers probe specifics—avoid stating metrics or scope that aren’t on your resume:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs font-medium text-amber-950">
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
        <div className="rounded-xl border border-emerald-200 bg-white p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>What worked</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            {feedback.what_worked}
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-white p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-800">
            <Wrench className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span>One fix</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            {feedback.one_fix}
          </p>
        </div>
      </div>

      {/* Stronger answer with copy button */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-900">
            <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span>Stronger answer (built from your resume facts)</span>
          </div>
          <button
            type="button"
            onClick={handleCopyStronger}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy answer</span>
              </>
            )}
          </button>
        </div>
        <p className="text-sm leading-relaxed text-slate-800">
          {feedback.stronger_answer}
        </p>
      </div>
    </div>
  );
};

