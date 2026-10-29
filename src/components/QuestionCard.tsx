import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
  behavioural: 'Behavioural',
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
      className="scroll-mt-20 rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-5"
    >
      {/* Question Header: Position, Type tag, Scored status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="num inline-flex h-6 items-center rounded-[4px] bg-[#141414] px-2 font-mono text-xs font-medium text-[#ffffff]">
            Q{question.position}
          </span>
          <span className="inline-flex items-center rounded-[4px] bg-[#eaecef] px-2 py-0.5 text-xs font-medium text-[#383c42]">
            {typeLabel}
          </span>
        </div>

        {existingFeedback && !isEditing && scoreBand && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${scoreBand.badgeClass}`}
            >
              {scoreBand.label}
            </span>
            <span className="num text-sm font-medium text-[#0a0a0a]">
              {existingFeedback.overall}
              <span className="text-xs font-normal text-[#5a6069]">/100</span>
            </span>
          </div>
        )}
      </div>

      {/* Question Text */}
      <h2
        id={`question-heading-${question.position}`}
        className="mt-3 text-base font-medium leading-snug text-[#0a0a0a]"
      >
        {question.text}
      </h2>

      {/* Why we're asking + Grounding Chips */}
      <div className="mt-3 rounded-[6px] border border-[#e2e5ea] bg-[#f8f9fb] p-3">
        <p className="text-xs leading-relaxed text-[#5a6069]">
          <span className="font-medium text-[#0a0a0a]">Why we’re asking: </span>
          {question.why_asking}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-[#5a6069]">Evidence cited:</span>
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
                className="text-xs font-medium text-[#0a0a0a]"
              >
                Your answer (STAR structure · 60+ words with resume metrics)
              </label>
              <span
                className={`num text-xs ${
                  charCount > 0 && (charCount < 20 || charCount > 4000)
                    ? 'text-[#92400e]'
                    : wordCount >= 60
                      ? 'text-[#247b50]'
                      : 'text-[#5a6069]'
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
              placeholder="State the Situation and Task, the Actions you took, and the quantified Result from your resume..."
              className="w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] p-3 text-sm leading-relaxed text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
            />
          </div>

          {error && (
            <ErrorBanner error={error} onRetry={() => handleSubmit()} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="num text-xs text-[#5a6069]">
              {charCount < 20
                ? `${20 - charCount} more character${20 - charCount === 1 ? '' : 's'} required`
                : charCount > 4000
                  ? `${charCount - 4000} characters over the 4,000 limit`
                  : wordCount < 60
                    ? `Add ${60 - wordCount} more words to reach the 60-word STAR depth threshold`
                    : 'Meets 60-word depth threshold'}
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
                  className="min-h-[36px] rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3.5 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={!isValidLength || submitting}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-[6px] bg-[#141414] px-4 py-1.5 text-xs font-medium text-[#ffffff] transition hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Scoring answer…</span>
                  </>
                ) : (
                  <span>Get feedback</span>
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
