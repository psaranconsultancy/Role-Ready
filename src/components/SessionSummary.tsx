import React from 'react';
import { Award } from 'lucide-react';
import type { Question, Feedback } from '@contracts';
import { getScoreBand } from './FeedbackPanel';

interface SessionSummaryProps {
  overallScore: number;
  questions: Question[];
  answersByQuestionId: Record<string, Feedback>;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  overallScore,
  questions,
  answersByQuestionId,
}) => {
  const band = getScoreBand(overallScore);

  const scrollToQuestion = (position: number) => {
    const el = document.getElementById(`question-${position}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      aria-label="Session complete summary"
      className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-bold shadow-sm ${band.badgeClass}`}
          >
            <span className="text-3xl leading-none">{overallScore}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
              Overall
            </span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interview Complete · {band.label}</span>
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-slate-900">
              All 6 questions answered and scored
            </h2>
            <p className="text-xs text-slate-600">
              Click any question score below to jump to its detailed feedback or try again.
            </p>
          </div>
        </div>
      </div>

      {/* Per-question score row */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-6">
        {questions.map((q) => {
          const ans = answersByQuestionId[q.id];
          const qScore = ans?.overall ?? 0;
          const qBand = getScoreBand(qScore);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.position)}
              className="flex flex-col items-start justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="flex w-full items-center justify-between text-xs font-semibold text-slate-600">
                <span>Q{q.position}</span>
                <span className="capitalize text-[10px] text-slate-400">
                  {q.type.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2 flex w-full items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">
                  {qScore}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${qBand.badgeClass}`}
                >
                  {qBand.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

