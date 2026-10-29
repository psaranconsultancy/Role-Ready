import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Session, Question, Feedback, ApiError } from '@contracts';
import { getSession, toApiError } from '../lib/api';
import { QuestionCard } from '../components/QuestionCard';
import { SessionSummary } from '../components/SessionSummary';
import { ErrorBanner } from '../components/ErrorBanner';

const STATUS_BADGE: Record<
  Session['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'border-[#cfd5de] bg-[#eaecef] text-[#383c42]',
  },
  ready: {
    label: 'Ready',
    className: 'border-[#cfd5de] bg-[#eaecef] text-[#383c42]',
  },
  in_progress: {
    label: 'In progress',
    className: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
  },
  completed: {
    label: 'Completed',
    className: 'border-[#b7e4c7] bg-[#dcfae5] text-[#04250e]',
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

  const handleQuestionScored = (
    feedback: Feedback,
    sessionCompleted: boolean,
    sessionOverall: number | null
  ) => {
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

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="inline-flex flex-col items-center gap-2.5">
          <Loader2
            className="h-6 w-6 animate-spin text-[#1d5fbf]"
            aria-hidden="true"
          />
          <p className="text-sm text-[#5a6069]">
            Loading interview session…
          </p>
        </div>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorBanner error={error} onRetry={loadSessionData} />
        <div className="mt-4">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0a0a0a] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to History</span>
          </Link>
        </div>
      </main>
    );
  }

  const totalQuestions = questions.length || 6;
  const answeredCount = questions.filter(
    (q) => Boolean(answersByQuestionId[q.id])
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

  const statusMeta = STATUS_BADGE[session.status] ?? STATUS_BADGE.ready;
  const resumeLines = session.resume_lines ?? [];
  const jdRequirements = session.jd_requirements ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb + Title Header */}
      <header className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5a6069]">
              <Link
                to="/history"
                className="inline-flex items-center gap-1 font-medium text-[#5a6069] hover:text-[#0a0a0a] focus:outline-none focus-visible:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>History</span>
              </Link>
              <span>/</span>
              <span>{session.company || 'Interview session'}</span>
              <span
                className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight text-[#0a0a0a]">
              {session.role_title || 'Target Role Interview'}
              {session.company ? (
                <span className="font-normal text-[#5a6069]">
                  {' '}
                  · {session.company}
                </span>
              ) : null}
            </h1>
          </div>

          {/* Progress strip */}
          <div className="w-full sm:w-52">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[#5a6069]">Answered</span>
              <span className="num font-medium text-[#0a0a0a]">
                {answeredCount} of {totalQuestions}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#eaecef]"
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-label={`${answeredCount} of ${totalQuestions} questions answered`}
            >
              <div
                className="h-full bg-[#1d5fbf]"
                style={{
                  width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Collapsible parsed Resume Lines & JD Requirements ledger */}
        {(resumeLines.length > 0 || jdRequirements.length > 0) && (
          <div className="mt-4 border-t border-[#eef0f3] pt-3">
            <button
              type="button"
              onClick={() => setShowReferences((prev) => !prev)}
              aria-expanded={showReferences}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5a6069] hover:text-[#0a0a0a] focus:outline-none focus-visible:underline"
            >
              <span className="num">
                {showReferences
                  ? 'Hide extracted resume lines & JD requirements'
                  : `Inspect extracted resume lines (R1..R${resumeLines.length}) & JD requirements (J1..J${jdRequirements.length})`}
              </span>
              {showReferences ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>

            {showReferences && (
              <div className="mt-3 grid grid-cols-1 divide-y divide-[#e2e5ea] rounded-[6px] border border-[#e2e5ea] bg-[#f8f9fb] text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-3.5">
                  <div className="font-medium text-[#0a0a0a]">
                    Resume Lines (R1..R{resumeLines.length})
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[#5a6069]">
                    {resumeLines.map((r) => (
                      <li key={r.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded-[4px] border border-[#1d5fbf]/35 bg-[#1d5fbf]/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#1d5fbf]">
                          {r.id}
                        </span>
                        <span className="text-[#0a0a0a]">{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5">
                  <div className="font-medium text-[#0a0a0a]">
                    JD Requirements (J1..J{jdRequirements.length})
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[#5a6069]">
                    {jdRequirements.map((j) => (
                      <li key={j.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded-[4px] border border-[#cfd5de] bg-[#eaecef] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#383c42]">
                          {j.id}
                        </span>
                        <span className="text-[#0a0a0a]">{j.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Session Summary Banner when all 6 are answered */}
      {allAnswered && computedOverall !== null && (
        <SessionSummary
          overallScore={computedOverall}
          questions={questions}
          answersByQuestionId={answersByQuestionId}
        />
      )}

      {/* 6 Question Cards */}
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            existingFeedback={answersByQuestionId[q.id]}
            resumeLines={resumeLines}
            jdRequirements={jdRequirements}
            onScored={handleQuestionScored}
          />
        ))}
      </div>
    </main>
  );
};
