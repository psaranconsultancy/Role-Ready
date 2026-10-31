import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  FileText,
  Briefcase,
  FolderOpen,
  Loader2,
  RotateCcw,
  Volume2,
  UserRound,
  VolumeX,
} from 'lucide-react';
import type { Session, Question, Feedback, ApiError } from '@contracts';
import { generateQuestions, getSession, isMockMode, isSkippedAnswer, parseResume, toApiError } from '../lib/api';
import { QuestionCard } from '../components/QuestionCard';
import { SessionSummary } from '../components/SessionSummary';
import { ErrorBanner } from '../components/ErrorBanner';
import { QUESTION_TYPE_LABELS } from '../lib/sessionReport';
import { getScoreBand } from '../components/FeedbackPanel';
import { LiveInterviewPanel } from '../components/LiveInterviewPanel';
import { isLiveInterviewEnabled } from '../lib/liveInterview';
import {
  useInterviewerVoice,
  feedbackScript,
  questionScript,
} from '../lib/interviewerVoice';

const STATUS_BADGE: Record<
  Session['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Setup unfinished',
    className: 'border-black/15 bg-black/[0.05] text-[#6e6e73]',
  },
  ready: {
    label: 'Ready',
    className: 'border-[#0284c7]/30 bg-[#0284c7]/10 text-[#0369a1]',
  },
  in_progress: {
    label: 'In progress',
    className: 'border-[#ff9f0a]/35 bg-[#ff9f0a]/15 text-[#b45309]',
  },
  completed: {
    label: 'Completed',
    className: 'border-[#14b8a6]/35 bg-[#14b8a6]/15 text-[#0f766e]',
  },
};

