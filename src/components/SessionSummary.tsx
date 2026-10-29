import React from 'react';
import { RotateCcw, Award } from 'lucide-react';
import type { Question, Feedback } from '@contracts';
import { getScoreBand } from './FeedbackPanel';
import { ScoreRing } from './ScoreRing';

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
      className="bento-card-dark overflow-hidden p-6 text-[#f5f5f7] sm:p-8"
    >
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <ScoreRing score={overallScore} size="lg" theme="dark" />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#30d158]/20 px-3 py-0.5 font-mono text-xs font-semibold text-[#30d158]">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All 6 Questions Completed · {band.label}</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Session Readiness: {overallScore}/100
            </h2>
            <p className="mt-1 text-xs text-[#a1a1a6] sm:text-sm">
              Click any question tile below to review its rubric or re-drill
              your weakest response.
            </p>
          </div>
        </div>

        {weakestQuestion && (
          <button
            type="button"
            onClick={() => scrollToQuestion(weakestQuestion.position)}
            className="btn-pill-primary min-h-[42px] shrink-0 self-start px-5 py-2 text-xs font-semibold sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Re-drill weakest: Q{weakestQuestion.position} (
              {answersByQuestionId[weakestQuestion.id]?.overall ?? 0}/100)
            </span>
          </button>
        )}
      </div>

      {/* 6-Question Score Tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {questions.map((q) => {
          const ans = answersByQuestionId[q.id];
          const qScore = ans?.overall ?? 0;
          const isWeakest = weakestQuestion?.id === q.id;
          const barColor =
            qScore >= 75
              ? 'bg-[#30d158]'
              : qScore >= 50
                ? 'bg-[#ff9f0a]'
                : 'bg-[#ff453a]';

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.position)}
              className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition hover:bg-white/10 ${
                isWeakest
                  ? 'border-[#ff9f0a]/50 bg-[#ff9f0a]/10'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div className="flex w-full items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">
                  Q{q.position}
                </span>
                <span className="truncate font-mono text-[10px] capitalize text-[#a1a1a6]">
                  {q.type.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold tabular-nums text-white">
                  {qScore}
                </span>
                <span className="font-mono text-[10px] text-[#a1a1a6]">
                  /100
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${barColor}`}
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
