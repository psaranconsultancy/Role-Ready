import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
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
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  ready: {
    label: 'Ready',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  },
  in_progress: {
    label: 'In progress',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  completed: {
    label: 'Completed',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
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
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-indigo-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-600">
            Loading your interview session…
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
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
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Top back link */}
      <div>
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to History</span>
        </Link>
      </div>

      {/* Session Header Card */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {answeredCount} of {totalQuestions} answered
                </span>
              </span>
            </div>

            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {session.role_title || 'Target Role Interview'}
            </h1>

            {session.company && (
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{session.company}</span>
              </div>
            )}
          </div>

          {/* Progress bar widget */}
          <div className="w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Session progress</span>
              <span className="inline-flex items-center gap-1 text-indigo-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {answeredCount} / {totalQuestions}
                </span>
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-label={`${answeredCount} of ${totalQuestions} questions answered`}
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Collapsible parsed Resume Lines & JD Requirements reference drawer */}
        {(resumeLines.length > 0 || jdRequirements.length > 0) && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowReferences((prev) => !prev)}
              aria-expanded={showReferences}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {showReferences
                  ? 'Hide extracted resume lines & JD requirements'
                  : `View all extracted resume lines (${resumeLines.length}) & JD requirements (${jdRequirements.length})`}
              </span>
              {showReferences ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>

            {showReferences && (
              <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Resume Lines (R1..R{resumeLines.length})
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-slate-700">
                    {resumeLines.map((r) => (
                      <li key={r.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-900">
                          {r.id}
                        </span>
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    JD Requirements (J1..J{jdRequirements.length})
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-slate-700">
                    {jdRequirements.map((j) => (
                      <li key={j.id} className="leading-relaxed">
                        <span className="mr-1.5 inline-block rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900">
                          {j.id}
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
      <div className="space-y-5">
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

