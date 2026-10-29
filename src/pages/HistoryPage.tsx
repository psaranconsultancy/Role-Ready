import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Loader2 } from 'lucide-react';
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

  // Compute summary metrics from rows (achromatic-ledger rule: totals computed from rows)
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
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
      {/* Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[#0a0a0a]">
            Sessions
          </h1>
          <p className="mt-0.5 text-sm text-[#5a6069]">
            {completedSessions.length > 0 && avgScore !== null
              ? `${completedSessions.length} completed (${avgScore}/100 avg) · ${inProgressCount} in progress`
              : 'Reopen past mock interviews or start a new role-specific session.'}
          </p>
        </div>

        <Link
          to="/new"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[6px] bg-[#141414] px-3.5 py-2 text-xs font-medium text-[#ffffff] transition hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New session</span>
        </Link>
      </div>

      {/* Divided KPI strip (1 container split by 1px hairlines, achromatic-ledger rule) */}
      {!loading && totalSessions > 0 && (
        <div className="grid grid-cols-3 divide-x divide-[#e2e5ea] overflow-hidden rounded-[8px] border border-[#e2e5ea] bg-[#ffffff]">
          <div className="p-4">
            <div className="text-xs font-medium text-[#5a6069]">
              Total sessions
            </div>
            <div className="num mt-1 text-2xl font-normal text-[#0a0a0a]">
              {totalSessions}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs font-medium text-[#5a6069]">Completed</div>
            <div className="num mt-1 text-2xl font-normal text-[#0a0a0a]">
              {completedSessions.length}
              <span className="ml-1 text-xs text-[#5a6069]">
                of {totalSessions}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs font-medium text-[#5a6069]">
              Average score
            </div>
            <div className="num mt-1 text-2xl font-normal text-[#0a0a0a]">
              {avgScore !== null ? (
                <>
                  {avgScore}
                  <span className="ml-1 text-xs text-[#5a6069]">/100</span>
                </>
              ) : (
                <span className="text-base text-[#5a6069]">—</span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBanner error={error} onRetry={fetchHistory} />}

      {loading ? (
        <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] py-16 text-center">
          <Loader2
            className="mx-auto h-6 w-6 animate-spin text-[#1d5fbf]"
            aria-hidden="true"
          />
          <p className="mt-2.5 text-sm text-[#5a6069]">
            Loading interview sessions…
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#cfd5de] bg-[#ffffff] p-8 text-center">
          <h2 className="text-sm font-medium text-[#0a0a0a]">
            No interview sessions yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-[#5a6069]">
            Upload your resume PDF and paste a target job description to generate 6 tailored questions grounded in R1..Rn and J1..Jn.
          </p>
          <div className="mt-4">
            <Link
              to="/new"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[6px] bg-[#141414] px-4 py-2 text-xs font-medium text-[#ffffff] transition hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Start your first session</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#e2e5ea] bg-[#ffffff]">
          {/* Desktop table header (sentence-case grey, no fill band, right-aligned numeric columns) */}
          <div className="hidden border-b border-[#e2e5ea] px-4 py-2.5 text-xs text-[#5a6069] sm:grid sm:grid-cols-12 sm:items-center">
            <div className="col-span-5">Role & company</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Created</div>
            <div className="col-span-2 text-right">Overall score</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-[#eef0f3]">
            {sessions.map((s) => {
              const statusMeta = STATUS_BADGE[s.status] ?? STATUS_BADGE.ready;
              const scoreBand =
                s.overall_score !== null ? getScoreBand(s.overall_score) : null;

              return (
                <Link
                  key={s.id}
                  to={`/session/${s.id}`}
                  className="group block px-4 py-3.5 transition hover:bg-[#f8f9fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a0a0a]"
                >
                  {/* Desktop Row */}
                  <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
                    <div className="col-span-5 pr-3">
                      <div className="truncate text-sm font-medium text-[#0a0a0a] group-hover:text-[#1d5fbf]">
                        {s.role_title || 'Target Role Interview'}
                      </div>
                      <div className="truncate text-xs text-[#5a6069]">
                        {s.company || '—'} ·{' '}
                        <span className="font-mono text-[11px]">
                          {s.resume_lines ? `${s.resume_lines.length} R-lines` : 'PDF'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="num col-span-2 text-right text-xs text-[#5a6069]">
                      {formatDate(s.created_at)}
                    </div>

                    <div className="num col-span-2 text-right">
                      {s.overall_score !== null && scoreBand ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-sm font-medium text-[#0a0a0a]">
                            {s.overall_score}
                            <span className="text-xs font-normal text-[#5a6069]">
                              /100
                            </span>
                          </span>
                          <div className="mt-1 h-1 w-16 overflow-hidden rounded-[2px] bg-[#eaecef]">
                            <div
                              className="h-full bg-[#1d5fbf]"
                              style={{ width: `${s.overall_score}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#5a6069]">—</span>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0a0a0a] group-hover:text-[#1d5fbf]">
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  {/* Mobile 2-line Row (< 640px) */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="truncate text-sm font-medium text-[#0a0a0a]">
                        {s.role_title || 'Target Role Interview'}
                      </div>
                      <div className="num shrink-0 text-sm font-medium text-[#0a0a0a]">
                        {s.overall_score !== null ? (
                          <>
                            {s.overall_score}
                            <span className="text-xs font-normal text-[#5a6069]">
                              /100
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-normal text-[#5a6069]">
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#5a6069]">
                      <div className="flex items-center gap-2">
                        <span>{s.company || '—'}</span>
                        <span>·</span>
                        <span className="num">{formatDate(s.created_at)}</span>
                        <span
                          className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 font-medium text-[#0a0a0a]">
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};
