import React, { useEffect, useState } from 'react';
import { Loader2, MailCheck, RotateCw } from 'lucide-react';
import { resendConfirmation } from '../lib/api';

// Shown after sign-up (and when someone signs in before confirming): tells
// them where the link went and lets them resend it or change the address,
// so nobody is left stuck waiting for an email.

const COOLDOWN_S = 60;

export const CheckInbox: React.FC<{
  email: string;
  reason: 'signup' | 'signin';
  onBack: () => void;
}> = ({ email, reason, onBack }) => {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(reason === 'signup' ? COOLDOWN_S : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    if (state === 'sending' || wait > 0) return;
    setState('sending');
    setNote(null);
    try {
      await resendConfirmation(email);
      setState('sent');
      setNote('Sent again. It can take a minute to arrive.');
      setWait(COOLDOWN_S);
    } catch (err) {
      setState('idle');
      setNote(
        (err as { error?: { message?: string } })?.error?.message ??
          'Could not send the email. Please try again in a minute.'
      );
    }
  };

  return (
    <div data-ui="check-inbox" className="mt-6 rounded-[22px] border border-[#0284c7]/20 bg-[#f0f9ff] p-5 sm:p-6" role="status" aria-live="polite">
      <MailCheck className="h-8 w-8 text-[#0284c7]" aria-hidden="true" />
      <h3 className="mt-3 font-display text-lg font-bold text-[#0f172a]">
        {reason === 'signup' ? 'Check your inbox' : 'Confirm your email first'}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#424245]">
        {reason === 'signup' ? 'We’ve sent a confirmation link to ' : 'Your account is waiting for you to confirm '}
        <strong className="break-all text-[#0f172a]">{email}</strong>
        {reason === 'signup'
          ? '. Click it and you’ll be signed straight in to RoleReady.'
          : '. Click the link in the email we sent you, or get a new one below.'}
      </p>
      <p className="mt-2 text-xs text-[#6e6e73]">
        Can’t see it after a minute? Check your Spam or Promotions folder.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-tip="Send the confirmation email again"
          onClick={resend}
          disabled={state === 'sending' || wait > 0}
          className="btn-pill-primary min-h-[42px] px-5 py-2 text-xs font-semibold disabled:opacity-60"
        >
          {state === 'sending' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{wait > 0 ? `Resend email in ${wait}s` : 'Resend email'}</span>
        </button>
        <button
          type="button"
          data-tip="Go back and use a different email address"
          onClick={onBack}
          className="btn-pill-secondary-light min-h-[42px] px-5 py-2 text-xs font-semibold"
        >
          Use a different email
        </button>
      </div>
      {note && <p className="mt-2.5 text-xs font-medium text-[#0369a1]">{note}</p>}
    </div>
  );
};
