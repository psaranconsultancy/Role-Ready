import React from 'react';
import { QUESTION_COUNTS, type QuestionFocus } from '@contracts';

// Lets the candidate choose how many questions to practise and what kind.
// Every option still cites the resume line and job requirement it tests.

export const FOCUS_OPTIONS: { value: QuestionFocus; label: string; hint: string }[] = [
  { value: 'mixed', label: 'Mixed', hint: 'A blend of behavioural, technical, situational and role fit' },
  { value: 'behavioural', label: 'Behavioural', hint: '"Tell me about a time…" stories from your resume' },
  { value: 'technical', label: 'Technical', hint: 'The skills, tools and methods the job asks for' },
  { value: 'situational', label: 'Situational', hint: '"What would you do if…" scenarios from this role' },
];

const STORAGE_KEY = 'roleready.questionPlan';

export interface QuestionPlan {
  count: number;
  focus: QuestionFocus;
}

export function loadQuestionPlan(fallback: QuestionPlan): QuestionPlan {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const count = (QUESTION_COUNTS as readonly number[]).includes(saved?.count) ? saved.count : fallback.count;
    const focus = FOCUS_OPTIONS.some((o) => o.value === saved?.focus) ? saved.focus : fallback.focus;
    return { count, focus };
  } catch {
    return fallback;
  }
}

function saveQuestionPlan(plan: QuestionPlan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

/** Roughly two minutes per spoken answer. */
const minutesFor = (count: number) => `~${count * 2} min`;

const pill = (selected: boolean) =>
  `inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
    selected
      ? 'border-[#0ea5e9]/50 bg-[#0ea5e9]/15 text-[#0369a1]'
      : 'border-black/15 bg-white text-[#424245] hover:bg-black/[0.04]'
  }`;

export const QuestionPlanPicker: React.FC<{
  value: QuestionPlan;
  onChange: (plan: QuestionPlan) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const set = (next: QuestionPlan) => {
    onChange(next);
    saveQuestionPlan(next);
  };
  const focusHint = FOCUS_OPTIONS.find((o) => o.value === value.focus)?.hint;

  return (
    <section data-ui="question-plan" className="bento-card-light p-6 sm:p-8">
      <h3 className="font-display text-lg font-bold text-[#0f172a]">Your questions</h3>
      <p className="mt-1 text-xs text-[#6e6e73]">
        Choose how long to practise and what kind of questions to get. Each one still shows the
        resume line and job requirement it tests.
      </p>

      <div className="mt-4">
        <p id="question-count-label" className="text-xs font-semibold text-[#0f172a]">
          How many
        </p>
        <div role="radiogroup" aria-labelledby="question-count-label" className="mt-2 flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={value.count === count}
              disabled={disabled}
              onClick={() => set({ ...value, count })}
              className={pill(value.count === count)}
            >
              <span className="tabular-nums">{count}</span>
              <span className="ml-1.5 text-xs font-normal opacity-75">{minutesFor(count)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p id="question-focus-label" className="text-xs font-semibold text-[#0f172a]">
          What kind
        </p>
        <div role="radiogroup" aria-labelledby="question-focus-label" className="mt-2 flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={value.focus === o.value}
              disabled={disabled}
              onClick={() => set({ ...value, focus: o.value })}
              className={pill(value.focus === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {focusHint && <p className="mt-2 text-xs text-[#6e6e73]">{focusHint}</p>}
      </div>
    </section>
  );
};
