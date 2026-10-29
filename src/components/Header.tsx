import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, LogOut, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isMockMode } from '../lib/api';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const { user, signOut, signInDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [startingDemo, setStartingDemo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  const handleTryDemo = async () => {
    if (user) {
      navigate('/history');
      return;
    }
    if (!isMockMode()) {
      navigate('/login');
      return;
    }
    setStartingDemo(true);
    try {
      await signInDemo();
      navigate('/history');
    } finally {
      setStartingDemo(false);
    }
  };

  const isHistory = location.pathname === '/history';
  const isNew = location.pathname === '/new';
  const isLanding = location.pathname === '/';

  return (
    <>
      <header
        id="globalnav"
        className="frosted-globalnav-dark sticky top-0 z-50 h-12 w-full text-[#f5f5f7]"
      >
        <div className="mx-auto flex h-full max-w-[1080px] items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex h-11 items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="RoleReady Home"
          >
            <Logo theme="dark" size="sm" showBadge />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 md:flex"
          >
            <Link
              to="/"
              aria-current={isLanding ? 'page' : undefined}
              className={`text-xs font-medium transition-colors ${
                isLanding
                  ? 'text-white underline decoration-[#0071e3] decoration-2 underline-offset-8'
                  : 'text-[#f5f5f7]/75 hover:text-white'
              }`}
            >
              Overview
            </Link>

            {user ? (
              <>
                <Link
                  to="/history"
                  aria-current={isHistory ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    isHistory
                      ? 'text-white underline decoration-[#0071e3] decoration-2 underline-offset-8'
                      : 'text-[#f5f5f7]/75 hover:text-white'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>History</span>
                </Link>
                <Link
                  to="/new"
                  aria-current={isNew ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    isNew
                      ? 'text-white underline decoration-[#0071e3] decoration-2 underline-offset-8'
                      : 'text-[#f5f5f7]/75 hover:text-white'
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>New Practice</span>
                </Link>
              </>
            ) : (
              <>
                <a
                  href="/#how-it-works"
                  className="text-xs font-medium text-[#f5f5f7]/75 transition-colors hover:text-white"
                >
                  How It Works
                </a>
                <a
                  href="/#grounded-architecture"
                  className="text-xs font-medium text-[#f5f5f7]/75 transition-colors hover:text-white"
                >
                  Grounded AI
                </a>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {isMockMode() && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 font-mono text-[11px] text-[#a1a1a6]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#30d158]"
                  aria-hidden="true"
                />
                Demo Mode
              </span>
            )}

            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/new"
                  className="btn-pill-primary px-3.5 py-1 text-xs font-semibold"
                >
                  New Session
                </Link>
                <span
                  className="max-w-[150px] truncate font-mono text-xs text-[#a1a1a6]"
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-[#f5f5f7] transition hover:bg-white/20 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-2.5 py-1 text-xs font-medium text-[#f5f5f7]/80 transition hover:text-white"
                >
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={handleTryDemo}
                  disabled={startingDemo}
                  className="btn-pill-primary px-3.5 py-1 text-xs font-semibold"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>{startingDemo ? 'Opening…' : 'Try the demo'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Action + Animated 2-Line Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Link
                to="/new"
                className="btn-pill-primary px-3 py-1 text-xs font-semibold"
              >
                New
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={startingDemo}
                className="btn-pill-primary px-3 py-1 text-xs font-semibold"
              >
                {startingDemo ? 'Opening…' : 'Try Demo'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`globalnav-toggle relative h-11 w-11 rounded-full ${
                mobileMenuOpen ? 'open' : ''
              }`}
            >
              <span className="nav-toggle-line line-1" />
              <span className="nav-toggle-line line-2" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Frosted Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 top-12 z-40 flex flex-col justify-between overflow-y-auto bg-black/95 px-6 py-8 text-[#f5f5f7] backdrop-blur-2xl md:hidden"
        >
          <div className="space-y-6">
            {isMockMode() && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-xs text-[#a1a1a6]">
                <span className="h-2 w-2 rounded-full bg-[#30d158]" />
                Demo mode · sample data ready
              </div>
            )}

            <nav className="flex flex-col divide-y divide-white/10">
              <Link
                to="/"
                className="flex items-center justify-between py-4 font-display text-2xl font-bold tracking-tight text-[#f5f5f7] hover:text-[#2997ff]"
              >
                <span>Overview</span>
                <ArrowRight className="h-5 w-5 text-[#86868b]" />
              </Link>
              {user ? (
                <>
                  <Link
                    to="/history"
                    className="flex items-center justify-between py-4 font-display text-2xl font-bold tracking-tight text-[#f5f5f7] hover:text-[#2997ff]"
                  >
                    <span>Practice History</span>
                    <ArrowRight className="h-5 w-5 text-[#86868b]" />
                  </Link>
                  <Link
                    to="/new"
                    className="flex items-center justify-between py-4 font-display text-2xl font-bold tracking-tight text-[#2997ff]"
                  >
                    <span>New Practice Session</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-between py-4 font-display text-2xl font-bold tracking-tight text-[#f5f5f7] hover:text-[#2997ff]"
                  >
                    <span>Sign In / Create Account</span>
                    <ArrowRight className="h-5 w-5 text-[#86868b]" />
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="pb-safe mt-8 border-t border-white/10 pt-6">
            {user ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#86868b]">
                    Signed in as
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-[#f5f5f7]">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="btn-pill-secondary-dark min-h-[44px] w-full text-sm font-semibold"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={startingDemo}
                className="btn-pill-primary min-h-[44px] w-full text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>
                  {startingDemo ? 'Starting demo…' : 'Try the demo — no sign-up'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
