import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  Send,
  CheckCircle2,
  Sparkles,
  Mic,
  Square,
  Volume2,
  Clock,
  SkipForward,
  ArrowDown,
} from 'lucide-react';
import type {
  Question,
  Feedback,
  ResumeLine,
  JdRequirement,
  ApiError,
} from '@contracts';
import { isClarification, isSkippedAnswer, scoreAnswer, skipQuestion, toApiError } from '../lib/api';
import { ReferenceChip } from './ReferenceChip';
import { FeedbackPanel, getScoreBand } from './FeedbackPanel';
import { ErrorBanner } from './ErrorBanner';
import { GrillFollowUp } from './GrillFollowUp';
import { useSpeechToText } from '../lib/useSpeechToText';
import { saveAnswerRecording, useAnswerRecorder } from '../lib/answerRecorder';
import { AnswerReplay } from './AnswerReplay';
import { QUESTION_TYPE_LABELS } from '../lib/sessionReport';
import { useInterviewerVoice, questionScript, prefetchSpeech } from '../lib/interviewerVoice';

// How long the current question can sit with no typing, speaking or
// interviewer voice before the interviewer checks in.
const IDLE_CHECK_IN_MS = 60_000;
const CHECK_IN_LINE =
  "Just checking in. Would you like a bit more time, or shall we move on to the next question?";
const MORE_TIME_LINE = 'Of course. Take all the time you need.';

const REPHRASE_REQUEST =
  "I don't understand the question. Can you rephrase it in plainer words?";
