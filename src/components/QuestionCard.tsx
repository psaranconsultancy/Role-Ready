import React, { useState, useEffect } from 'react';
import { Loader2, Send, CheckCircle2, Sparkles } from 'lucide-react';
import type {
  Question,
  Feedback,
  ResumeLine,
  JdRequirement,
  ApiError,
} from '@contracts';
import { scoreAnswer, toApiError } from '../lib/api';
import { ReferenceChip } from './ReferenceChip';
import { FeedbackPanel, getScoreBand } from './FeedbackPanel';
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

const QUESTION_TYPE_LABELS: Record<Question['type'], string> = {
  behavioural: 'Behavioral',
  technical: 'Technical',
  role_fit: 'Role fit',
  situational: 'Situational',
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
  const typeLabel = QUESTION_TYPE_LABELS[question.type] ?? question.type;

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
  const scoreBand = existingFeedback
    ? getScoreBand(existingFeedback.overall)
    : null;

  return (
    <section
      id={`question-${question.position}`}
      aria-labelledby={`question-heading-${question.position}`}
      className="bento-card-light scroll-mt-28 p-6 sm:p-8"
    >
      {/* Question Header: Position Badge, Type Pill, Score Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1d1d1f] font-mono text-xs font-bold text-white">
            Q{question.position}
          </span>
          <span className="rounded-full bg-[#0071e3]/10 px-3 py-0.5 font-mono text-xs font-semibold text-[#0071e3]">
            {typeLabel}
          </span>
        </div>

        {existingFeedback && scoreBand ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-xs font-semibold ${scoreBand.badgeClass}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Scored {existingFeedback.overall}/100 · {scoreBand.label}
            </span>
          </span>
        ) : (
          <span className="rounded-full bg-black/[0.05] px-3 py-0.5 font-mono text-xs font-medium text-[#6e6e73]">
            Unanswered
          </span>
        )}
      </div>

      {/* Question Prompt */}
      <h2
        id={`question-heading-${question.position}`}
        className="mt-4 font-display text-lg font-bold leading-snug text-[#1d1d1f] sm:text-xl"
      >
        {question.text}
      </h2>

      {/* Citation Chips Bar (R1..Rn & J1..Jn) */}
      {(question.resume_refs.length > 0 || question.jd_refs.length > 0) && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-3.5 py-2.5"
          aria-label="Question evidence citations"
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73]">
            Grounded in:
          </span>
          {question.resume_refs.map((refId) => (
            <ReferenceChip
              key={`r-${refId}`}
              id={refId}
              kind="resume"
              text={resolveResumeText(refId)}
            />
          ))}
          {question.jd_refs.map((refId) => (
            <ReferenceChip
              key={`j-${refId}`}
              id={refId}
              kind="jd"
              text={resolveJdText(refId)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-5">
          <ErrorBanner error={error} onRetry={() => handleSubmit()} />
        </div>
      )}

      {/* Answer Editor or Read-Only Submitted Answer */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-5" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={textareaId}
              className="text-xs font-semibold text-[#1d1d1f]"
            >
              Your answer (aim forSituation, Task, Action, Result + metric)
            </label>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span
                className={
                  wordCount >= 60
                    ? 'font-semibold text-[#15803d]'
                    : 'text-[#6e6e73]'
                }
              >
                {wordCount} words {wordCount >= 60 ? '· STAR pace ✓' : '(aim 60+)'}
              </span>
              <span className="text-black/20">·</span>
              <span
                className={
                  charCount > 4000
                    ? 'font-semibold text-[#d70015]'
                    : charCount >= 20
                      ? 'text-[#1d1d1f]'
                      : 'text-[#86868b]'
                }
              >
                {charCount}/4,000 chars
              </span>
            </div>
          </div>

          <textarea
            id={textareaId}
            rows={5}
            disabled={submitting}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Describe the Situation and Task, the specific Actions you took (referencing your resume metrics), and the measurable Result…"
            className="mt-2 block w-full rounded-[18px] border border-black/15 bg-[#f5f5f7]/60 p-4 text-base leading-relaxed text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none disabled:opacity-60"
          />

          {/* Submitting Skeleton Preview */}
          {submitting && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-2xl border border-[#0071e3]/20 bg-[#0071e3]/[0.05] p-4"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0071e3]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>
                  Scoring your answer against cited resume lines and role
                  requirements…
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="h-10 animate-pulse rounded-xl bg-[#0071e3]/10" />
                <div className="h-10 animate-pulse rounded-xl bg-[#0071e3]/10" />
                <div className="h-10 animate-pulse rounded-xl bg-[#0071e3]/10" />
                <div className="h-10 animate-pulse rounded-xl bg-[#0071e3]/10" />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#6e6e73]">
              {charCount < 20
                ? `Write at least ${20 - charCount} more character${
                    20 - charCount === 1 ? '' : 's'
                  } to submit.`
                : 'Ready for hiring-manager rubric evaluation.'}
            </span>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              {existingFeedback && !submitting && (
                <button
                  type="button"
                  onClick={() => {
                    setAnswerText(existingFeedback.answer_text);
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="btn-pill-secondary-light min-h-[42px] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={!isValidLength || submitting}
                className="btn-pill-primary min-h-[42px] w-full px-6 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Scoring your answer…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Submit answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-black/[0.07] bg-[#f5f5f7]/70 p-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#6e6e73]">
            <span className="font-semibold text-[#1d1d1f]">
              Your submitted answer
            </span>
            <span className="font-mono">{wordCount} words</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1d1d1f]">
            {answerText}
          </p>
        </div>
      )}

      {/* Scored Feedback Panel */}
      {existingFeedback && !isEditing && (
        <FeedbackPanel
          feedback={existingFeedback}
          onTryAgain={handleTryAgain}
        />
      )}

      {/* Subtle hint when re-editing */}
      {existingFeedback && isEditing && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#0071e3]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            Tip: Incorporate the “What to fix next” suggestion above and
            resubmit to update your session score.
          </span>
        </p>
      )}
    </section>
  );
};
