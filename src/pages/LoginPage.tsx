import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import type { ApiError } from '@contracts';
import { useAuth } from '../context/AuthContext';
import { toApiError } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';

export const LoginPage: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  if (user) {
    return <Navigate to="/history" replace />;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/history', { replace: true });
    } catch (err) {
      setError(
        toApiError(
          err,
          'unauthorized',
          mode === 'signin'
            ? 'Could not sign in with those credentials.'
            : 'Could not create your account.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#f2f4f7] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left column: Product identity + real interface preview */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="1" y="1" width="22" height="22" rx="5" fill="#141414" />
              <path
                d="M7.5 16.5V7.5H12.2C13.9 7.5 15 8.4 15 9.9C15 11.1 14.2 11.9 13 12.2L15.3 16.5H13.3L11.2 12.4H9.3V16.5H7.5ZM9.3 10.9H12C12.8 10.9 13.2 10.5 13.2 9.9C13.2 9.3 12.8 8.9 12 8.9H9.3V10.9Z"
                fill="#ffffff"
              />
              <circle cx="17.5" cy="7.5" r="2" fill="#1d5fbf" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-[#0a0a0a]">
              RoleReady
            </span>
          </div>

          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#0a0a0a] sm:text-[24px]">
            Resume-grounded interview practice
          </h1>

          <p className="text-sm leading-relaxed text-[#5a6069]">
            Upload your resume PDF and paste the job posting. RoleReady numbers your resume achievements (R1..Rn), extracts the role requirements (J1..Jn), and grades each typed answer against the evidence you actually have.
          </p>

          {/* Real interface specimen (data-ui) showing the R/J citation ledger */}
          <div
            data-ui="true"
            className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-4"
          >
            <div className="flex items-center justify-between border-b border-[#eef0f3] pb-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-[#0a0a0a]">Q1</span>
                <span className="rounded-[4px] bg-[#eaecef] px-2 py-0.5 text-[#383c42]">
                  Behavioural
                </span>
              </div>
              <span className="num font-medium text-[#04250e] bg-[#dcfae5] border border-[#b7e4c7] rounded-[4px] px-2 py-0.5">
                94 / 100 · Strong
              </span>
            </div>

            <p className="mt-2.5 text-sm font-medium leading-relaxed text-[#0a0a0a]">
              “Walk me through how you built the Looker churn-risk dashboard for those 40 account managers at PayPulse. How did you decide which signals to include?”
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#5a6069]">Citations:</span>
              <span className="rounded-[4px] border border-[#1d5fbf]/35 bg-[#1d5fbf]/10 px-1.5 py-0.5 font-mono text-[#1d5fbf]">
                R4 · Looker churn dashboard (-14% churn)
              </span>
              <span className="rounded-[4px] border border-[#cfd5de] bg-[#eaecef] px-1.5 py-0.5 font-mono text-[#383c42]">
                J4 · Commercial BI adoption
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Sign in / Create account card */}
        <div className="lg:col-span-5">
          <div className="rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-6">
            {/* Segmented control */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mb-5 grid grid-cols-2 rounded-[6px] bg-[#e8ecf1] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`min-h-[32px] rounded-[4px] py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] ${
                  mode === 'signin'
                    ? 'bg-[#ffffff] text-[#0a0a0a]'
                    : 'text-[#5a6069] hover:text-[#0a0a0a]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`min-h-[32px] rounded-[4px] py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] ${
                  mode === 'signup'
                    ? 'bg-[#ffffff] text-[#0a0a0a]'
                    : 'text-[#5a6069] hover:text-[#0a0a0a]'
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-sm font-medium text-[#0a0a0a]"
                >
                  Email address
                </label>
                <input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="alex.rivera@paypulse.io"
                  className="mt-1.5 min-h-[38px] w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
                />
              </div>

              <div>
                <label
                  htmlFor="password-input"
                  className="block text-sm font-medium text-[#0a0a0a]"
                >
                  Password (minimum 6 characters)
                </label>
                <input
                  id="password-input"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  placeholder="••••••••"
                  className="mt-1.5 min-h-[38px] w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
                />
              </div>

              {error && (
                <ErrorBanner error={error} onRetry={() => handleSubmit()} />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#141414] px-4 py-2 text-sm font-medium text-[#ffffff] transition hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>
                      {mode === 'signin'
                        ? 'Signing in…'
                        : 'Creating account…'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin' ? 'Sign in' : 'Create account'}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-[#eef0f3] pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-xs font-medium text-[#5a6069] hover:text-[#0a0a0a] focus:outline-none focus-visible:underline"
              >
                {mode === 'signin'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
