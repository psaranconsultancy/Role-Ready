import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, History, LogOut, Loader2 } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-[#e2e5ea] bg-[#ffffff]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#0a0a0a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] rounded-[6px]"
          >
            {/* Custom SVG monogram mark drawn for RoleReady (R1/J1 citation brackets) */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect
                x="1"
                y="1"
                width="22"
                height="22"
                rx="5"
                fill="#141414"
              />
              <path
                d="M7.5 16.5V7.5H12.2C13.9 7.5 15 8.4 15 9.9C15 11.1 14.2 11.9 13 12.2L15.3 16.5H13.3L11.2 12.4H9.3V16.5H7.5ZM9.3 10.9H12C12.8 10.9 13.2 10.5 13.2 9.9C13.2 9.3 12.8 8.9 12 8.9H9.3V10.9Z"
                fill="#ffffff"
              />
              <circle cx="17.5" cy="7.5" r="2" fill="#1d5fbf" />
            </svg>
            <span>RoleReady</span>
          </Link>
          <span
            aria-hidden="true"
            className="hidden sm:inline-block text-xs text-[#cfd5de]"
          >
            /
          </span>
          <span className="hidden sm:inline-block text-xs text-[#5a6069]">
            Interview Ledger
          </span>
        </div>

        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-1.5">
          <Link
            to="/new"
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] ${
              isNewActive
                ? 'bg-[#e8ecf1] font-medium text-[#0a0a0a]'
                : 'text-[#5a6069] hover:bg-[#f2f4f7] hover:text-[#0a0a0a]'
            }`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New session</span>
          </Link>

          <Link
            to="/history"
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] ${
              isHistoryActive
                ? 'bg-[#e8ecf1] font-medium text-[#0a0a0a]'
                : 'text-[#5a6069] hover:bg-[#f2f4f7] hover:text-[#0a0a0a]'
            }`}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            <span>History</span>
          </Link>

          <div className="ml-1 border-l border-[#e2e5ea] pl-2 sm:ml-2 sm:pl-3 flex items-center gap-2">
            <span
              className="hidden md:inline-block max-w-[160px] truncate text-xs text-[#5a6069]"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-2.5 py-1 text-xs font-medium text-[#0a0a0a] hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5 text-[#5a6069]" aria-hidden="true" />
              )}
              <span>Sign out</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
