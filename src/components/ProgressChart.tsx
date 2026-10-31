import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Session } from '@contracts';

// "Your scores across sessions": one line of session averages, oldest first,
// so a candidate can see whether practice is paying off. Plain SVG, no chart
// library. Hover or tap a point for its details; the list under the chart
// gives the same numbers to screen readers.

interface Point {
  id: string;
  label: string;
  date: string;
  score: number;
}

const LINE = '#0284c7';
const GRID = 'rgba(15, 23, 42, 0.08)';
const AXIS_TEXT = '#86868b';
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };

const shortDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
};

export const ProgressChart: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  const points: Point[] = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'completed' && s.overall_score !== null)
        .map((s) => ({
          id: s.id,
          label: [s.role_title || 'Practice session', s.company].filter(Boolean).join(' · '),
          date: s.completed_at ?? s.created_at,
          score: s.overall_score as number,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sessions]
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(260, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return null;

  const first = points[0].score;
  const latest = points[points.length - 1].score;
  const best = Math.max(...points.map((p) => p.score));
  const change = latest - first;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (score: number) => PAD.top + innerH - (Math.max(0, Math.min(100, score)) / 100) * innerH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.score)}`).join(' ');

  // Show at most ~6 date labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 90))));
  const activePoint = active !== null ? points[active] : null;

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendText =
    points.length < 2
      ? 'Finish another session to see your trend.'
      : change > 0
        ? `Up ${change} points since your first session.`
        : change < 0
          ? `Down ${Math.abs(change)} points since your first session. Keep going: the fixes add up.`
          : 'Level with your first session.';

  return (
    <section data-ui="progress-chart" aria-labelledby="progress-title" className="bento-card-light p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 id="progress-title" className="font-display text-lg font-bold text-[#0f172a]">
            Your scores across sessions
          </h2>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#424245]">
            <TrendIcon
              className={`h-4 w-4 ${change > 0 ? 'text-[#0f766e]' : change < 0 ? 'text-[#b45309]' : 'text-[#86868b]'}`}
              aria-hidden="true"
            />
            <span>{trendText}</span>
          </p>
        </div>
        <dl className="flex gap-5 text-right">
          <div>
            <dt className="text-xs text-[#86868b]">Latest</dt>
            <dd className="font-display text-xl font-bold tabular-nums text-[#0f172a]">{latest}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#86868b]">Best</dt>
            <dd className="font-display text-xl font-bold tabular-nums text-[#0f172a]">{best}</dd>
          </div>
        </dl>
      </div>

      <div ref={wrapRef} className="relative mt-4 w-full">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block max-w-full"
          aria-hidden="true"
        >
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {t}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text key={p.id} x={x(i)} y={HEIGHT - 8} textAnchor={points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle'} fontSize={11} fill={AXIS_TEXT}>
                {shortDate(p.date)}
              </text>
            ) : null
          )}
          {activePoint && (
            <line
              x1={x(active!)}
              x2={x(active!)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="rgba(15,23,42,0.18)"
              strokeWidth={1}
            />
          )}
          {points.length > 1 && (
            <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {points.map((p, i) => (
            <circle
              key={p.id}
              cx={x(i)}
              cy={y(p.score)}
              r={active === i ? 6 : 4.5}
              fill={i === points.length - 1 ? LINE : '#fff'}
              stroke={i === points.length - 1 ? '#fff' : LINE}
              strokeWidth={2}
            />
          ))}
          {/* Hit areas: wider than the dots so a finger can find them. */}
          {points.map((p, i) => (
            <rect
              key={`hit-${p.id}`}
              x={x(i) - Math.max(14, innerW / Math.max(1, points.length - 1) / 2)}
              y={PAD.top}
              width={Math.max(28, innerW / Math.max(1, points.length - 1))}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            />
          ))}
        </svg>

        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[220px] rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(x(active!) - 80, 0), width - 200),
              top: Math.max(0, y(activePoint.score) - 64),
            }}
          >
            <p className="font-semibold tabular-nums text-[#0f172a]">{activePoint.score}/100</p>
            <p className="truncate text-[#424245]">{activePoint.label}</p>
            <p className="text-[#86868b]">{shortDate(activePoint.date)}</p>
          </div>
        )}
      </div>

      <ol className="sr-only">
        {points.map((p) => (
          <li key={p.id}>
            {shortDate(p.date)}, {p.label}: {p.score} out of 100
          </li>
        ))}
      </ol>

      {activePoint && (
        <p className="mt-2 text-xs text-[#6e6e73]">
          <Link to={`/session/${activePoint.id}`} className="font-semibold text-[#0369a1] hover:underline">
            Open this session
          </Link>{' '}
          to review its feedback.
        </p>
      )}
    </section>
  );
};
