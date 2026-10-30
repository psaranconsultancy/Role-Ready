import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import type { ApiError } from '@contracts';

interface ErrorBannerProps {
  error: ApiError | string | null;
  onRetry?: () => void;
  retryLabel?: string;
}

const ERROR_TITLES: Record<ApiError['error']['code'], string> = {
  bad_request: 'Check your input',
  unauthorized: 'Please sign in again',
  parse_failed: "We couldn't read that PDF",
  llm_failed: 'The coach didn\'t respond in time',
  not_found: 'Session not found',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  retryLabel = 'Try again',
}) => {
  if (!error) return null;

  const isStructured = typeof error !== 'string' && 'error' in error;
  const code = isStructured ? error.error.code : null;
  const title = code ? ERROR_TITLES[code] : 'Something went wrong';
  const message = isStructured ? error.error.message : error;

  return (
    <div
      data-ui="error-banner"
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 rounded-[18px] border border-[#ff453a]/30 bg-[#fff5f5] p-4 text-[#0f172a] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff453a]/15 text-[#d70015]">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-[#0f172a]">
              {title}
            </p>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-[#6e6e73]">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-[#0f172a] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#333336] sm:self-center"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};
