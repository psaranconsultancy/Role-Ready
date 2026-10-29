import React, { useState, useEffect } from 'react';
import { Send, Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';
import type {
  Question,
  Feedback,
  ResumeLine,
  JdRequirement,
  ApiError,
} from '@contracts';
import { scoreAnswer, toApiError } from '../lib/api';
import { ReferenceChip } from './ReferenceChip';
import { FeedbackPanel } from './FeedbackPanel';
import { ErrorBanner } from './ErrorBanner';

interface QuestionCardProps {
  question: Question;
  existingFeedback?: Feedback;
  resumeLines: ResumeLine[];
  jdRequirements: JdRequirement[];
  onScored: (
    feedback: Feedback,
    sessionCompleted: boolean,
    sessionOverall: number | null
  ) => void;
}

const QUESTION_TYPE_STYLES: Record<
  Question['type'],
  { label: string; className: string }
> = {
  behavioural: {
    label: 'Behavioural',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  technical: {
    label: 'Technical',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  role_fit: {
    label: 'Role fit',
    className: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  situational: {
    label: 'Situational',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  existingFeedback,
  resumeLines,
  jdRequirements,
  onScored,
}) => {
  const [answerText, setAnswerText] = useState(
    existingFeedback?.answer_text ?? ''
  );
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (existingFeedback) {
      setAnswerText(existingFeedback.answer_text);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [existingFeedback]);

  const charCount = answerText.trim().length;
  const wordCount = answerText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const isValidLength = charCount >= 20 && charCount <= 4000;
  const typeMeta = QUESTION_TYPE_STYLES[question.type] ?? {
    label: question.type,
    className: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const resolveResumeText = (refId: string): string => {
    const found = resumeLines.find((r) => r.id === refId);
    return found ? found.text : `Referenced resume item ${refId}`;
  };

  const resolveJdText = (refId: string): string => {
    const found = jdRequirements.find((j) => j.id === refId);
    return found ? found.text : `Referenced JD requirement ${refId}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidLength || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await scoreAnswer(question.id, answerText);
      const { session_completed, session_overall, ...feedback } = res;
      onScored(feedback, session_completed, session_overall);
      setIsEditing(false);
    } catch (err) {
      setError(
        toApiError(
          err,
          'llm_failed',
          'Could not score your answer right now. Please try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setIsEditing(true);
  };

  const textareaId = `answer-input-${question.id}`;

  return (
    <section
      id={`question-${question.position}`}
      aria-labelledby={`question-heading-${question.position}`}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition sm:p-6"
    >
      {/* Question Header: Position, Type Badge, Answered Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {question.position}
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${typeMeta.className}`}
          >
            {typeMeta.label}
          </span>
        </div>

        {existingFeedback && !isEditing && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Scored ({existingFeedback.overall}/100)</span>
          </span>
        )}
      </div>

      {/* Question Text */}
      <h2
        id={`question-heading-${question.position}`}
        className="mt-3.5 text-base font-semibold leading-snug text-slate-900 sm:text-lg"
      >
        {question.text}
      </h2>

      {/* Why we're asking + Grounding Chips */}
      <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
        <div className="flex items-start gap-2 text-xs text-slate-700">
          <HelpCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
            aria-hidden="true"
          />
          <div>
            <span className="font-semibold text-slate-900">
              Why we’re asking:{' '}
            </span>
            <span>{question.why_asking}</span>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-[11px] font-medium text-slate-500">
            Citations (hover or focus to inspect):
          </span>
          {question.resume_refs.map((rId) => (
            <ReferenceChip
              key={rId}
              id={rId}
              text={resolveResumeText(rId)}
              kind="resume"
            />
          ))}
          {question.jd_refs.map((jId) => (
            <ReferenceChip
              key={jId}
              id={jId}
              text={resolveJdText(jId)}
              kind="jd"
            />
          ))}
        </div>
      </div>

      {/* Answer form OR Feedback Panel */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <label
                htmlFor={textareaId}
                className="text-xs font-semibold text-slate-700"
              >
                Your Answer (STAR format · 60+ words & concrete metrics recommended)
              </label>
              <span
                className={`text-xs font-medium ${
                  charCount > 0 && (charCount < 20 || charCount > 4000)
                    ? 'text-amber-700'
                    : wordCount >= 60
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                }`}
              >
                {wordCount} words · {charCount} / 4,000 chars (min 20)
              </span>
            </div>

            <textarea
              id={textareaId}
              rows={5}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              disabled={submitting}
              placeholder="Describe the Situation, Task, Action, and quantified Result from your resume..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
            />
          </div>

          {error && (
            <ErrorBanner error={error} onRetry={() => handleSubmit()} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-slate-500">
              {charCount < 20
                ? `${20 - charCount} more character${20 - charCount === 1 ? '' : 's'} needed to submit`
                : charCount > 4000
                  ? `${charCount - 4000} characters over the 4,000 limit`
                  : wordCount < 60
                    ? `Tip: Aim for 60+ words (${60 - wordCount} more) for full STAR structure points`
                    : 'Strong length — ready to score against your resume evidence'}
            </p>

            <div className="flex items-center gap-2">
              {existingFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    setAnswerText(existingFeedback.answer_text);
                    setError(null);
                    setIsEditing(false);
                  }}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={!isValidLength || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Scoring answer…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Get feedback</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        existingFeedback && (
          <FeedbackPanel
            feedback={existingFeedback}
            onTryAgain={handleTryAgain}
          />
        )
      )}
    </section>
  );
};
