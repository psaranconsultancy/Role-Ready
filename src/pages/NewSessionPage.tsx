import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import type { ApiError } from '@contracts';
import {
  createSession,
  parseResume,
  generateQuestions,
  toApiError,
} from '../lib/api';
import {
  SAMPLE_JD_TEXT,
  SAMPLE_ROLE_TITLE,
  SAMPLE_COMPANY,
} from '../mocks/fixtures';
import { ErrorBanner } from '../components/ErrorBanner';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jdText, setJdText] = useState('');

  const [prepStep, setPrepStep] = useState<
    'idle' | 'reading_resume' | 'writing_questions'
  >('idle');
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const jdLength = jdText.trim().length;
  const isJdValid = jdLength >= 200;
  const canSubmit =
    Boolean(file) && !fileValidationError && isJdValid && prepStep === 'idle';

  const validateAndSetFile = (candidate: File | null) => {
    setApiError(null);
    if (!candidate) {
      setFile(null);
      setFileValidationError(null);
      return;
    }

    const isPdf =
      candidate.type === 'application/pdf' ||
      candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFile(null);
      setFileValidationError(
        'Invalid file format. Please upload a PDF file (.pdf).'
      );
      return;
    }

    if (candidate.size > 5 * 1024 * 1024) {
      setFile(null);
      setFileValidationError(
        'File is too large. Resume PDF must be 5 MB or smaller.'
      );
      return;
    }

    setFileValidationError(null);
    setFile(candidate);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (prepStep !== 'idle') return;
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleFillSample = () => {
    setRoleTitle(SAMPLE_ROLE_TITLE);
    setCompany(SAMPLE_COMPANY);
    setJdText(SAMPLE_JD_TEXT);
    if (!file) {
      const dummyPdfContent = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
      ]);
      const sampleFile = new File(
        [dummyPdfContent],
        'alex-rivera-product-analyst-resume.pdf',
        {
          type: 'application/pdf',
        }
      );
      validateAndSetFile(sampleFile);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file || !isJdValid || prepStep !== 'idle') return;

    setApiError(null);
    setPrepStep('reading_resume');

    try {
      const session = await createSession({
        file,
        jdText,
        roleTitle: roleTitle.trim() || undefined,
        company: company.trim() || undefined,
      });

      await parseResume(session.id);

      setPrepStep('writing_questions');
      await generateQuestions(session.id);

      navigate(`/session/${session.id}`);
    } catch (err) {
      setPrepStep('idle');
      setApiError(
        toApiError(
          err,
          'parse_failed',
          'Could not prepare your interview session. Please try again.'
        )
      );
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[#0a0a0a]">
            New interview session
          </h1>
          <p className="mt-0.5 text-sm text-[#5a6069]">
            Upload your resume PDF and paste the job description to generate 6 grounded questions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          disabled={prepStep !== 'idle'}
          className="inline-flex min-h-[34px] items-center gap-1.5 self-start rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-1.5 text-xs font-medium text-[#0a0a0a] transition hover:bg-[#e8ecf1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] disabled:opacity-50 sm:self-auto"
        >
          <span>Load sample resume & JD</span>
        </button>
      </div>

      {/* Two-step progress panel when generating */}
      {prepStep !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-5"
        >
          <div className="flex items-center gap-3">
            <Loader2
              className="h-5 w-5 animate-spin text-[#1d5fbf]"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-medium text-[#0a0a0a]">
                Preparing your interview session…
              </h2>
              <p className="text-xs text-[#5a6069]">
                Mapping resume evidence (R1..Rn) against job requirements (J1..Jn)
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 divide-y divide-[#e2e5ea] overflow-hidden rounded-[6px] border border-[#e2e5ea] bg-[#f8f9fb] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div
              className={`flex items-center gap-3 p-3.5 ${
                prepStep === 'reading_resume'
                  ? 'bg-[#ffffff] text-[#0a0a0a]'
                  : 'text-[#247b50]'
              }`}
            >
              {prepStep === 'reading_resume' ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-[#1d5fbf]"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#247b50]"
                  aria-hidden="true"
                />
              )}
              <div className="text-xs">
                <div className="font-medium">Reading your resume…</div>
                <div className="text-[#5a6069]">
                  Extracting numbered lines R1..Rn and 5–10 JD requirements
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3.5 ${
                prepStep === 'writing_questions'
                  ? 'bg-[#ffffff] text-[#0a0a0a]'
                  : 'text-[#5a6069]'
              }`}
            >
              {prepStep === 'writing_questions' ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-[#1d5fbf]"
                  aria-hidden="true"
                />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[#cfd5de]" />
              )}
              <div className="text-xs">
                <div className="font-medium">Writing your questions…</div>
                <div className="text-[#5a6069]">
                  Building 6 mixed-type prompts with R/J citations
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleGenerate}
        className="space-y-5 rounded-[8px] border border-[#e2e5ea] bg-[#ffffff] p-5 sm:p-6"
        noValidate
      >
        {/* Resume PDF Upload */}
        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="resume-upload-input"
              className="block text-sm font-medium text-[#0a0a0a]"
            >
              Resume PDF
            </label>
            <span className="text-xs text-[#5a6069]">
              Required · .pdf up to 5 MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            id="resume-upload-input"
            type="file"
            accept=".pdf,application/pdf"
            disabled={prepStep !== 'idle'}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              validateAndSetFile(selected);
            }}
            className="sr-only"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (prepStep === 'idle') setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-2 flex flex-col items-center justify-center rounded-[6px] border border-dashed p-5 text-center transition ${
              isDragging
                ? 'border-[#1d5fbf] bg-[#1d5fbf]/5'
                : file
                  ? 'border-[#b7e4c7] bg-[#dcfae5]/30'
                  : fileValidationError
                    ? 'border-[#f5c2c0] bg-[#ffedea]/40'
                    : 'border-[#cfd5de] bg-[#f8f9fb] hover:border-[#0a0a0a]'
            }`}
          >
            {file ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <FileText
                  className="h-4 w-4 text-[#247b50]"
                  aria-hidden="true"
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-[#0a0a0a]">
                    {file.name}
                  </div>
                  <div className="num text-xs text-[#5a6069]">
                    {Math.max(1, Math.round(file.size / 1024))} KB · PDF verified
                  </div>
                </div>
                <button
                  type="button"
                  disabled={prepStep !== 'idle'}
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  aria-label="Remove selected PDF"
                  className="ml-2 inline-flex min-h-[28px] items-center gap-1 rounded-[4px] border border-[#cfd5de] bg-[#ffffff] px-2 py-0.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f2f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a]"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  <span>Change</span>
                </button>
              </div>
            ) : (
              <>
                <Upload
                  className="h-5 w-5 text-[#5a6069]"
                  aria-hidden="true"
                />
                <div className="mt-2 text-sm text-[#0a0a0a]">
                  Drop your resume PDF here, or{' '}
                  <button
                    type="button"
                    disabled={prepStep !== 'idle'}
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium underline hover:text-[#1d5fbf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] rounded-[4px]"
                  >
                    browse files
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#5a6069]">
                  Extracts numbered lines R1..Rn for evidence grounding
                </p>
              </>
            )}
          </div>

          {fileValidationError && (
            <p role="alert" className="mt-2 text-xs font-medium text-[#c4242a]">
              {fileValidationError}
            </p>
          )}
        </div>

        {/* Optional Role Title & Company */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="role-title-input"
              className="block text-xs font-medium text-[#0a0a0a]"
            >
              Role title <span className="font-normal text-[#5a6069]">(optional)</span>
            </label>
            <input
              id="role-title-input"
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              disabled={prepStep !== 'idle'}
              placeholder="Senior Product Analyst"
              className="mt-1.5 min-h-[38px] w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
            />
          </div>

          <div>
            <label
              htmlFor="company-input"
              className="block text-xs font-medium text-[#0a0a0a]"
            >
              Company <span className="font-normal text-[#5a6069]">(optional)</span>
            </label>
            <input
              id="company-input"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={prepStep !== 'idle'}
              placeholder="FinFlow"
              className="mt-1.5 min-h-[38px] w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
            />
          </div>
        </div>

        {/* Job Description */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label
              htmlFor="jd-textarea"
              className="block text-sm font-medium text-[#0a0a0a]"
            >
              Target job description
            </label>
            <span
              className={`num text-xs ${
                jdLength > 0 && jdLength < 200
                  ? 'text-[#92400e]'
                  : isJdValid
                    ? 'text-[#247b50]'
                    : 'text-[#5a6069]'
              }`}
            >
              {jdLength} chars (minimum 200)
            </span>
          </div>

          <textarea
            id="jd-textarea"
            rows={8}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            disabled={prepStep !== 'idle'}
            placeholder="Paste the responsibilities and requirements from the job posting (at least 200 characters)..."
            className="mt-2 w-full rounded-[6px] border border-[#cfd5de] bg-[#ffffff] p-3 text-sm leading-relaxed text-[#0a0a0a] placeholder:text-[#5a6069] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] disabled:bg-[#f2f4f7]"
          />

          {jdLength > 0 && jdLength < 200 && (
            <p className="num mt-1.5 text-xs text-[#92400e]">
              Add {200 - jdLength} more character
              {200 - jdLength === 1 ? '' : 's'} to extract J1..Jn requirements.
            </p>
          )}
        </div>

        {apiError && (
          <ErrorBanner error={apiError} onRetry={() => handleGenerate()} />
        )}

        <div className="flex items-center justify-end border-t border-[#eef0f3] pt-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-[38px] w-full sm:w-auto items-center justify-center gap-2 rounded-[6px] bg-[#141414] px-5 py-2 text-sm font-medium text-[#ffffff] transition hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {prepStep !== 'idle' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>
                  {prepStep === 'reading_resume'
                    ? 'Reading your resume…'
                    : 'Writing your questions…'}
                </span>
              </>
            ) : (
              <span>Generate my interview</span>
            )}
          </button>
        </div>
      </form>
    </main>
  );
};
