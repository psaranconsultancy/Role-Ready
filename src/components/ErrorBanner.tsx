import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import type { ApiError } from '@contracts';

interface ErrorBannerProps {
  error: ApiError | string | null;
  onRetry?: () => void;
  retryLabel?: string;
}

const CODE_LABELS: Record<ApiError['error']['code'], string> = {
  bad_request: 'Invalid input',
  unauthorized: 'Authentication required',
  not_found: 'Not found',
  llm_failed: 'AI service unavailable',
  parse_failed: 'Resume parsing failed',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  retryLabel = 'Try again',
}) => {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.error.message;
  const code = typeof error === 'string' ? null : error.error.code;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <div className="text-sm">
            {code && (
              <span className="mr-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-800">
                {CODE_LABELS[code] || code}
              </span>
            )}
            <span className="font-medium">{message}</span>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

