import React, { useEffect, useState } from 'react';
import {
  Flame,
  Loader2,
  Send,
  RotateCcw,
  Copy,
  Check,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mic,
  Square,
} from 'lucide-react';
import type {
  ApiError,
  Feedback,
  GrillFollowUpResponse,
  GrillHeat,
  GrillReplyResponse,
  Question,
  ResumeLine,
} from '@contracts';
import { askGrillFollowUp, judgeGrillReply, toApiError } from '../lib/api';
import { HEAT_LEVELS, useSubscriptionTier } from '../lib/tiers';
import { ReferenceChip } from './ReferenceChip';
import { ErrorBanner } from './ErrorBanner';
import { useSpeechToText } from '../lib/useSpeechToText';

interface GrillFollowUpProps {
  question: Question;
  feedback?: Feedback;
  resumeLines: ResumeLine[];
}

const HEATS: GrillHeat[] = [1, 2, 3, 4];

// What each heat does to the typed follow-up (mirrors HEAT_STYLE in the
// grill-followup function). HEAT_LEVELS descriptions also cover the voice
// interviewer's clock, which is not built yet.
const HEAT_HINTS: Record<GrillHeat, string> = {
  1: 'Friendly. Asks you to fill the biggest gap in your story.',
  2: 'A normal panel. Asks for your method, numbers or trade-offs.',
  3: 'Sceptical. Separates what you did from what your team did.',
  4: 'Blunt and senior. Challenges your weakest claim and wants an exact number.',
};

const VERDICT_META: Record<
  GrillReplyResponse['verdict'],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  held_up: {
    label: 'You held up',
    className: 'border-[#30d158]/40 bg-[#30d158]/15 text-[#30d158]',
    Icon: CheckCircle2,
  },
  partly: {
    label: 'Partly held up',
    className: 'border-[#ff9f0a]/45 bg-[#ff9f0a]/15 text-[#ff9f0a]',
    Icon: AlertTriangle,
  },
  cracked: {
    label: 'You cracked',
    className: 'border-[#ff453a]/50 bg-[#ff453a]/20 text-[#ff453a]',
    Icon: XCircle,
  },
};

