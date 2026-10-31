import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Award, FileDown, Mail, Loader2, Check, Send } from 'lucide-react';
import type { Question, Feedback, Session } from '@contracts';
import { getScoreBand } from './FeedbackPanel';
import { ScoreRing } from './ScoreRing';
import {
  buildReportMailto,
  openReport,
  QUESTION_TYPE_LABELS,
} from '../lib/sessionReport';
import { downloadReportPdf } from '../lib/sessionReportPdf';
import { emailReport, isSkippedAnswer } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface SessionSummaryProps {
  session: Session;
  overallScore: number;
  questions: Question[];
  answersByQuestionId: Record<string, Feedback>;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  overallScore,
  questions,
  answersByQuestionId,
}) => {
  const band = getScoreBand(overallScore);
  const { user } = useAuth();
  const reportInput = { session, questions, answersByQuestionId, overallScore };
  // Demo accounts have no real inbox, so leave "To" empty for them.
  const mailTo =
    user?.email?.includes('@') && !user.email.endsWith('@roleready.app')
      ? user.email
      : '';
  const [makingPdf, setMakingPdf] = useState(false);
  const [pdfNote, setPdfNote] = useState<string | null>(null);

  // Email report: sent automatically to a real account email when the session
  // has just finished, and on demand with "Email me this report".
  type EmailState = 'idle' | 'form' | 'sending' | 'sent' | 'error';
  const [emailState, setEmailState] = useState<EmailState>('idle');
  const [emailNote, setEmailNote] = useState<string | null>(null);
  const [address, setAddress] = useState(mailTo);
  const [addressError, setAddressError] = useState<string | null>(null);
  const autoTried = useRef(false);

  const sendEmail = async (to: string) => {
    setEmailState('sending');
    setEmailNote(`Emailing your report to ${to}…`);
    try {
      const res = await emailReport(session.id, to);
      setEmailState('sent');
      setEmailNote(`Report emailed to ${res.sent_to}. Check your inbox (and spam, just in case).`);
      try {
        sessionStorage.setItem(`rr_emailed_${session.id}`, '1');
      } catch {
        /* storage is optional */
      }
    } catch (err) {
      const msg =
        (err as { error?: { message?: string } })?.error?.message ??
        "We couldn't send the email just now. Download the PDF instead.";
      setEmailState('error');
      setEmailNote(msg);
    }
  };

  useEffect(() => {
    if (autoTried.current || !mailTo || !session.completed_at) return;
    autoTried.current = true;
    const fresh = Date.now() - new Date(session.completed_at).getTime() < 5 * 60_000;
    let already = false;
    try {
      already = sessionStorage.getItem(`rr_emailed_${session.id}`) === '1';
    } catch {
      /* storage is optional */
    }
    if (fresh && !already) void sendEmail(mailTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailTo, session.completed_at, session.id]);

  const onEmailClick = () => {
    if (emailState === 'sending') return;
    if (mailTo && emailState !== 'error') return void sendEmail(mailTo);
    setEmailState('form');
    setEmailNote(null);
  };

  // Build the PDF in the browser and download it. If that fails for any
  // reason, open the printable page instead so the candidate still gets a copy.
  const handleDownload = async () => {
    if (makingPdf) return;
    setMakingPdf(true);
    setPdfNote(null);
    try {
      await downloadReportPdf(reportInput);
      setPdfNote('Report downloaded. Check your Downloads folder.');
    } catch {
      setPdfNote('Opened a printable copy instead. Use Save as PDF to keep it.');
      openReport(reportInput);
    } finally {
      setMakingPdf(false);
    }
  };

  const skippedCount = questions.filter((q) =>
    isSkippedAnswer(answersByQuestionId[q.id]),
  ).length;

  const weakestQuestion = [...questions].sort((a, b) => {
    const scoreA = answersByQuestionId[a.id]?.overall ?? 100;
    const scoreB = answersByQuestionId[b.id]?.overall ?? 100;
    return scoreA - scoreB;
  })[0];

  const scrollToQuestion = (position: number) => {
    const el = document.getElementById(`question-${position}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      data-ui="session-summary"
      aria-label="Session complete summary"
      className="bento-card-dark overflow-hidden p-6 text-[#f8fafc] sm:p-8"
    >
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <ScoreRing score={overallScore} size="lg" theme="dark" />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#14b8a6]/20 px-3 py-0.5 text-xs font-semibold text-[#14b8a6]">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {skippedCount > 0
                  ? `${questions.length - skippedCount} of ${questions.length} answered · ${skippedCount} skipped`
                  : `All ${questions.length} questions answered`}{' '}
                · {band.label}
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums text-white sm:text-3xl">
              Session average: {overallScore}/100
            </h2>
            <p className="mt-1 text-xs text-[#a1a1a6] sm:text-sm">
              Select any question below to jump to its scorecard or re-answer
              your lowest-scoring question.
            </p>
          </div>
        </div>

        {weakestQuestion && (
          <button data-tip="Jump to your lowest-scoring question and try it again"
            type="button"
            onClick={() => scrollToQuestion(weakestQuestion.position)}
            className="btn-pill-primary min-h-[42px] shrink-0 self-start px-5 py-2 text-xs font-semibold tabular-nums sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Retry Q{weakestQuestion.position} (
              {answersByQuestionId[weakestQuestion.id]?.overall ?? 0}/100)
            </span>
          </button>
        )}
      </div>

      {/* Session report: printable page (save as PDF) or the user's own mail app */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button data-tip="Save a PDF with every score, fix and stronger answer"
          type="button"
          onClick={handleDownload}
          disabled={makingPdf}
          aria-busy={makingPdf}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-70"
        >
          {makingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{makingPdf ? 'Making your PDF…' : 'Download report (PDF)'}</span>
        </button>
        <button
          type="button"
          data-ui="email-report"
          onClick={onEmailClick}
          disabled={emailState === 'sending'}
          aria-busy={emailState === 'sending'}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-70"
        >
          {emailState === 'sending' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : emailState === 'sent' ? (
            <Check className="h-3.5 w-3.5 text-[#14b8a6]" aria-hidden="true" />
          ) : (
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>
            {emailState === 'sending'
              ? 'Sending…'
              : emailState === 'sent'
                ? 'Email it again'
                : 'Email me this report'}
          </span>
        </button>
        <span className="text-xs text-[#a1a1a6]" role="status">
          {pdfNote ?? 'The PDF and the email both have every score, fix and stronger answer.'}
        </span>
      </div>

      {emailState === 'form' && (
        <form
          noValidate
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const a = address.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(a)) {
              setAddressError(a ? 'That email address doesn’t look right. Check for a typo.' : 'Please enter your email address.');
              return;
            }
            setAddressError(null);
            void sendEmail(a);
          }}
        >
          <label htmlFor="report-email" className="sr-only">
            Email address
          </label>
          <input
            id="report-email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (addressError) setAddressError(null);
            }}
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            aria-invalid={addressError ? true : undefined}
            placeholder="you@example.com"
            className="min-h-[40px] w-full max-w-xs rounded-full border border-white/20 bg-white/[0.08] px-4 text-sm text-white placeholder:text-[#86868b] focus:border-[#38bdf8] focus:outline-none"
          />
          <button
            type="submit"
            className="btn-pill-primary min-h-[40px] px-5 py-2 text-xs font-semibold"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Send</span>
          </button>
          <button
            type="button"
            onClick={() => setEmailState('idle')}
            className="min-h-[40px] rounded-full px-3 text-xs font-semibold text-[#a1a1a6] hover:text-white"
          >
            Cancel
          </button>
          {addressError && (
            <p role="alert" className="w-full text-xs font-medium text-[#fca5a5]">
              {addressError}
            </p>
          )}
        </form>
      )}

      {emailNote && emailState !== 'form' && (
        <p
          className={`mt-3 text-xs ${emailState === 'error' ? 'text-[#fdba74]' : emailState === 'sent' ? 'text-[#5eead4]' : 'text-[#a1a1a6]'}`}
          role="status"
        >
          {emailNote}
          {emailState === 'error' && (
            <>
              {' '}
              <a
                href={buildReportMailto(reportInput, address || mailTo)}
                className="font-semibold text-white underline underline-offset-2"
              >
                Open it in my mail app instead
              </a>
              {' · '}
              <button
                type="button"
                onClick={() => setEmailState('form')}
                className="font-semibold text-white underline underline-offset-2"
              >
                Try another address
              </button>
            </>
          )}
        </p>
      )}

      {/* One score tile per question (5, 6, 10 or 15) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {questions.map((q) => {
          const ans = answersByQuestionId[q.id];
          const qScore = ans?.overall ?? 0;
          const isWeakest = weakestQuestion?.id === q.id;
          const barColor =
            qScore >= 75
              ? 'bg-[#14b8a6]'
              : qScore >= 50
                ? 'bg-[#ff9f0a]'
                : 'bg-[#ff453a]';

          return (
            <button data-tip="Jump to this question"
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.position)}
              className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-colors hover:bg-white/10 ${
                isWeakest
                  ? 'border-[#ff9f0a]/50 bg-[#ff9f0a]/10'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div className="flex w-full items-center justify-between text-xs">
                <span className="font-bold tabular-nums text-white">
                  Q{q.position}
                </span>
                <span className="truncate text-xs text-[#a1a1a6]">
                  {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold tabular-nums text-white">
                  {qScore}
                </span>
                <span className="text-xs tabular-nums text-[#a1a1a6]">
                  /100
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${Math.max(0, Math.min(100, qScore))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
