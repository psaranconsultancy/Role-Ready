import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  FileText,
  FolderOpen,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { Session, ApiError } from '@contracts';
import { deleteSession, listSessions, toApiError } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { getScoreBand } from '../components/FeedbackPanel';
import { ScoreRing } from '../components/ScoreRing';
import { AmbientHeroCanvas } from '../components/AmbientHeroCanvas';

const STATUS_BADGE: Record<
  Session['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'border-black/15 bg-black/[0.05] text-[#6e6e73]',
  },
  ready: {
    label: 'Ready',
    className: 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3]',
  },
  in_progress: {
    label: 'In progress',
    className: 'border-[#ff9f0a]/35 bg-[#ff9f0a]/15 text-[#b45309]',
  },
  completed: {
    label: 'Completed',
    className: 'border-[#30d158]/35 bg-[#30d158]/15 text-[#15803d]',
  },
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const HistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const forceEmpty = searchParams.get('empty') === '1';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(forceEmpty ? [] : data);
    } catch (err) {
      setError(
        toApiError(
          err,
          'bad_request',
          'Could not load your session history. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [forceEmpty]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (s: Session) => {
    const name = s.role_title || 'this practice session';
    if (!window.confirm(`Delete ${name}? Its questions and scored answers will be removed for good.`)) {
      return;
    }
    setDeletingId(s.id);
    setError(null);
    try {
      await deleteSession(s.id);
      setSessions((prev) => prev.filter((item) => item.id !== s.id));
    } catch (err) {
      setError(
        toApiError(err, 'bad_request', 'Could not delete this session. Please try again.')
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (s) => s.status === 'completed' && s.overall_score !== null
  );
  const inProgressCount = sessions.filter(
    (s) => s.status === 'in_progress' || s.status === 'ready'
  ).length;
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce(
            (sum, s) => sum + (s.overall_score ?? 0),
            0
          ) / completedSessions.length
        )
      : null;

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-[#f5f5f7] pb-20 text-[#1d1d1f]">
      {/* Sticky Local Sub-Nav */}
      <div className="frosted-localnav-light sticky top-12 z-30 h-[52px] w-full">
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <span className="font-display text-base font-bold tracking-tight text-[#1d1d1f]">
            Practice history
          </span>
          <Link
            to="/new"
            className="btn-pill-primary px-4 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New practice</span>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[1024px] space-y-6 px-4 pt-8 sm:px-6 sm:pt-10">
        {/* Studio Readiness Header Card with Ambient Motion */}
        <div className="bento-card-dark relative overflow-hidden p-6 text-[#f5f5f7] sm:p-8">
          <AmbientHeroCanvas
            backdropImage="/assets/img/hero-candidate-focus.jpg"
            videoOpacity={0.38}
          />
          <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-medium text-[#2997ff]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Interview readiness studio</span>
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#f5f5f7] sm:text-4xl">
                Your practice sessions
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#d2d2d7]">
                Reopen any completed session to review your scored answers, or
                start a fresh run to sharpen your delivery before the real room.
              </p>
            </div>
            <Link
              to="/new"
              className="btn-pill-primary min-h-[44px] shrink-0 self-start px-6 py-2.5 text-sm font-semibold sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Start new practice</span>
            </Link>
          </div>
        </div>

        {/* 3-Column Bento KPI Strip */}
        {!loading && totalSessions > 0 && (
          <div
            data-ui="history-kpi"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div className="bento-card-light p-5">
              <p className="text-xs font-medium text-[#86868b]">
                Total sessions
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1d1d1f]">
                {totalSessions}
              </p>
              <p className="mt-1 text-xs text-[#6e6e73]">
                {inProgressCount} active · {completedSessions.length} completed
              </p>
            </div>

            <div className="bento-card-light p-5">
              <p className="text-xs font-medium text-[#86868b]">
                Completed sessions
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1d1d1f]">
                {completedSessions.length}
                <span className="ml-1.5 font-sans text-sm font-normal text-[#86868b]">
                  of {totalSessions}
                </span>
              </p>
              <p className="mt-1 text-xs text-[#15803d]">
                All 6 questions answered
              </p>
            </div>

            <div className="bento-card-light flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium text-[#86868b]">
                  Average score
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1d1d1f]">
                  {avgScore !== null ? `${avgScore}/100` : 'None yet'}
                </p>
                <p className="mt-1 text-xs text-[#6e6e73]">
                  Across completed sessions
                </p>
              </div>
              {avgScore !== null && (
                <ScoreRing score={avgScore} size="sm" theme="light" />
              )}
            </div>
          </div>
        )}

        {error && <ErrorBanner error={error} onRetry={fetchHistory} />}

        {/* Loading Skeletons (3 Rows) */}
        {loading ? (
          <div
            role="status"
            aria-label="Loading interview sessions"
            className="space-y-4"
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bento-card-light flex h-24 items-center justify-between p-6"
              >
                <div className="space-y-2.5">
                  <div className="h-4 w-48 rounded-full bg-black/10" />
                  <div className="h-3 w-32 rounded-full bg-black/[0.06]" />
                </div>
                <div className="h-10 w-24 rounded-full bg-black/[0.08]" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          /* Designed EmptyState */
          <div className="bento-card-light p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
              <FolderOpen className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
              No practice sessions yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6e6e73]">
              Upload your resume PDF and paste a job description to generate six
              tailored interview questions built from your experience.
            </p>
            <div className="mt-6">
              <Link
                to="/new"
                className="btn-pill-primary min-h-[44px] px-7 py-2.5 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Start your first session</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Session Bento List */
          <div data-ui="session-list" className="space-y-3.5">
            {sessions.map((s) => {
              const statusMeta = STATUS_BADGE[s.status] ?? STATUS_BADGE.ready;
              const scoreBand =
                s.overall_score !== null
                  ? getScoreBand(s.overall_score)
                  : null;
              const isCompleted = s.status === 'completed';

              return (
                <div key={s.id} className="relative">
                <Link
                  to={`/session/${s.id}`}
                  className="bento-card-light bento-card-light-interactive group flex flex-col justify-between gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:p-6 sm:pr-16"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-[#86868b]">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {formatDate(s.created_at)}
                      </span>
                      {s.resume_lines && (
                        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-[#0071e3]">
                          <FileText className="h-3 w-3" aria-hidden="true" />
                          {s.resume_lines.length} lines from your resume
                        </span>
                      )}
                    </div>

                    <h2 className="truncate font-display text-lg font-bold text-[#1d1d1f] transition-colors group-hover:text-[#0071e3] sm:text-xl">
                      {s.role_title || 'Target Role Interview'}
                      {s.company ? (
                        <span className="font-normal text-[#6e6e73]">
                          {' '}
                          · {s.company}
                        </span>
                      ) : null}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-t border-black/[0.06] pt-3 sm:border-t-0 sm:pt-0">
                    {s.overall_score !== null && scoreBand ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-xs text-[#86868b]">
                            Overall
                          </span>
                          <span
                            className={`text-xs font-semibold ${scoreBand.textSignalClass}`}
                          >
                            {scoreBand.label}
                          </span>
                        </div>
                        <ScoreRing
                          score={s.overall_score}
                          size="sm"
                          theme="light"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-[#86868b]">
                        6 questions ready
                      </span>
                    )}

                    <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#f5f5f7] px-4 py-1.5 text-xs font-semibold text-[#1d1d1f] transition-colors group-hover:bg-[#0071e3] group-hover:text-white">
                      <span>{isCompleted ? 'Review' : 'Continue'}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  aria-label={`Delete ${s.role_title || 'practice session'}${s.company ? ` at ${s.company}` : ''}`}
                  title="Delete session"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-[#ff3b30]/10 hover:text-[#d70015] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3] disabled:opacity-60 sm:top-1/2 sm:-translate-y-1/2"
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