export const SessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<string, Feedback>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [showReferences, setShowReferences] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<ApiError | null>(null);

  const loadSessionData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSession(id);
      setSession(data.session);
      setQuestions(data.questions);
      const map: Record<string, Feedback> = {};
      for (const ans of data.answers) {
        map[ans.question_id] = ans;
      }
      setAnswersByQuestionId(map);
    } catch (err) {
      setError(
        toApiError(
          err,
          'not_found',
          'Could not load this interview session. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  const voice = useInterviewerVoice();

  // The interviewer greets you and reads the first open question, once per
  // visit. Browsers only allow speech after a click, which the user has already
  // made to get here; if it is blocked, nothing happens.
  const greetedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || !questions.length || greetedRef.current === session.id) return;
    greetedRef.current = session.id;
    const firstOpen = questions.find((q) => !answersByQuestionId[q.id]);
    if (!firstOpen || !voice.enabled) return;
    const intro =
      firstOpen.position === 1
        ? `Hello, I'm your interviewer for ${session.role_title || 'this role'}. Let's begin. `
        : `Welcome back. Let's pick up where you left off. `;
    voice.speak(intro + questionScript(firstOpen.position, firstOpen.text), `q:${firstOpen.id}`);
    // Show the question she is asking.
    if (firstOpen.position > 1) window.setTimeout(() => scrollToQuestion(firstOpen.position), 150);
    // Only run when the session's questions first arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, questions.length]);

  // Stop talking when leaving the session page.
  useEffect(() => () => voice.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuestionScored = (
    feedback: Feedback,
    sessionCompleted: boolean,
    sessionOverall: number | null
  ) => {
    // The interviewer reads your score and one fix, then moves to the next question.
    const band = getScoreBand(feedback.overall);
    const nextOpen = questions.find(
      (q) => q.id !== feedback.question_id && !answersByQuestionId[q.id]
    );
    // When the interviewer moves on, the page moves with her: to the next
    // question, or to the summary at the top once every question is done.
    const moveOn = () => {
      if (nextOpen) {
        scrollToQuestion(nextOpen.position);
        voice.speak(`Next, ${questionScript(nextOpen.position, nextOpen.text)}`, `q:${nextOpen.id}`);
      } else if (sessionCompleted && sessionOverall !== null) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        voice.speak(
          `That's all ${questions.length} questions. Your overall score is ${sessionOverall} out of 100. Well done.`,
          `fb:${feedback.question_id}`
        );
      }
    };
    if (isSkippedAnswer(feedback)) {
      // Skipped: move straight on to the next question.
      voice.speak(
        nextOpen
          ? `No problem, let's move on. ${questionScript(nextOpen.position, nextOpen.text)}`
          : sessionCompleted && sessionOverall !== null
            ? `No problem. That's the end of the interview. Your overall score is ${sessionOverall} out of 100.`
            : "No problem, let's move on.",
        nextOpen ? `q:${nextOpen.id}` : `fb:${feedback.question_id}`
      );
      if (nextOpen) window.setTimeout(() => scrollToQuestion(nextOpen.position), 150);
      else if (sessionCompleted) window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150);
    } else {
      // Read the feedback while it is on screen, then move on together.
      voice.speak(
        feedbackScript(feedback.overall, band.label, feedback.what_worked, feedback.one_fix),
        `fb:${feedback.question_id}`,
        false,
        moveOn
      );
    }

    setAnswersByQuestionId((prev) => ({
      ...prev,
      [feedback.question_id]: feedback,
    }));

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: sessionCompleted ? 'completed' : 'in_progress',
        overall_score: sessionCompleted ? sessionOverall : prev.overall_score,
        completed_at: sessionCompleted
          ? new Date().toISOString()
          : prev.completed_at,
      };
    });
  };

  // A session whose setup stopped part-way (e.g. the coach timed out) has no questions yet.
  const finishSetup = async () => {
    if (!session) return;
    setFinishing(true);
    setFinishError(null);
    try {
      if (!session.resume_lines?.length) await parseResume(session.id);
      await generateQuestions(session.id);
      await loadSessionData();
    } catch (err) {
      setFinishError(
        toApiError(err, 'llm_failed', 'We could not finish setting up this session. Please try again.')
      );
    } finally {
      setFinishing(false);
    }
  };

  const scrollToQuestion = (position: number) => {
    const el = document.getElementById(`question-${position}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-3rem)] bg-[#f1f5f9] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-[1080px] space-y-6">
          <div className="bento-card-light h-28 p-6" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="bento-card-light hidden h-80 lg:col-span-3 lg:block" />
            <div className="min-w-0 space-y-6 lg:col-span-9">
              <div className="bento-card-light h-64 p-6" />
              <div className="bento-card-light h-64 p-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <ErrorBanner error={error} onRetry={loadSessionData} />
        <div className="bento-card-light mt-6 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.05] text-[#6e6e73]">
            <FolderOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
            Session not found
          </h1>
          <p className="mt-1 text-sm text-[#6e6e73]">
            This interview session may have been removed or belongs to a
            different account.
          </p>
          <div className="mt-6">
            <Link data-tip="Back to your practice history"
              to="/history"
              className="btn-pill-primary min-h-[42px] px-6 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to practice history</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const totalQuestions = questions.length || session.question_count || 6;
  const answeredCount = questions.filter((q) =>
    Boolean(answersByQuestionId[q.id])
  ).length;
  const allAnswered =
    questions.length > 0 && answeredCount >= questions.length;

  const computedOverall =
    session.overall_score ??
    (allAnswered
      ? Math.round(
          questions.reduce(
            (sum, q) => sum + (answersByQuestionId[q.id]?.overall ?? 0),
            0
          ) / questions.length
        )
      : null);

  const currentOpenId = questions.find((q) => !answersByQuestionId[q.id])?.id ?? null;
  const statusMeta = STATUS_BADGE[session.status] ?? STATUS_BADGE.ready;
  const resumeLines = session.resume_lines ?? [];
  const jdRequirements = session.jd_requirements ?? [];

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-[#f1f5f9] pb-20 text-[#0f172a]">
      {/* Sticky Local Sub-Navigation Bar */}
      <div className="frosted-localnav-light sticky top-12 z-30 h-[54px] w-full">
        <div className="mx-auto flex h-full max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link data-tip="Back to your practice history"
              to="/history"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#6e6e73] transition-colors hover:text-[#0f172a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">History</span>
            </Link>
            <span className="text-black/15" aria-hidden="true">
              /
            </span>
            <h1 className="truncate font-display text-sm font-bold tracking-tight text-[#0f172a] sm:text-base">
              {session.role_title || 'Target Role Interview'}
              {session.company ? (
                <span className="font-normal text-[#6e6e73]">
                  {' '}
                  · {session.company}
                </span>
              ) : null}
            </h1>
            <span
              className={`hidden shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold md:inline-flex ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="flex shrink-0 items-center gap-3">
            {voice.supported && questions.length > 0 && (
              <button
                type="button"
                data-ui="interviewer-voice-toggle"
                onClick={() => {
                  // Speech was blocked until a click: this click turns it on.
                  const next = voice.blocked ? true : !voice.enabled;
                  voice.setEnabled(next);
                  if (next) {
                    const firstOpen = questions.find((q) => !answersByQuestionId[q.id]);
                    if (firstOpen) {
                      scrollToQuestion(firstOpen.position);
                      voice.speak(
                        questionScript(firstOpen.position, firstOpen.text),
                        `q:${firstOpen.id}`,
                        true
                      );
                    }
                  }
                }}
                aria-pressed={voice.enabled}
                data-tip={
                  voice.enabled
                    ? 'The interviewer reads questions and feedback aloud. Click to mute.'
                    : 'Turn on the interviewer voice'
                }
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  voice.enabled
                    ? 'border-[#0d9488]/35 bg-[#0d9488]/10 text-[#0f766e] hover:bg-[#0d9488]/15'
                    : 'border-black/15 bg-black/[0.04] text-[#6e6e73] hover:bg-black/[0.07]'
                }`}
              >
                {voice.enabled ? (
                  <Volume2
                    className={`h-3.5 w-3.5 ${voice.speakingId ? 'animate-pulse' : ''}`}
                    aria-hidden="true"
                  />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {voice.enabled && voice.blocked ? 'Tap for voice' : voice.enabled ? 'Voice on' : 'Voice off'}
                </span>
                <span className="sr-only sm:hidden">
                  {voice.enabled ? 'Interviewer voice on' : 'Interviewer voice off'}
                </span>
              </button>
            )}
            {voice.supported && voice.enabled && questions.length > 0 && (
              <button
                type="button"
                data-ui="interviewer-gender-toggle"
                onClick={() => {
                  const next = voice.gender === 'female' ? 'male' : 'female';
                  voice.setGender(next);
                  const firstOpen = questions.find((q) => !answersByQuestionId[q.id]);
                  if (firstOpen) scrollToQuestion(firstOpen.position);
                  voice.speak(
                    firstOpen
                      ? `Hi, I'll be your interviewer from here. ${questionScript(firstOpen.position, firstOpen.text)}`
                      : "Hi, I'll be your interviewer from here.",
                    firstOpen ? `q:${firstOpen.id}` : 'gender',
                    true
                  );
                }}
                data-tip={`Interviewer voice: ${voice.gender}. Click to switch to a ${voice.gender === 'female' ? 'male' : 'female'} interviewer.`}
                aria-label={`Interviewer voice is ${voice.gender}. Switch to ${voice.gender === 'female' ? 'male' : 'female'}.`}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-[#0ea5e9]/35 bg-[#0ea5e9]/10 px-3 py-1 text-xs font-semibold text-[#0369a1] transition-colors hover:bg-[#0ea5e9]/15"
              >
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                {voice.gender === 'female' ? 'Female' : 'Male'}
              </button>
            )}
            <span className="text-xs font-semibold tabular-nums text-[#0f172a]">
              {answeredCount} of {totalQuestions} answered
            </span>
            <div
              className="hidden h-2 w-28 overflow-hidden rounded-full bg-black/10 sm:block"
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-label={`${answeredCount} of ${totalQuestions} questions answered`}
            >
              <div
                className="h-full rounded-full bg-[#0284c7] transition-[width] duration-300"
                style={{
                  width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1080px] space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Session Summary Banner when every question is answered */}
        {allAnswered && computedOverall !== null && (
          <SessionSummary
            session={session}
            overallScore={computedOverall}
            questions={questions}
            answersByQuestionId={answersByQuestionId}
          />
        )}

        {/* Live interview (beta): only when the live switch is on and the
            real backend is in use. */}
        {questions.length > 0 && !isMockMode() && isLiveInterviewEnabled() && (
          <LiveInterviewPanel sessionId={session.id} />
        )}

        {/* Extracted Evidence Drawer */}
        {(resumeLines.length > 0 || jdRequirements.length > 0) && (
          <div data-ui="evidence-drawer" className="bento-card-light px-5 py-4 sm:px-6">
            <button data-tip="Show or hide the resume lines and job requirements we used"
              type="button"
              onClick={() => setShowReferences((prev) => !prev)}
              aria-expanded={showReferences}
              className="flex w-full items-center justify-between gap-3 text-left text-xs font-semibold text-[#0f172a]"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0284c7]/10 px-2.5 py-0.5 text-xs text-[#0369a1]">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  {resumeLines.length} resume lines
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-2.5 py-0.5 text-xs text-[#0f172a]">
                  <Briefcase className="h-3 w-3" aria-hidden="true" />
                  {jdRequirements.length} job requirements
                </span>
                <span className="text-[#6e6e73]">
                  {showReferences
                    ? 'Hide the resume lines and job requirements we used'
                    : 'Show the resume lines and job requirements we used'}
                </span>
              </span>
              {showReferences ? (
                <ChevronUp
                  className="h-4 w-4 shrink-0 text-[#6e6e73]"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-[#6e6e73]"
                  aria-hidden="true"
                />
              )}
            </button>

            {showReferences && (
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-black/10 pt-4 text-xs md:grid-cols-2">
                <div className="rounded-2xl bg-[#f1f5f9] p-4">
                  <p className="font-display text-sm font-bold text-[#0369a1]">
                    Lines from your resume ({resumeLines.length})
                  </p>
                  <ul className="mt-3 space-y-2 text-[#0f172a]">
                    {resumeLines.map((r, idx) => (
                      <li key={r.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded-full border border-[#0284c7]/30 bg-[#0284c7]/10 px-2 py-0.5 text-xs font-bold text-[#0369a1]">
                          Line {idx + 1}
                        </span>
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#f1f5f9] p-4">
                  <p className="font-display text-sm font-bold text-[#0f172a]">
                    What the job asks for ({jdRequirements.length})
                  </p>
                  <ul className="mt-3 space-y-2 text-[#0f172a]">
                    {jdRequirements.map((j, idx) => (
                      <li key={j.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-bold text-[#0f172a]">
                          Requirement {idx + 1}
                        </span>
                        <span>{j.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {questions.length === 0 && (
          <div data-ui="setup-unfinished" className="bento-card-light p-6 text-center sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#0f172a]">
              This session's questions aren't ready yet
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#6e6e73]">
              Setup stopped before your questions were written. Finish it
              now, or start a new practice session.
            </p>
            {finishError && (
              <div className="mt-4 text-left">
                <ErrorBanner error={finishError} />
              </div>
            )}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button data-tip="Finish creating the questions for this session"
                type="button"
                onClick={finishSetup}
                disabled={finishing}
                className="btn-pill-primary min-h-[42px] px-6 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {finishing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{finishing ? 'Writing your questions…' : 'Finish setting up'}</span>
              </button>
              <Link data-tip="Start a fresh practice session"
                to="/new"
                className="btn-pill-secondary-light min-h-[42px] px-6 py-2 text-xs font-semibold"
              >
                Start a new session
              </Link>
            </div>
          </div>
        )}

        {/* Two-Column Workspace: Left Rail (Desktop) + Main Questions */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Desktop Sticky Question Navigator Rail */}
          <aside
            data-ui="question-nav"
            aria-label="Question navigator"
            className={`bento-card-light hidden p-4 lg:sticky lg:top-28 lg:col-span-3 ${questions.length ? 'lg:block' : ''}`}
          >
            <p className="px-2 text-xs font-semibold text-[#86868b]">
              Questions in this session
            </p>
            <ul className="mt-2.5 space-y-1">
              {questions.map((q) => {
                const ans = answersByQuestionId[q.id];
                const isAnswered = Boolean(ans);
                return (
                  <li key={q.id}>
                    <button data-tip="Jump to this question"
                      type="button"
                      onClick={() => scrollToQuestion(q.position)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-[#f1f5f9]"
                    >
                      <span className="flex items-center gap-2 font-medium text-[#0f172a]">
                        {isAnswered ? (
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-[#14b8a6]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-4 w-4 shrink-0 text-[#86868b]"
                            aria-hidden="true"
                          />
                        )}
                        <span className="font-bold tabular-nums">
                          Q{q.position}
                        </span>
                        <span className="truncate text-[#6e6e73]">
                          {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                        </span>
                      </span>

                      {ans && isSkippedAnswer(ans) ? (
                        <span className="text-xs text-[#86868b]">Skipped</span>
                      ) : ans ? (
                        <span className="text-xs font-semibold tabular-nums text-[#0f766e]">
                          {ans.overall}
                        </span>
                      ) : (
                        <span className="text-xs text-[#86868b]">Open</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Question Cards List */}
          <div className="min-w-0 space-y-6 lg:col-span-9">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                isCurrent={q.id === currentOpenId}
                nextPosition={
                  questions.find(
                    (o) => o.position > q.position && !answersByQuestionId[o.id]
                  )?.position ??
                  questions.find((o) => o.id !== q.id && !answersByQuestionId[o.id])?.position ??
                  null
                }
                onGoToQuestion={(pos) => {
                  scrollToQuestion(pos);
                  const target = questions.find((o) => o.position === pos);
                  if (target) voice.speak(questionScript(target.position, target.text), `q:${target.id}`);
                }}
                question={q}
                existingFeedback={answersByQuestionId[q.id]}
                resumeLines={resumeLines}
                jdRequirements={jdRequirements}
                roleTitle={session.role_title}
                company={session.company}
                onScored={handleQuestionScored}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
