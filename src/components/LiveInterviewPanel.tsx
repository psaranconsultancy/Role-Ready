import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Loader2, PhoneOff, Radio } from 'lucide-react';
import {
  LiveInterview,
  isLiveInterviewSupported,
  type LiveLine,
  type LiveStatus,
} from '../lib/liveInterview';

// Live interview (beta): talk to the interviewer and it talks back, in real
// time. Shown only when the live switch is on (see isLiveInterviewEnabled).

const STATUS_TEXT: Record<LiveStatus, string> = {
  idle: 'Talk through your questions out loud. The interviewer listens and replies in real time.',
  connecting: 'Connecting to your interviewer…',
  listening: 'Your turn. Speak naturally; you can interrupt at any time.',
  speaking: 'The interviewer is speaking…',
  ended: 'Interview ended. Type your answers below to get a full scorecard.',
  error: '',
};

export const LiveInterviewPanel: React.FC<{ sessionId: string; onStart?: () => void }> = ({
  sessionId,
  onStart,
}) => {
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [lines, setLines] = useState<LiveLine[]>([]);
  const liveRef = useRef<LiveInterview | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => liveRef.current?.stop(), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  if (!isLiveInterviewSupported()) return null;

  const active = status === 'connecting' || status === 'listening' || status === 'speaking';

  const start = () => {
    onStart?.();
    setLines([]);
    setMessage(null);
    const live = new LiveInterview({
      onStatus: (s, m) => {
        setStatus(s);
        if (m) setMessage(m);
      },
      onTranscript: setLines,
    });
    liveRef.current = live;
    void live.start(sessionId);
  };

  const end = () => {
    liveRef.current?.stop();
    liveRef.current = null;
  };

  return (
    <section
      data-ui="live-interview"
      aria-label="Live interview"
      className="bento-card-light overflow-hidden p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0d9488] text-white">
              <Headphones className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-base font-bold text-[#0f172a]">
              Live interview
            </h2>
            <span className="rounded-full bg-[#0d9488]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0f766e]">
              Beta
            </span>
          </div>
          <p
            className={`mt-2 text-sm ${status === 'error' ? 'font-medium text-[#d70015]' : 'text-[#424245]'}`}
            aria-live="polite"
          >
            {status === 'error' || (status === 'ended' && message)
              ? message
              : STATUS_TEXT[status]}
          </p>
        </div>

        {active ? (
          <button data-tip="Stop the live interview"
            type="button"
            onClick={end}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-[#d70015]/35 bg-[#d70015]/10 px-5 py-2 text-xs font-semibold text-[#d70015] hover:bg-[#d70015]/15"
          >
            <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span>End interview</span>
          </button>
        ) : (
          <button data-tip="Start a spoken interview with the AI interviewer"
            type="button"
            onClick={start}
            className="btn-pill-primary min-h-[42px] px-5 py-2 text-xs font-semibold"
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{status === 'idle' ? 'Start live interview' : 'Start again'}</span>
          </button>
        )}
      </div>

      {active && (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#0f766e]">
          {status === 'connecting' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
              {[0, 120, 240, 360].map((d) => (
                <span
                  key={d}
                  className={`w-[3px] rounded-full ${status === 'speaking' ? 'voice-bar h-full bg-[#0d9488]' : 'h-1.5 bg-[#0ea5e9]'}`}
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
          )}
          <span>
            {status === 'speaking' ? 'Interviewer' : status === 'listening' ? 'Listening' : 'Connecting'}
          </span>
        </div>
      )}

      {lines.length > 0 && (
        <div
          ref={scrollRef}
          className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#f1f5f9] p-3.5 text-sm"
        >
          {lines.map((l, i) => (
            <p key={i} className="leading-relaxed">
              <span
                className={`mr-1.5 text-xs font-bold ${l.who === 'interviewer' ? 'text-[#0f766e]' : 'text-[#0369a1]'}`}
              >
                {l.who === 'interviewer' ? 'Interviewer' : 'You'}:
              </span>
              <span className="text-[#0f172a]">{l.text}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
};