const SHORT_CLARIFY =
  /^(what\??|huh\??|pardon\??|sorry\??|(please )?(rephrase|reword|explain|clarify)( (it|that|this|please))?\??|(i )?(don'?t|do not) (understand|get it)\??|not clear\??|unclear\??|explain please\??|rephrase\?)$/i;

interface QuestionCardProps {
  question: Question;
  existingFeedback?: Feedback;
  resumeLines: ResumeLine[];
  jdRequirements: JdRequirement[];
  roleTitle?: string | null;
  company?: string | null;
  onScored: (
    feedback: Feedback,
    sessionCompleted: boolean,
    sessionOverall: number | null
  ) => void;
  /** True for the first unanswered question: the one the interviewer is on. */
  isCurrent?: boolean;
  /** Position of the next unanswered question, for the "Next question" button. */
  nextPosition?: number | null;
  onGoToQuestion?: (position: number) => void;
}


export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  existingFeedback,
  resumeLines,
  jdRequirements,
  onScored,
  isCurrent = false,
  nextPosition = null,
  onGoToQuestion,
}) => {
  const [answerText, setAnswerText] = useState(
    existingFeedback?.answer_text ?? ''
  );
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [clarified, setClarified] = useState<{
    rephrased_question: string;
    hint: string;
  } | null>(null);
  const voice = useInterviewerVoice();
  const speakingHere =
    voice.speakingId !== null && voice.speakingId.endsWith(`:${question.id}`);
  const speech = useSpeechToText((text) =>
    setAnswerText((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text))
  );

  // Records the spoken answer too, for "Play your answer" (desktop only).
  const recorder = useAnswerRecorder(speech.listening);
  // Answer box emptied: the draft recording no longer matches it.
  useEffect(() => {
    if (!speech.listening && answerText.trim() === '' && recorder.takes.length) recorder.discard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerText, speech.listening]);

  // Check in when the candidate goes quiet on the current question.
  const [checkIn, setCheckIn] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const idleTimer = useRef<number | null>(null);
  const waitingForAnswer =
    isCurrent && isEditing && !existingFeedback && !submitting && !skipping;
  // Get the check-in lines ready so the natural voice speaks without a pause.
  useEffect(() => {
    if (!isCurrent) return;
    prefetchSpeech(CHECK_IN_LINE);
    prefetchSpeech(MORE_TIME_LINE);
  }, [isCurrent]);

  useEffect(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (!waitingForAnswer || checkIn || speech.listening || speakingHere || voice.liveActive) return;
    idleTimer.current = window.setTimeout(() => {
      setCheckIn(true);
      voice.speak(CHECK_IN_LINE, `ci:${question.id}`);
    }, IDLE_CHECK_IN_MS);
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
    // Any typing restarts the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForAnswer, checkIn, speech.listening, speakingHere, answerText, voice.liveActive]);

  // Typing or speaking an answer means they're still going: drop the prompt.
  useEffect(() => {
    if (checkIn && (speech.listening || answerText.trim().length > 0)) setCheckIn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening, answerText]);

  const giveMoreTime = () => {
    setCheckIn(false);
    voice.speak(MORE_TIME_LINE, `ci:${question.id}`);
    document.getElementById(`answer-input-${question.id}`)?.focus();
  };

  const skipThisQuestion = async () => {
    speech.stop();
    voice.stop();
    setSkipping(true);
    setError(null);
    try {
      const res = await skipQuestion(question);
      const { session_completed, session_overall, ...feedback } = res;
      recorder.discard();
      saveAnswerRecording(question.id, []);
      setCheckIn(false);
      setAnswerText(feedback.answer_text);
      setIsEditing(false);
      onScored(feedback, session_completed, session_overall);
    } catch (err) {
      setError(toApiError(err, 'bad_request', 'Could not skip this question. Please try again.'));
    } finally {
      setSkipping(false);
    }
  };

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
  // Short asks like "What?" or "Rephrase please" skip the 20-character minimum.
  const isShortClarification =
    charCount > 0 && charCount < 20 && SHORT_CLARIFY.test(answerText.trim());
  const isValidLength =
    (charCount >= 20 && charCount <= 4000) || isShortClarification;
  const typeLabel = QUESTION_TYPE_LABELS[question.type] ?? question.type;

  const resolveResumeText = (refId: string): string => {
    const found = resumeLines.find((r) => r.id === refId);
    return found ? found.text : 'Referenced resume line from your uploaded CV';
  };

  const resolveJdText = (refId: string): string => {
    const found = jdRequirements.find((j) => j.id === refId);
    return found ? found.text : 'Referenced requirement from the job description';
  };

  const handleSubmit = async (e?: React.FormEvent, askToRephrase = false) => {
    if (e) e.preventDefault();
    if ((!isValidLength && !askToRephrase) || submitting) return;
    speech.stop();
    voice.stop();

    setSubmitting(true);
    setError(null);
    try {
      // The server needs 20+ characters, so short or one-click asks are sent as a full sentence.
      const text =
        askToRephrase || isShortClarification ? REPHRASE_REQUEST : answerText;
      const res = await scoreAnswer(question.id, text);
      if (isClarification(res)) {
        // A request to explain the question, not an answer: show plainer wording, keep editing.
        setClarified(res.clarification);
        setAnswerText('');
        recorder.discard();
        voice.speak(
          `Let me put that another way. ${res.clarification.rephrased_question} ${res.clarification.hint}`,
          `cl:${question.id}`
        );
        return;
      }
      setClarified(null);
      // Keep this answer's recording for replay (or clear an older one).
      saveAnswerRecording(question.id, await recorder.takeWhenDone());
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

  const skipped = isSkippedAnswer(existingFeedback);
  const textareaId = `answer-input-${question.id}`;
  const scoreBand = existingFeedback
    ? getScoreBand(existingFeedback.overall)
    : null;

  return (
    <section
      id={`question-${question.position}`}
      data-ui="question-card"
      aria-labelledby={`question-heading-${question.position}`}
      className="bento-card-light scroll-mt-28 p-6 sm:p-8"
    >
      {/* Question Header: Position Badge, Type Pill, Score Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold tabular-nums text-white">
            Q{question.position}
          </span>
          <span className="rounded-full bg-[#0284c7]/10 px-3 py-0.5 text-xs font-semibold text-[#0369a1]">
            {typeLabel}
          </span>
        </div>

        {existingFeedback && scoreBand ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums ${scoreBand.badgeClass}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {skipped ? 'Skipped · 0/100' : `Scored ${existingFeedback.overall}/100 · ${scoreBand.label}`}
            </span>
          </span>
        ) : (
          <span className="rounded-full bg-black/[0.05] px-3 py-0.5 text-xs font-medium text-[#6e6e73]">
            Unanswered
          </span>
        )}
      </div>

      {/* Question Prompt */}
      <h2
        id={`question-heading-${question.position}`}
        className="mt-4 font-display text-lg font-bold leading-snug text-[#0f172a] sm:text-xl"
      >
        {question.text}
      </h2>

      {voice.supported && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-ui="hear-question"
            onClick={() =>
              speakingHere
                ? voice.stop()
                : voice.speak(
                    questionScript(question.position, question.text),
                    `q:${question.id}`,
                    true
                  )
            }
            aria-pressed={speakingHere}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
              speakingHere
                ? 'border-[#0d9488]/40 bg-[#0d9488]/10 text-[#0f766e] hover:bg-[#0d9488]/15'
                : 'border-[#0284c7]/25 bg-white text-[#0369a1] hover:bg-[#0284c7]/[0.06]'
            }`}
          >
            {speakingHere ? (
              <>
                <Square className="h-3 w-3" aria-hidden="true" />
                <span>Stop the interviewer</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hear the question</span>
              </>
            )}
          </button>
          {speakingHere && (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-[#0f766e]"
              aria-live="polite"
            >
              <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
                <span className="voice-bar h-full w-[3px] rounded-full bg-[#0d9488]" />
                <span className="voice-bar h-full w-[3px] rounded-full bg-[#0d9488] [animation-delay:150ms]" />
                <span className="voice-bar h-full w-[3px] rounded-full bg-[#0d9488] [animation-delay:300ms]" />
              </span>
              Interviewer speaking
            </span>
          )}
        </div>
      )}

      {question.why_asking && (
        <p className="mt-3 text-sm leading-relaxed text-[#424245]">
          <span className="font-semibold text-[#0f172a]">Why we're asking: </span>
          {question.why_asking}
        </p>
      )}

      {/* Citation Chips Bar */}
      {(question.resume_refs.length > 0 || question.jd_refs.length > 0) && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.06] bg-[#f1f5f9] px-3.5 py-2.5"
          aria-label="Where this question comes from"
        >
          <span className="basis-full text-xs font-semibold text-[#6e6e73]">
            Based on:
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

      {clarified && isEditing && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 rounded-2xl border border-[#0284c7]/25 bg-[#0284c7]/[0.06] p-4"
        >
          <p className="text-xs font-semibold text-[#0369a1]">
            The question in plainer words (this was not scored)
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#0f172a]">
            {clarified.rephrased_question}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#424245]">
            {clarified.hint}
          </p>
        </div>
      )}

      {/* Answer Editor or Read-Only Submitted Answer */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-5" noValidate>
          {checkIn && (
            <div
              role="alertdialog"
              aria-live="assertive"
              aria-label="Interviewer check-in"
              data-ui="idle-check-in"
              className="mb-4 rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/[0.07] p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <Clock className="h-4 w-4 text-[#0f766e]" aria-hidden="true" />
                Just checking in. Would you like more time, or shall we move on?
              </p>
              <p className="mt-1 text-xs text-[#424245]">
                Moving on scores this question 0. You can come back and answer it later.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={giveMoreTime}
                  className="btn-pill-primary min-h-[40px] px-5 py-2 text-xs font-semibold"
                >
                  I need more time
                </button>
                <button
                  type="button"
                  onClick={skipThisQuestion}
                  disabled={skipping}
                  className="btn-pill-secondary-light min-h-[40px] px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {skipping ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>Next question</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={textareaId}
              className="text-xs font-semibold text-[#0f172a]"
            >
              Your answer: the situation, what you did, and the result (with a number if you can)
            </label>
            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span
                className={
                  wordCount >= 60
                    ? 'font-semibold text-[#0f766e]'
                    : 'text-[#6e6e73]'
                }
              >
                {wordCount} words {wordCount >= 60 ? '(60+ target met)' : '(aim for 60+)'}
              </span>
              <span className="text-black/20">·</span>
              <span
                className={
                  charCount > 4000
                    ? 'font-semibold text-[#d70015]'
                    : charCount >= 20
                      ? 'text-[#0f172a]'
                      : 'text-[#86868b]'
                }
              >
                {charCount}/4,000 characters
              </span>
            </div>
          </div>

          {speech.supported && (
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (speech.listening) return speech.stop();
                  void speech.start();
                  document
                    .getElementById(textareaId)
                    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }}
                aria-pressed={speech.listening}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  speech.listening
                    ? 'border-[#d70015]/40 bg-[#d70015]/10 text-[#d70015] hover:bg-[#d70015]/15'
                    : 'border-[#0284c7]/30 bg-[#0284c7]/[0.06] text-[#0369a1] hover:bg-[#0284c7]/10'
                }`}
              >
                {speech.listening ? (
                  <>
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Stop recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Speak your answer</span>
                  </>
                )}
              </button>
              <span className="text-xs text-[#6e6e73]" aria-live="polite">
                {speech.listening ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 animate-pulse rounded-full bg-[#d70015]"
                      aria-hidden="true"
                    />
                    Listening. Your words appear in the box below, and you can
                    edit them before you submit.
                  </span>
                ) : (
                  'Practise saying it out loud. We type it up for you.'
                )}
              </span>
            </div>
          )}

          {speech.error && (
            <p role="alert" className="mt-2 text-xs font-medium text-[#d70015]">
              {speech.error}
            </p>
          )}

          <textarea
            id={textareaId}
            rows={5}
            disabled={submitting}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Describe the situation, what you personally did, and the result. Include a number if you can. Not sure what the question means? Press ‘Rephrase the question’."
            className="mt-2 block w-full rounded-[18px] border border-black/15 bg-[#f1f5f9]/60 p-4 text-base leading-relaxed text-[#0f172a] placeholder:text-[#aeaeb2] focus:border-[#0284c7] focus:bg-white focus:outline-none disabled:opacity-60"
          />

          {speech.listening && speech.interim && (
            <p className="mt-1.5 text-sm text-[#0f766e]">
              Hearing: {speech.interim}
            </p>
          )}

          {/* Submitting State */}
          {submitting && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-2xl border border-[#0284c7]/20 bg-[#0284c7]/[0.05] p-4"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0369a1]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>
                  Checking your answer against your resume and what the job
                  asks for…
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="h-10 rounded-xl bg-[#0284c7]/10" />
                <div className="h-10 rounded-xl bg-[#0284c7]/10" />
                <div className="h-10 rounded-xl bg-[#0284c7]/10" />
                <div className="h-10 rounded-xl bg-[#0284c7]/10" />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#6e6e73]">
              {isShortClarification
                ? 'We will rephrase the question.'
                : charCount < 20
                ? `Write at least ${20 - charCount} more character${
                    20 - charCount === 1 ? '' : 's'
                  } to submit.`
                : charCount > 4000
                ? `That's ${(charCount - 4000).toLocaleString()} characters over the 4,000 limit. Trim it a little to submit.`
                : 'Ready to score.'}
            </span>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              {!submitting && !existingFeedback && (
                <button
                  type="button"
                  onClick={skipThisQuestion}
                  disabled={skipping}
                  title="Move on now. This question scores 0 until you come back to it."
                  className="btn-pill-secondary-light min-h-[42px] px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {skipping ? 'Skipping…' : 'Skip for now'}
                </button>
              )}
              {!submitting && (
                <button
                  type="button"
                  onClick={() => handleSubmit(undefined, true)}
                  className="btn-pill-secondary-light min-h-[42px] px-4 py-2 text-xs font-semibold"
                >
                  Rephrase the question
                </button>
              )}
              {existingFeedback && !submitting && (
                <button
                  type="button"
                  onClick={() => {
                    speech.stop();
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
      ) : skipped ? null : (
        <div className="mt-5 rounded-2xl border border-black/[0.07] bg-[#f1f5f9]/70 p-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#6e6e73]">
            <span className="font-semibold text-[#0f172a]">
              Your submitted answer
            </span>
            <span className="tabular-nums">{wordCount} words</span>
          </div>
          <AnswerReplay questionId={question.id} />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0f172a]">
            {answerText}
          </p>
        </div>
      )}

      {/* Scored Feedback Panel (or a short note for a skipped question) */}
      {existingFeedback && !isEditing && !skipped && (
        <FeedbackPanel
          feedback={existingFeedback}
          onTryAgain={handleTryAgain}
        />
      )}
      {existingFeedback && !isEditing && skipped && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-white p-4">
          <p className="text-sm text-[#424245]">
            Skipped, so this question scores 0 for now. Answer it any time to replace the 0.
          </p>
          <button
            type="button"
            onClick={() => {
              setAnswerText('');
              handleTryAgain();
            }}
            className="btn-pill-primary min-h-[40px] px-5 py-2 text-xs font-semibold"
          >
            Answer it now
          </button>
        </div>
      )}

      {existingFeedback && !isEditing && nextPosition && onGoToQuestion && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            data-ui="next-question"
            onClick={() => onGoToQuestion(nextPosition)}
            className="btn-pill-primary min-h-[42px] px-6 py-2 text-xs font-semibold"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Next question (Q{nextPosition})</span>
          </button>
        </div>
      )}

      {existingFeedback && isEditing && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#0369a1]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            Apply the suggested fix from your scorecard and resubmit to update
            your score.
          </span>
        </p>
      )}

      {/* Grill Me: a tougher follow-up on the scored answer, with a Heat Dial.
          Shown once the answer is scored, so unanswered cards stay short. */}
      {existingFeedback && !skipped ? (
        <GrillFollowUp
          question={question}
          feedback={existingFeedback}
          resumeLines={resumeLines}
        />
      ) : skipped ? null : (
        <p className="mt-5 flex items-center gap-1.5 text-xs text-[#6e6e73]">
          <Sparkles className="h-3.5 w-3.5 text-[#0369a1]" aria-hidden="true" />
          <span>
            After your score, Grill Me can ask the tougher follow-up a real
            panel would.
          </span>
        </p>
      )}
    </section>
  );
};
