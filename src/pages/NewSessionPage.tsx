import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  ArrowLeft,
  ArrowRight,
  Link2,
  Plus,
} from 'lucide-react';
import type { ApiError } from '@contracts';
import {
  createSession,
  deleteSession,
  parseResume,
  generateQuestions,
  toApiError,
} from '../lib/api';
import {
  useSubscriptionTier,
  INDUSTRY_OPTIONS,
  DEPARTMENT_OPTIONS,
  SENIORITY_OPTIONS,
  NICHE_CATEGORY_OPTIONS,
  CSUITE_CATEGORY_OPTIONS,
} from '../lib/tiers';
import {
  SAMPLE_ROLE_TITLE,
  SAMPLE_COMPANY,
  SAMPLE_JD_TEXT,
} from '../mocks/fixtures';
import { ErrorBanner } from '../components/ErrorBanner';

type GenerationStage = 'idle' | 'parsing' | 'generating';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const extraContextFileRef = useRef<HTMLInputElement | null>(null);
  const { grillContext, updateGrillContext } = useSubscriptionTier();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [newContextLink, setNewContextLink] = useState('');

  const [fileError, setFileError] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [stage, setStage] = useState<GenerationStage>('idle');
  // Session made by an earlier attempt; a retry carries on with it instead of
  // creating another one (which would leave an empty draft in History).
  const [pending, setPending] = useState<{ id: string; parsed: boolean } | null>(null);
  useEffect(() => setPending(null), [file, jdText, roleTitle, company]);

  const validateAndSelectFile = (selected: File | null) => {
    setFileError(null);
    setApiError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const isPdf =
      selected.type === 'application/pdf' ||
      selected.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFile(null);
      setFileError('Only PDF files (.pdf) are supported.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setFileError('Resume PDF must be 5 MB or smaller.');
      return;
    }
    setFile(selected);
  };

  const handleLoadSample = async () => {
    setFileError(null);
    setJdError(null);
    setApiError(null);
    setRoleTitle(SAMPLE_ROLE_TITLE);
    setCompany(SAMPLE_COMPANY);
    setJdText(SAMPLE_JD_TEXT);
    try {
      // A real text PDF, so the sample also works against the live backend.
      const response = await fetch('/samples/alex-rivera-resume.pdf');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      setFile(
        new File([blob], 'Alex_Rivera_Product_Analyst_Resume.pdf', {
          type: 'application/pdf',
        })
      );
    } catch {
      setFileError('Could not load the sample resume. Please upload your own PDF.');
    }
  };

  const trimmedJdLength = jdText.trim().length;
  const isJdValid = trimmedJdLength >= 200;
  const canSubmit = Boolean(file) && isJdValid && stage === 'idle';

  const runPipeline = async () => {
    setFileError(null);
    setJdError(null);
    setApiError(null);

    if (!file) {
      setFileError('Please upload your resume as a PDF file.');
      return;
    }
    if (trimmedJdLength < 200) {
      setJdError(
        `Job description must be at least 200 characters (currently ${trimmedJdLength}).`
      );
      return;
    }

    let sessionId = pending?.id;
    try {
      setStage('parsing');
      if (!sessionId) {
        const created = await createSession({
          file,
          jdText,
          roleTitle: roleTitle.trim() || undefined,
          company: company.trim() || undefined,
        });
        sessionId = created.id;
        setPending({ id: sessionId, parsed: false });
      }

      if (!pending?.parsed) {
        await parseResume(sessionId);
        setPending({ id: sessionId, parsed: true });
      }

      setStage('generating');
      await generateQuestions(sessionId);

      navigate(`/session/${sessionId}`);
    } catch (err) {
      const apiErr = toApiError(
        err,
        'llm_failed',
        'Could not generate your interview session. Please retry.'
      );
      // An unreadable PDF needs a new upload: drop the empty draft so History stays clean.
      if (apiErr.error.code === 'parse_failed' && sessionId) {
        deleteSession(sessionId).catch(() => undefined);
        setPending(null);
      }
      setStage('idle');
      setApiError(apiErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPipeline();
  };

  const isBusy = stage !== 'idle';

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-[#f5f5f7] pb-20 text-[#1d1d1f]">
      {/* Sticky Local Sub-Navigation with Stepper */}
      <div className="frosted-localnav-light sticky top-12 z-30 h-[52px] w-full">
        <div className="mx-auto flex h-full max-w-[960px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">History</span>
            </Link>
            <span className="text-black/15" aria-hidden="true">
              /
            </span>
            <h1 className="font-display text-sm font-bold tracking-tight text-[#1d1d1f] sm:text-base">
              New practice session
            </h1>
          </div>

          {/* 2-Step Visual Stepper */}
          <div
            className="flex items-center gap-2 text-xs font-medium"
            aria-label="Session setup steps"
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                stage === 'idle'
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-[#30d158]/20 text-[#15803d]'
              }`}
            >
              <span className="font-bold tabular-nums">1</span>
              <span>Resume &amp; job</span>
            </span>
            <ArrowRight
              className="h-3 w-3 text-[#86868b]"
              aria-hidden="true"
            />
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                stage !== 'idle'
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-black/[0.05] text-[#6e6e73]'
              }`}
            >
              <span className="font-bold tabular-nums">2</span>
              <span>6 questions</span>
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[820px] px-4 pt-8 sm:px-6 sm:pt-12">
        {/* Header & Sample Fill Action */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
              Set up your interview
            </h2>
            <p className="mt-1.5 text-sm text-[#6e6e73] sm:text-base">
              Upload your PDF resume and paste the job description to generate
              six questions tailored to both.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isBusy}
            className="btn-pill-secondary-light min-h-[40px] shrink-0 self-start px-4 py-2 text-xs font-semibold sm:self-auto"
          >
            <Sparkles
              className="h-3.5 w-3.5 text-[#0071e3]"
              aria-hidden="true"
            />
            <span>Use a sample resume &amp; job</span>
          </button>
        </div>

        {/* Confidence Preparation Studio Banner */}
        <div className="bento-card-light mb-8 grid overflow-hidden sm:grid-cols-12">
          <div className="visual-media-frame min-h-[160px] rounded-none sm:col-span-5">
            <img
              src="/assets/img/feature-evidence-mapping.jpg"
              alt="Prepared candidate reviewing resume lines and role requirements at a calm desk"
              loading="eager"
              decoding="async"
              className="visual-media-img"
            />
          </div>
          <div className="flex flex-col justify-center p-5 sm:col-span-7 sm:p-6">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#30d158]/15 px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
              Built from your own experience
            </span>
            <p className="mt-2 font-display text-base font-bold text-[#1d1d1f]">
              Every question comes from work you have already done
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">
              We match lines from your resume to the job
              description so you can rehearse concrete examples before you step
              into the interview.
            </p>
          </div>
        </div>

        {apiError && (
          <div className="mb-6">
            <ErrorBanner error={apiError} onRetry={runPipeline} />
          </div>
        )}

        {/* Staged Progress Panel when Parsing / Generating */}
        {isBusy && (
          <div
            role="status"
            aria-live="polite"
            className="bento-card-dark mb-8 p-6 text-[#f5f5f7] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="h-5 w-5 animate-spin text-[#2997ff]"
                aria-hidden="true"
              />
              <h3 className="font-display text-lg font-bold">
                {stage === 'parsing'
                  ? 'Reading your resume…'
                  : 'Writing your questions…'}
              </h3>
            </div>
            <p className="mt-1.5 text-xs text-[#a1a1a6] sm:text-sm">
              Reading your resume and matching it to what the job asks for.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  stage === 'parsing'
                    ? 'border-[#0071e3] bg-[#0071e3]/15'
                    : 'border-[#30d158]/40 bg-[#30d158]/10'
                }`}
              >
                {stage === 'parsing' ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-[#2997ff]"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[#30d158]"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p className="text-xs font-medium text-[#a1a1a6]">Part 1</p>
                  <p className="text-sm font-semibold text-white">
                    Reading your resume…
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  stage === 'generating'
                    ? 'border-[#0071e3] bg-[#0071e3]/15'
                    : 'border-white/10 bg-white/[0.04] opacity-60'
                }`}
              >
                {stage === 'generating' ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-[#2997ff]"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/30" />
                )}
                <div>
                  <p className="text-xs font-medium text-[#a1a1a6]">Part 2</p>
                  <p className="text-sm font-semibold text-white">
                    Writing your questions…
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* 1. Resume PDF Upload Bento Card */}
          <section
            data-ui="upload-card"
            className="bento-card-light p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="resume-upload"
                className="font-display text-lg font-bold text-[#1d1d1f]"
              >
                1. Resume PDF <span className="text-[#ff453a]">*</span>
              </label>
              <span className="text-xs font-medium text-[#86868b]">
                PDF only · Max 5 MB
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6e6e73]">
              We read your resume line by line so each question can point to
              the exact work you did.
            </p>

            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept=".pdf,application/pdf"
              disabled={isBusy}
              onChange={(e) =>
                validateAndSelectFile(e.target.files?.[0] ?? null)
              }
              className="sr-only"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isBusy) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (isBusy) return;
                  const dropped = e.dataTransfer.files?.[0] ?? null;
                  validateAndSelectFile(dropped);
                }}
                onClick={() => !isBusy && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload resume PDF file"
                className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-6 py-9 text-center transition-colors ${
                  dragOver
                    ? 'border-[#0071e3] bg-[#0071e3]/[0.06]'
                    : 'border-black/15 bg-[#f5f5f7]/70 hover:border-[#0071e3]/60 hover:bg-[#f5f5f7]'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#1d1d1f]">
                  Click to choose a PDF or drag and drop it here
                </p>
                <p className="mt-1 text-xs text-[#86868b]">
                  Single-column or two-column PDF resumes up to 5 MB
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[#30d158]/40 bg-[#30d158]/[0.08] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#30d158]/20 text-[#15803d]">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1d1d1f]">
                      {file.name}
                    </p>
                    <p className="text-xs tabular-nums text-[#6e6e73]">
                      {Math.max(1, Math.round(file.size / 1024))} KB · Ready to
                      read
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  aria-label="Remove selected resume PDF"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#1d1d1f] transition-colors hover:bg-black/10"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {fileError && (
              <p
                role="alert"
                className="mt-2.5 text-xs font-medium text-[#d70015]"
              >
                {fileError}
              </p>
            )}
          </section>

          {/* 2. Target Role & Company (Optional) */}
          <section className="bento-card-light p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-[#1d1d1f]">
              2. Role and company{' '}
              <span className="font-sans text-xs font-normal text-[#86868b]">
                (optional)
              </span>
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="role-title"
                  className="block text-xs font-semibold text-[#1d1d1f]"
                >
                  Role title
                </label>
                <input
                  id="role-title"
                  type="text"
                  disabled={isBusy}
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Product Analyst"
                  className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-4 py-2.5 text-base text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-xs font-semibold text-[#1d1d1f]"
                >
                  Company
                </label>
                <input
                  id="company-name"
                  type="text"
                  disabled={isBusy}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. FinFlow"
                  className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-4 py-2.5 text-base text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 3. Job Description Bento Card */}
          <section className="bento-card-light p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="jd-textarea"
                className="font-display text-lg font-bold text-[#1d1d1f]"
              >
                3. Job description <span className="text-[#ff453a]">*</span>
              </label>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tabular-nums ${
                  isJdValid
                    ? 'bg-[#30d158]/15 text-[#15803d]'
                    : 'bg-black/[0.05] text-[#6e6e73]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isJdValid ? 'bg-[#30d158]' : 'bg-[#86868b]'
                  }`}
                  aria-hidden="true"
                />
                {trimmedJdLength} / 200 characters
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6e6e73]">
              Paste the responsibilities and requirements from the job posting
              (at least 200 characters).
            </p>

            <textarea
              id="jd-textarea"
              rows={8}
              disabled={isBusy}
              value={jdText}
              onChange={(e) => {
                setJdText(e.target.value);
                if (jdError) setJdError(null);
              }}
              placeholder="Paste the full job description here (responsibilities, skills and tools)…"
              className="mt-4 block w-full rounded-[18px] border border-black/15 bg-[#f5f5f7]/60 p-4 text-base leading-relaxed text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
            />

            {jdError && (
              <p
                role="alert"
                className="mt-2.5 text-xs font-medium text-[#d70015]"
              >
                {jdError}
              </p>
            )}
          </section>

          {/* 4. Deep Context: Industry, Department, C-Suite Level, Uploads & Links */}
          <section
            data-ui="deep-context-card"
            className="bento-card-light p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[#1d1d1f]">
                4. Grill With Docs: go deeper with your own documents{' '}
                <span className="font-sans text-xs font-normal text-[#86868b]">
                  (optional)
                </span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#ff9f0a]/15 px-3 py-0.5 text-xs font-semibold text-[#b45309]">
                  Coming soon
                </span>
              </div>
            </div>
            <p id="deep-context-coming-soon" className="mt-1 text-xs text-[#6e6e73]">
              Coming soon, and optional: you don&apos;t need any of this for your
              six questions today. When it ships, you can pick your industry, department, seniority,
              specialist area and executive role, or attach presentations, case
              studies and company links. Grill With Docs will use them to ask
              tougher follow-up questions and build you a downloadable summary
              of your key decisions and the terms to know.
            </p>

            {/* Not built yet: shown as a preview, every control disabled */}
            <fieldset
              disabled
              aria-describedby="deep-context-coming-soon"
              className="min-w-0 cursor-not-allowed opacity-60"
            >
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="new-industry-select"
                  className="block text-xs font-semibold text-[#1d1d1f]"
                >
                  Industry
                </label>
                <select
                  id="new-industry-select"
                  disabled={isBusy}
                  value={grillContext.industry}
                  onChange={(e) =>
                    updateGrillContext({
                      ...grillContext,
                      industry: e.target.value,
                    })
                  }
                  className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-3.5 py-2 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white focus:outline-none"
                >
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-dept-select"
                  className="block text-xs font-semibold text-[#1d1d1f]"
                >
                  Department
                </label>
                <select
                  id="new-dept-select"
                  disabled={isBusy}
                  value={grillContext.department}
                  onChange={(e) =>
                    updateGrillContext({
                      ...grillContext,
                      department: e.target.value,
                    })
                  }
                  className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-3.5 py-2 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white focus:outline-none"
                >
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-seniority-select"
                  className="block text-xs font-semibold text-[#1d1d1f]"
                >
                  Seniority
                </label>
                <select
                  id="new-seniority-select"
                  disabled={isBusy}
                  value={grillContext.seniority}
                  onChange={(e) =>
                    updateGrillContext({
                      ...grillContext,
                      seniority: e.target.value,
                    })
                  }
                  className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-3.5 py-2 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white focus:outline-none"
                >
                  {SENIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dedicated Niche Category & Dedicated C-Suite Category */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#0071e3]/20 bg-[#0071e3]/[0.04] p-4">
                <label
                  htmlFor="new-niche-category-select"
                  className="block text-xs font-bold text-[#0071e3]"
                >
                  Specialist area
                </label>
                <select
                  id="new-niche-category-select"
                  disabled={isBusy}
                  value={grillContext.nicheCategory}
                  onChange={(e) =>
                    updateGrillContext({
                      ...grillContext,
                      nicheCategory: e.target.value,
                    })
                  }
                  className="mt-1.5 block min-h-[44px] w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none"
                >
                  {NICHE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-black/15 bg-[#f5f5f7] p-4">
                <label
                  htmlFor="new-csuite-category-select"
                  className="block text-xs font-bold text-[#1d1d1f]"
                >
                  Executive or board role
                </label>
                <select
                  id="new-csuite-category-select"
                  disabled={isBusy}
                  value={grillContext.cSuiteCategory}
                  onChange={(e) =>
                    updateGrillContext({
                      ...grillContext,
                      cSuiteCategory: e.target.value,
                    })
                  }
                  className="mt-1.5 block min-h-[44px] w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none"
                >
                  {CSUITE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="new-niche-focus"
                className="block text-xs font-semibold text-[#1d1d1f]"
              >
                Your specialist focus or first-90-days goal
              </label>
              <input
                id="new-niche-focus"
                type="text"
                disabled={isBusy}
                value={grillContext.nicheFocus}
                onChange={(e) =>
                  updateGrillContext({
                    ...grillContext,
                    nicheFocus: e.target.value,
                  })
                }
                placeholder="e.g. business payments, launching in new countries, AI products…"
                className="mt-1.5 block min-h-[44px] w-full rounded-2xl border border-black/15 bg-[#f5f5f7]/60 px-4 py-2.5 text-base text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Supplemental File Uploads */}
              <div className="rounded-2xl border border-black/10 bg-[#f5f5f7]/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1d1d1f]">
                    Extra files (presentations, reports, case studies)
                  </span>
                  <input
                    ref={extraContextFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (
                        f &&
                        !grillContext.uploadedFiles.includes(f.name)
                      ) {
                        updateGrillContext({
                          ...grillContext,
                          uploadedFiles: [
                            ...grillContext.uploadedFiles,
                            f.name,
                          ],
                        });
                      }
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => extraContextFileRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-semibold text-[#0071e3] hover:bg-[#0071e3]/20"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <span>Add file</span>
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {grillContext.uploadedFiles.map((fileName) => (
                    <span
                      key={fileName}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-[#1d1d1f]"
                    >
                      <span className="max-w-[180px] truncate">{fileName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateGrillContext({
                            ...grillContext,
                            uploadedFiles: grillContext.uploadedFiles.filter(
                              (f) => f !== fileName
                            ),
                          })
                        }
                        aria-label={`Remove ${fileName}`}
                        className="text-[#86868b] hover:text-[#1d1d1f]"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Shared Context Links */}
              <div className="rounded-2xl border border-black/10 bg-[#f5f5f7]/70 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
                  <Link2 className="h-3.5 w-3.5 text-[#0071e3]" aria-hidden="true" />
                  <span>Links (company website, articles, profiles)</span>
                </span>
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="url"
                    aria-label="Add context link URL"
                    disabled={isBusy}
                    value={newContextLink}
                    onChange={(e) => setNewContextLink(e.target.value)}
                    placeholder="https://company.com/strategy-memo"
                    className="min-h-[36px] flex-1 rounded-xl border border-black/15 bg-white px-3 py-1 text-xs text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      const trimmed = newContextLink.trim();
                      if (
                        trimmed &&
                        !grillContext.sharedLinks.includes(trimmed)
                      ) {
                        updateGrillContext({
                          ...grillContext,
                          sharedLinks: [...grillContext.sharedLinks, trimmed],
                        });
                        setNewContextLink('');
                      }
                    }}
                    className="rounded-xl bg-[#0071e3] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0077ed]"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {grillContext.sharedLinks.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-[#0071e3]"
                    >
                      <span className="max-w-[180px] truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateGrillContext({
                            ...grillContext,
                            sharedLinks: grillContext.sharedLinks.filter(
                              (l) => l !== url
                            ),
                          })
                        }
                        aria-label={`Remove ${url}`}
                        className="text-[#86868b] hover:text-[#1d1d1f]"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </fieldset>
          </section>

          {/* Submit Action Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <p className="text-xs text-[#6e6e73]">
              Creates 6 tailored questions (2 behavioural, 2 technical, 2
              role-specific).
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-pill-primary min-h-[48px] w-full px-8 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isBusy ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>
                    {stage === 'parsing'
                      ? 'Reading your resume…'
                      : 'Writing your questions…'}
                  </span>
                </>
              ) : (
                <>
                  <span>Generate 6 questions</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
