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
  llm_failed: 'Scoring service error',
  parse_failed: 'Resume parse failed',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  retryLabel = 'Retry',
}) => {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.error.message;
  const code = typeof error === 'string' ? null : error.error.code;

  return (
    <div
      role="alert"
      className="rounded-[8px] border border-[#f5c2c0] bg-[#ffedea] p-3.5 text-[#831c1e]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-[#c4242a]"
            aria-hidden="true"
          />
          <div className="text-sm">
            {code && (
              <span className="mr-2 inline-block rounded-[4px] border border-[#e5a4a1] bg-[#ffffff] px-1.5 py-0.5 text-xs font-medium text-[#831c1e]">
                {CODE_LABELS[code] || code}
              </span>
            )}
            <span>{message}</span>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 self-start rounded-[6px] border border-[#d6918e] bg-[#ffffff] px-3 py-1 text-xs font-medium text-[#831c1e] transition hover:bg-[#fff6f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#831c1e] sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
