import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Briefcase className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            RoleReady
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Practice 6 tailored interview questions grounded in your own resume and target job description.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Toggle tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
              className={`rounded-lg py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-slate-700"
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
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Password (min 6 characters)
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
              />
            </div>

            {error && (
              <ErrorBanner error={error} onRetry={() => handleSubmit()} />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:underline"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Highlights */}
        <ul className="mt-6 space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-indigo-600"
              aria-hidden="true"
            />
            <span>Every question cites your resume lines (R1..Rn) & JD requirements (J1..Jn)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-indigo-600"
              aria-hidden="true"
            />
            <span>Instant 0–100 evidence-checked scoring + stronger rewrite</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

