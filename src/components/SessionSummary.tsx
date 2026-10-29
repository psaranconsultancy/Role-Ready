import React from 'react';
import { RotateCcw } from 'lucide-react';
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

  const weakestQuestion = [...questions].sort((a, b) => {
    const scoreA = answersByQuestionId[a.id]?.overall ?? 100;
    const scoreB = answersByQuestionId[b.id]?.overall ?? 100;
    return scoreA - scoreB;
  })[0];

  const scrollToQuestion = (position: number) => {
    const el = document.getElementById(`question-${position}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      aria-label="Session complete summary"
      className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-5"
    >
      <div className="flex flex-col gap-4 border-b border-[#e2e5ea] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-4">
          <div className="flex items-baseline gap-1">
            <span className="num text-[32px] font-normal leading-none tracking-tight text-[#0a0a0a]">
              {overallScore}
            </span>
            <span className="num text-xs text-[#5a6069]">/100 overall</span>
          </div>

          <span
            className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${band.badgeClass}`}
          >
            {band.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {weakestQuestion && (
            <button
              type="button"
              onClick={() => scrollToQuestion(weakestQuestion.position)}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-1 text-xs font-medium text-[#0a0a0a] transition hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#5a6069]" aria-hidden="true" />
              <span className="num">
                Re-drill Q{weakestQuestion.position} (
                {answersByQuestionId[weakestQuestion.id]?.overall ?? 0}/100)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Divided 6-cell KPI strip for Q1..Q6 with #1d5fbf data bars */}
      <div className="mt-4 grid grid-cols-2 divide-y divide-[#e2e5ea] overflow-hidden rounded-[6px] border border-[#e2e5ea] bg-[#f8f9fb] sm:grid-cols-6 sm:divide-x sm:divide-y-0">
        {questions.map((q, idx) => {
          const ans = answersByQuestionId[q.id];
          const qScore = ans?.overall ?? 0;
          const qBand = getScoreBand(qScore);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.position)}
              className={`flex flex-col justify-between p-3 text-left transition hover:bg-[#eef0f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a0a0a] ${
                idx % 2 === 1 ? 'border-l border-[#e2e5ea] sm:border-l-0' : ''
              }`}
            >
              <div className="flex w-full items-center justify-between text-xs text-[#5a6069]">
                <span className="font-mono font-medium text-[#0a0a0a]">
                  Q{q.position}
                </span>
                <span className="capitalize">
                  {q.type.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-2 flex w-full items-baseline justify-between">
                <span className="num text-xl font-normal text-[#0a0a0a]">
                  {qScore}
                </span>
                <span className={`text-xs font-medium ${qBand.textSignalClass}`}>
                  {qBand.label}
                </span>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-[2px] bg-[#dfe3e8]">
                <div
                  className="h-full bg-[#1d5fbf]"
                  style={{ width: `${Math.max(0, Math.min(100, qScore))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