// Grill Me: after an answer is scored, the interviewer asks one tougher
// follow-up aimed at its weakest point, at the chosen heat. The candidate
// replies and gets a verdict. Nothing here is saved.
export const GrillFollowUp: React.FC<GrillFollowUpProps> = ({
  question,
  feedback,
  resumeLines,
}) => {
  const { heat, setHeat } = useSubscriptionTier();
  const [followUp, setFollowUp] = useState<GrillFollowUpResponse | null>(null);
  const [askedHeat, setAskedHeat] = useState<GrillHeat>(heat);
  const [reply, setReply] = useState('');
  const [verdict, setVerdict] = useState<GrillReplyResponse | null>(null);
  const [loading, setLoading] = useState<'ask' | 'judge' | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastAction, setLastAction] = useState<'ask' | 'judge'>('ask');
  const [copied, setCopied] = useState(false);
  const speech = useSpeechToText((text) =>
    setReply((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text))
  );

  // A new or re-scored answer starts a fresh grilling.
  useEffect(() => {
    setFollowUp(null);
    setReply('');
    setVerdict(null);
    setError(null);
  }, [feedback?.answer_text, feedback?.overall]);

  const replyLength = reply.trim().length;
  const replyValid = replyLength >= 20 && replyLength <= 2000;
  const meta = HEAT_LEVELS[heat];

  const ask = async () => {
    setLoading('ask');
    setLastAction('ask');
    setError(null);
    setVerdict(null);
    setReply('');
    try {
      setFollowUp(await askGrillFollowUp(question.id, heat));
      setAskedHeat(heat);
    } catch (err) {
      setError(
        toApiError(err, 'llm_failed', 'Grill Me could not respond. Please try again.')
      );
    } finally {
      setLoading(null);
    }
  };

  const judge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUp || !replyValid || loading) return;
    speech.stop();
    setLoading('judge');
    setLastAction('judge');
    setError(null);
    try {
      setVerdict(
        await judgeGrillReply(question.id, askedHeat, followUp.followup, reply)
      );
    } catch (err) {
      setError(
        toApiError(err, 'llm_failed', 'Grill Me could not judge your reply. Please try again.')
      );
    } finally {
      setLoading(null);
    }
  };

  const copyBetter = async () => {
    if (!verdict) return;
    try {
      await navigator.clipboard.writeText(verdict.better_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked; the text is still on screen
    }
  };

  const resolveResume = (id: string) =>
    resumeLines.find((l) => l.id === id)?.text ??
    'A line from your resume';

  const replyId = `grill-reply-${question.id}`;
  const verdictMeta = verdict ? VERDICT_META[verdict.verdict] : null;

  return (
    <section
      data-ui="grill-followup"
      aria-label="Grill Me follow-up question"
      className="bento-card-dark mt-6 overflow-hidden p-6 text-[#f5f5f7] sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-3 py-1 text-xs font-semibold text-white">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Grill Me · Follow-up</span>
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
        >
          Heat {heat}/4 · {meta.name}
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold text-white sm:text-xl">
        Can your answer survive the next question?
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
        Real panels press on the weakest part of what you just said. Grill Me
        asks that follow-up, then tells you whether your reply held up.
      </p>

      {/* Heat Dial */}
      <fieldset className="mt-5" disabled={!feedback || loading !== null}>
        <legend className="text-xs font-semibold text-[#a1a1a6]">
          Heat Dial: how hard should the interviewer push?
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HEATS.map((level) => {
            const m = HEAT_LEVELS[level];
            const active = heat === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => setHeat(level)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? m.badgeClass
                    : 'border-white/10 bg-white/[0.04] text-[#d2d2d7] hover:bg-white/10'
                }`}
              >
                <span className="block font-bold tabular-nums">
                  {level} · {m.shortLabel}
                </span>
                <span className="block truncate opacity-80">{m.name}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[#a1a1a6]">{HEAT_HINTS[heat]}</p>
      </fieldset>

      {!feedback && (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs text-[#d2d2d7]">
          Answer this question and get your score first. Grill Me then asks
          the follow-up a panel would.
        </p>
      )}

      {feedback && !followUp && (
        <button
          type="button"
          onClick={ask}
          disabled={loading !== null}
          className="btn-pill-primary mt-5 min-h-[42px] px-6 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {loading === 'ask' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Writing your follow-up…</span>
            </>
          ) : (
            <>
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Grill me on this answer</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-5">
          <ErrorBanner
            error={error}
            onRetry={() => (lastAction === 'ask' ? ask() : judge())}
          />
        </div>
      )}

      {followUp && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5">
            <p className="text-xs font-semibold text-[#2997ff]">
              Interviewer · {HEAT_LEVELS[askedHeat].name}
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-white">
              “{followUp.followup}”
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-0.5 text-xs text-[#d2d2d7]">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tests: {followUp.presses_on}</span>
              </span>
              {followUp.resume_refs.map((id) => (
                <ReferenceChip
                  key={id}
                  id={id}
                  kind="resume"
                  text={resolveResume(id)}
                />
              ))}
            </div>
          </div>

          {!verdict ? (
            <form onSubmit={judge} noValidate>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={replyId}
                  className="text-xs font-semibold text-white"
                >
                  Your reply
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    replyLength > 2000 ? 'font-semibold text-[#ff453a]' : 'text-[#a1a1a6]'
                  }`}
                >
                  {replyLength}/2,000 chars
                </span>
              </div>
              {speech.supported && (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={speech.listening ? speech.stop : speech.start}
                  aria-pressed={speech.listening}
                  className={`mt-2 inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    speech.listening
                      ? 'border-[#ff453a]/50 bg-[#ff453a]/15 text-[#ff453a]'
                      : 'border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {speech.listening ? (
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{speech.listening ? 'Stop recording' : 'Say your reply'}</span>
                </button>
              )}
              {speech.error && (
                <p role="alert" className="mt-2 text-xs font-medium text-[#ff453a]">
                  {speech.error}
                </p>
              )}
              <textarea
                id={replyId}
                rows={4}
                value={reply}
                disabled={loading !== null}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Answer the follow-up directly. Name what you did and the number."
                className="mt-2 block w-full rounded-[18px] border border-white/15 bg-black/40 p-4 text-base leading-relaxed text-white placeholder:text-[#86868b] focus:border-[#2997ff] focus:outline-none disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#a1a1a6]">
                  {replyLength < 20
                    ? `Write at least ${20 - replyLength} more character${
                        20 - replyLength === 1 ? '' : 's'
                      }.`
                    : 'Ready.'}
                </span>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={ask}
                    disabled={loading !== null}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50 sm:flex-none"
                  >
                    {loading === 'ask' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>Different question</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!replyValid || loading !== null}
                    className="btn-pill-primary min-h-[42px] flex-1 px-6 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {loading === 'judge' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Judging your reply…</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            verdictMeta && (
              <div className="space-y-4" aria-live="polite">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs font-semibold text-[#a1a1a6]">Your reply</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#f5f5f7]">
                    {reply}
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${verdictMeta.className}`}
                  >
                    <verdictMeta.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{verdictMeta.label}</span>
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-[#f5f5f7]">
                    {verdict.feedback}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2997ff]/30 bg-[#0071e3]/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#2997ff]">
                      A stronger reply, from your resume
                    </p>
                    <button
                      type="button"
                      onClick={copyBetter}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2997ff] hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#f5f5f7]">
                    {verdict.better_reply}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerdict(null);
                      setReply('');
                    }}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reply again</span>
                  </button>
                  <button
                    type="button"
                    onClick={ask}
                    disabled={loading !== null}
                    className="btn-pill-primary min-h-[42px] px-5 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {loading === 'ask' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>Grill me again</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <p className="mt-6 flex items-start gap-1.5 border-t border-white/10 pt-4 text-xs text-[#a1a1a6]">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff9f0a]" aria-hidden="true" />
        <span>
          Coming soon: a spoken AI interviewer with a male or female voice,
          Niche and C-Suite question sets, and salary negotiation scripts.
        </span>
      </p>
    </section>
  );
};
