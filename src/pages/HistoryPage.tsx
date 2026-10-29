import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  Building2,
  ArrowRight,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import type { Session, ApiError } from '@contracts';
import { listSessions, toApiError } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { getScoreBand } from '../components/FeedbackPanel';

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

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(data);
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
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interview History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review past sessions, inspect grounded feedback, or continue an interview in progress.
          </p>
        </div>

        <Link
          to="/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span>New session</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner error={error} onRetry={fetchHistory} />
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Loader2
            className="mx-auto h-7 w-7 animate-spin text-indigo-600"
            aria-hidden="true"
          />
          <p className="mt-2.5 text-sm font-medium text-slate-600">
            Loading your interview sessions…
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FolderOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">
            No interview sessions yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            Upload your resume PDF and paste a job description to get 6 tailored interview questions grounded in your experience.
          </p>
          <div className="mt-5">
            <Link
              to="/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Start your first session</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sessions.map((s) => {
            const statusMeta = STATUS_BADGE[s.status] ?? STATUS_BADGE.ready;
            const scoreBand =
              s.overall_score !== null ? getScoreBand(s.overall_score) : null;

            return (
              <Link
                key={s.id}
                to={`/session/${s.id}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatDate(s.created_at)}</span>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 sm:text-lg">
                      {s.role_title || 'Target Role Interview'}
                    </h2>

                    {s.company && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Building2
                          className="h-3.5 w-3.5 text-slate-400"
                          aria-hidden="true"
                        />
                        <span>{s.company}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    {s.overall_score !== null && scoreBand ? (
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl border font-bold ${scoreBand.badgeClass}`}
                        >
                          <span className="text-base leading-none">
                            {s.overall_score}
                          </span>
                          <span className="text-[9px] uppercase opacity-75">
                            /100
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-semibold text-slate-900">
                            Overall Score
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {scoreBand.label}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-500">
                        Not yet completed
                      </div>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition group-hover:bg-indigo-50 group-hover:text-indigo-700">
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

