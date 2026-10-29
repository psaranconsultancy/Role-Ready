import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, PlusCircle, History, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const isNewActive = location.pathname === '/new';
  const isHistoryActive = location.pathname === '/history';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          to="/history"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>RoleReady</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/new"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              isNewActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>New session</span>
          </Link>

          <Link
            to="/history"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              isHistoryActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            <span>History</span>
          </Link>

          <div className="ml-1 border-l border-slate-200 pl-2 sm:ml-2 sm:pl-3 flex items-center gap-2">
            <span
              className="hidden md:inline-block max-w-[160px] truncate text-xs text-slate-500"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>Sign out</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

