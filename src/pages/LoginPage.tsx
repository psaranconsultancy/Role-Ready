import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import type { ApiError } from '@contracts';
import { useAuth } from '../context/AuthContext';
import { isMockMode, toApiError } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { Logo } from '../components/Logo';

export const LoginPage: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signInDemo } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('alex.rivera@example.com');
  const [password, setPassword] = useState('interview2025');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  if (!authLoading && user) {
    return <Navigate to="/history" replace />;
  }

  const runAuthAction = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/history');
    } catch (err) {
      setError(toApiError(err, 'unauthorized'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAuthAction();
  };

  const mockActive = isMockMode();

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] flex-col justify-center bg-[#f5f5f7] px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto grid w-full max-w-[1024px] gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Studio Showcase */}
        <div className="bento-card-dark relative overflow-hidden p-7 text-[#f5f5f7] sm:p-10 lg:col-span-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0071e3]/25 blur-3xl"
          />

          <div className="relative z-10">
            <Logo theme="dark" size="md" showBadge />

            <h1 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight text-[#f5f5f7] sm:text-4xl">
              Practise every question with your own evidence in view.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              RoleReady pairs your resume PDF with any job description to craft
              six targeted interview questions and grade your answers like a
              hiring manager.
            </p>

            <ul className="mt-7 space-y-3.5 text-sm text-[#d2d2d7]">
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#30d158]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-white">
                    Verbatim citations:
                  </strong>{' '}
                  Every question links to <code className="font-mono text-xs text-[#2997ff]">R1..Rn</code> resume lines and <code className="font-mono text-xs text-[#30d158]">J1..Jn</code> role requirements.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#30d158]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-white">
                    0–100 hiring-manager rubric:
                  </strong>{' '}
                  Scored on Relevance, Specificity, Structure, and Evidence.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#30d158]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-white">
                    Stronger rewrite &amp; claim check:
                  </strong>{' '}
                  Flags unverified claims and writes a tighter STAR response.
                </span>
              </li>
            </ul>

            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-[#86868b]">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-medium text-[#2997ff] hover:underline"
              >
                <span>Back to product overview</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Bento Card */}
        <div className="bento-card-light p-6 sm:p-10 lg:col-span-6">
          {mockActive && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-medium text-[#1d1d1f]">
              <span
                className="h-2 w-2 rounded-full bg-[#30d158]"
                aria-hidden="true"
              />
              <span>Demo mode · sample data, nothing is saved to a server</span>
            </div>
          )}

          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1d1d1f]">
            {mode === 'signin'
              ? 'Sign in to RoleReady'
              : 'Create your RoleReady account'}
          </h2>
          <p className="mt-1 text-sm text-[#6e6e73]">
            Access your saved interview sessions, scores, and tailored feedback.
          </p>

          {/* One-Click Demo User Button */}
          {mockActive && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={demoLoading || submitting}
                className="btn-pill-primary min-h-[46px] w-full px-6 py-3 text-sm font-semibold shadow-sm disabled:opacity-60"
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
                <span className="bg-white px-3 text-xs font-medium text-[#86868b]">
                  or use your email
                </span>
                <div className="w-full border-t border-black/10" />
              </div>
            </div>
          )}

          {/* Segmented Pill Tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-4 grid grid-cols-2 rounded-full bg-[#f5f5f7] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`min-h-[38px] rounded-full text-xs font-semibold transition ${
                mode === 'signin'
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
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
              className={`min-h-[38px] rounded-full text-xs font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
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
                className="block text-xs font-semibold text-[#1d1d1f]"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-4 py-2.5 text-base text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#1d1d1f]"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-4 py-2.5 text-base text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || demoLoading}
              className={`min-h-[46px] w-full rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-60 ${
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

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[#86868b]">
            <Lock className="h-3.5 w-3.5 text-[#30d158]" aria-hidden="true" />
            <span>Your resume and interview responses remain private.</span>
          </p>
        </div>
      </div>
    </main>
  );
};
