import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Sparkles,
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
  const canSubmit = Boolean(file) && !fileValidationError && isJdValid && prepStep === 'idle';

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
      const dummyPdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      const sampleFile = new File([dummyPdfContent], 'alex-rivera-product-analyst-resume.pdf', {
        type: 'application/pdf',
      });
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Start a new mock interview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload your resume PDF and paste the target job description to get 6 grounded questions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          disabled={prepStep !== 'idle'}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Fill sample resume & JD</span>
        </button>
      </div>

      {/* Preparing Progress Overlay Card when running */}
      {prepStep !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Loader2
              className="h-6 w-6 animate-spin text-indigo-600"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Preparing your tailored interview…
              </h2>
              <p className="text-xs text-slate-600">
                Matching your resume achievements against the role requirements
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                prepStep === 'reading_resume'
                  ? 'border-indigo-300 bg-indigo-50/70 text-indigo-950'
                  : 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
              }`}
            >
              {prepStep === 'reading_resume' ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-indigo-600"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              )}
              <div className="text-xs">
                <div className="font-semibold">Step 1: Reading your resume…</div>
                <div className="opacity-80">
                  Extracting numbered lines (R1..Rn) & JD requirements (J1..Jn)
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                prepStep === 'writing_questions'
                  ? 'border-indigo-300 bg-indigo-50/70 text-indigo-950'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              {prepStep === 'writing_questions' ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-indigo-600"
                  aria-hidden="true"
                />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold">
                  2
                </span>
              )}
              <div className="text-xs">
                <div className="font-semibold">
                  Step 2: Writing your questions…
                </div>
                <div className="opacity-80">
                  Drafting 6 mixed-type questions citing your exact experience
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleGenerate}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        noValidate
      >
        {/* Step 1: Resume PDF Upload */}
        <div>
          <label
            htmlFor="resume-upload-input"
            className="block text-sm font-semibold text-slate-900"
          >
            1. Resume PDF <span className="text-red-600">*</span>
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            PDF format only, maximum 5 MB. We extract lines R1..Rn to ground every question.
          </p>

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
            className={`mt-2.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60'
                : file
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : fileValidationError
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400'
            }`}
          >
            {file ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-500">
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
                  className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Change</span>
                </button>
              </div>
            ) : (
              <>
                <Upload
                  className="h-8 w-8 text-slate-400"
                  aria-hidden="true"
                />
                <div className="mt-2 text-sm font-medium text-slate-700">
                  Drag and drop your resume PDF here, or{' '}
                  <button
                    type="button"
                    disabled={prepStep !== 'idle'}
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-indigo-600 underline hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
                  >
                    browse files
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Only .pdf files up to 5 MB
                </p>
              </>
            )}
          </div>

          {fileValidationError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
              {fileValidationError}
            </p>
          )}
        </div>

        {/* Step 2: Optional Role Title & Company */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="role-title-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Role title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="role-title-input"
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              disabled={prepStep !== 'idle'}
              placeholder="e.g. Senior Product Analyst"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="company-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Company <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="company-input"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={prepStep !== 'idle'}
              placeholder="e.g. FinFlow"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Step 3: Job Description */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label
              htmlFor="jd-textarea"
              className="block text-sm font-semibold text-slate-900"
            >
              2. Target Job Description <span className="text-red-600">*</span>
            </label>
            <span
              className={`text-xs font-medium ${
                jdLength > 0 && jdLength < 200
                  ? 'text-amber-700'
                  : isJdValid
                    ? 'text-emerald-700'
                    : 'text-slate-500'
              }`}
            >
              {jdLength} characters (minimum 200)
            </span>
          </div>

          <textarea
            id="jd-textarea"
            rows={8}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            disabled={prepStep !== 'idle'}
            placeholder="Paste the responsibilities and requirements from the job posting here (at least 200 characters)..."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
          />

          {jdLength > 0 && jdLength < 200 && (
            <p className="mt-1.5 text-xs text-amber-700">
              Please add {200 - jdLength} more character
              {200 - jdLength === 1 ? '' : 's'} so we can extract 5–10 core requirements.
            </p>
          )}
        </div>

        {apiError && (
          <ErrorBanner error={apiError} onRetry={() => handleGenerate()} />
        )}

        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Generate my interview</span>
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
};
