import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authLinkResult } from '../lib/supabase';

// After someone clicks the link in their sign-up email they land back here,
// already signed in. This tells them so, once, and gets out of the way.

export const EmailConfirmedModal: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(authLinkResult?.kind === 'confirmed');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || loading || !user) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0f172a]/50 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-confirmed-title"
        data-ui="email-confirmed"
        className="relative w-full max-w-sm rounded-[24px] bg-white p-6 text-center shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          data-tip="Close"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6e6e73] hover:bg-black/5 hover:text-[#0f172a]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#0d9488]" aria-hidden="true" />
        <h2 id="email-confirmed-title" className="mt-3 font-display text-xl font-bold text-[#0f172a]">
          Email confirmed. You’re signed in.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#424245]">
          Thanks for confirming <strong className="break-all text-[#0f172a]">{user.email}</strong>.
          Your RoleReady account is ready, and your practice sessions will be saved here.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            data-tip="Upload your resume and a job spec to get your questions"
            onClick={() => {
              setOpen(false);
              navigate('/new');
            }}
            className="btn-pill-primary min-h-[46px] w-full px-6 py-3 text-sm font-semibold"
          >
            Start my first practice
          </button>
          <button data-tip="Close this message"
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-[42px] w-full rounded-full text-sm font-semibold text-[#6e6e73] hover:text-[#0f172a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
