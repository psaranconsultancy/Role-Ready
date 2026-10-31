import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import type { ApiError } from '@contracts';
import { useAuth } from '../context/AuthContext';
import { isMockMode, toApiError } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { Logo } from '../components/Logo';
import { AmbientHeroCanvas } from '../components/AmbientHeroCanvas';
import { PasswordInput } from '../components/PasswordInput';
import { emailProblem } from '../lib/validation';
import { CheckInbox } from '../components/CheckInbox';
import { authLinkResult } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signInDemo } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // Boxes start empty; the sample details are grey hint text that goes as soon as you type.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ email: string; reason: 'signup' | 'signin' } | null>(null);
  const linkError = authLinkResult?.kind === 'link_error' ? authLinkResult.message : null;

  if (!authLoading && user) {
    return <Navigate to="/history" replace />;
  }

  const runAuthAction = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (await signUp(email, password)) {
        setPending({ email: email.trim(), reason: 'signup' });
        return;
      }
      navigate('/history');
    } catch (err) {
      const apiErr = toApiError(err, 'unauthorized');
      if (mode === 'signin' && /not confirmed/i.test(apiErr.error.message)) {
        setPending({ email: email.trim(), reason: 'signin' });
        return;
      }
      setError(apiErr);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await signInDemo();
      navigate('/history');
    } catch (err) {
      setError(toApiError(err, 'bad_request'));
    } finally {
      setDemoLoading(false);
    }
  };

  // Check the boxes before calling the server, so a typo gets a clear,
  // field-level message instead of a vague sign-in error.
  const checkFields = () => {
    const eProblem = emailProblem(email);
    let pProblem: string | null = null;
    if (!password) pProblem = 'Please enter your password.';
    else if (mode === 'signup' && password.length < 6)
      pProblem = 'Use at least 6 characters for your password.';
    setEmailError(eProblem);
    setPasswordError(pProblem);
    if (eProblem) document.getElementById('auth-email')?.focus();
    else if (pProblem) document.getElementById('auth-password')?.focus();
    return !eProblem && !pProblem;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkFields()) return;
    await runAuthAction();
  };

  const mockActive = isMockMode();

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] flex-col justify-center bg-[#f1f5f9] px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto grid w-full max-w-[1024px] gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Studio Showcase with Ambient Motion + Confidence Visual */}
        <div className="bento-card-dark relative overflow-hidden p-7 text-[#f8fafc] sm:p-10 lg:col-span-6">
          <AmbientHeroCanvas
            backdropImage="/assets/img/hero-candidate-focus.jpg"
            videoOpacity={0.42}
          />
          <div className="relative z-10">
            <Logo theme="dark" size="md" />

            <h1 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight text-[#f8fafc] sm:text-4xl">
              Practise every question with your own resume in view
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#d2d2d7] sm:text-base">
              RoleReady pairs your PDF resume with the job description to write
              six targeted interview questions and score your answers.
            </p>

            <div className="visual-media-frame mt-6 h-44 w-full border border-white/15">
              <img
                src="/assets/img/feature-calm-interview.jpg"
                alt="Confident candidate speaking with hiring leaders in a calm glass room"
                loading="eager"
                decoding="async"
                className="visual-media-img"
              />
              <div className="visual-media-scrim" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-md">
                <span>Rehearse in private until your delivery feels natural</span>
                <span className="shrink-0 font-semibold text-[#14b8a6]">
                  6 questions
                </span>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-[#d2d2d7]">
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#14b8a6]"
                  aria-hidden="true"
                />
                <span>
                  Every question shows the exact line from your resume and the
                  job requirement it tests.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#14b8a6]"
                  aria-hidden="true"
                />
                <span>
                  Your answers get a score out of 100 for Relevance, Evidence,
                  Structure, and Impact.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#14b8a6]"
                  aria-hidden="true"
                />
                <span>
                  Each scorecard flags claims that are not on your resume and
                  gives you a stronger example answer to practise.
                </span>
              </li>
            </ul>

            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-[#86868b]">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-medium text-[#38bdf8] hover:underline"
              >
                <span>Back to product overview</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Bento Card */}
        <div
          data-ui="auth-card"
          className="bento-card-light order-first p-6 sm:p-10 lg:order-none lg:col-span-6"
        >
          {mockActive && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f1f5f9] px-3.5 py-1.5 text-xs font-medium text-[#0f172a]">
              <span
                className="h-2 w-2 rounded-full bg-[#14b8a6]"
                aria-hidden="true"
              />
              <span>Demo mode with sample data (stored in your browser)</span>
            </div>
          )}

          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0f172a]">
            {mode === 'signin'
              ? 'Sign in to RoleReady'
              : 'Create your RoleReady account'}
          </h2>
          <p className="mt-1 text-sm text-[#6e6e73]">
            Open your saved interview sessions, scores, and rewrites.
          </p>

          {/* One-Click Demo User Button (mock user, or anonymous Supabase user) */}
          {(
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={demoLoading || submitting}
                className="btn-pill-primary min-h-[46px] w-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {demoLoading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Signing in as demo user…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Continue as demo user</span>
                  </>
                )}
              </button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-black/10" />
                <span className=" shrink-0 bg-white px-3 text-xs font-medium text-[#86868b]">
                  or use your email
                </span>
                <div className="w-full border-t border-black/10" />
              </div>
            </div>
          )}

          {linkError && !pending && (
            <p role="alert" className="mb-2 rounded-2xl border border-[#b45309]/25 bg-[#fffbeb] px-4 py-3 text-xs leading-relaxed text-[#92400e]">
              {linkError} Sign in below and we’ll offer to send you a fresh link if your
              email still needs confirming.
            </p>
          )}

          {pending ? (
            <CheckInbox
              email={pending.email}
              reason={pending.reason}
              onBack={() => {
                setPending(null);
                setError(null);
              }}
            />
          ) : (
          <>
          {/* Segmented Pill Tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-4 grid grid-cols-2 rounded-full bg-[#f1f5f9] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setPasswordError(null);
                setError(null);
              }}
              className={`min-h-[38px] rounded-full text-xs font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#0f172a]'
                  : 'text-[#6e6e73] hover:text-[#0f172a]'
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
                setPasswordError(null);
                setError(null);
              }}
              className={`min-h-[38px] rounded-full text-xs font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#0f172a]'
                  : 'text-[#6e6e73] hover:text-[#0f172a]'
              }`}
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="mt-5">
              <ErrorBanner error={error} onRetry={runAuthAction} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[#0f172a]"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'auth-email-error' : undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="alex.rivera@roleready.app"
                className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 aria-[invalid=true]:border-[#d70015] bg-[#f1f5f9]/60 px-4 py-2.5 text-base text-[#0f172a] placeholder:text-[#aeaeb2] focus:border-[#0284c7] focus:bg-white focus:outline-none"
              />
              {emailError && (
                <p id="auth-email-error" role="alert" className="mt-1.5 text-xs font-medium text-[#d70015]">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#0f172a]"
              >
                Password
              </label>
              <PasswordInput
                id="auth-password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                required
                minLength={mode === 'signup' ? 6 : undefined}
                maxLength={72}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'auth-password-error' : 'auth-password-hint'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••••••"
                className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 aria-[invalid=true]:border-[#d70015] bg-[#f1f5f9]/60 px-4 py-2.5 text-base text-[#0f172a] placeholder:text-[#aeaeb2] focus:border-[#0284c7] focus:bg-white focus:outline-none"
              />
              {passwordError ? (
                <p id="auth-password-error" role="alert" className="mt-1.5 text-xs font-medium text-[#d70015]">
                  {passwordError}
                </p>
              ) : (
                mode === 'signup' && (
                  <p id="auth-password-hint" className="mt-1.5 text-xs text-[#6e6e73]">
                    At least 6 characters.
                  </p>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || demoLoading}
              className={`min-h-[46px] w-full rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                mockActive
                  ? 'btn-pill-secondary-light'
                  : 'btn-pill-primary'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </span>
                </>
              ) : (
                <span>
                  {mode === 'signin' ? 'Sign in with email' : 'Create account'}
                </span>
              )}
            </button>
          </form>
          </>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[#86868b]">
            <Lock className="h-3.5 w-3.5 text-[#14b8a6]" aria-hidden="true" />
            <span>Your resume and interview answers stay private.</span>
          </p>
        </div>
      </div>
    </main>
  );
};
