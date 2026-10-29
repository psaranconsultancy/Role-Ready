import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Target,
  Layers,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isMockMode } from '../lib/api';
import { ScoreRing } from '../components/ScoreRing';
import { ReferenceChip } from '../components/ReferenceChip';
import { Logo } from '../components/Logo';

export const LandingPage: React.FC = () => {
  const { user, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [startingDemo, setStartingDemo] = useState(false);

  const handleStartDemo = async () => {
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

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Sticky Product Local Sub-Navigation */}
      <div className="frosted-localnav-dark sticky top-12 z-40 h-[52px] w-full text-[#f5f5f7]">
        <div className="mx-auto flex h-full max-w-[1080px] items-center justify-between px-4 sm:px-6">
          <span className="font-display text-base font-semibold tracking-tight text-[#f5f5f7] sm:text-[17px]">
            RoleReady Studio
          </span>
          <div className="flex items-center gap-5">
            <a
              href="#how-it-works"
              className="hidden text-xs text-[#f5f5f7]/75 transition hover:text-white sm:inline"
            >
              How it works
            </a>
            <a
              href="#grounded-architecture"
              className="hidden text-xs text-[#f5f5f7]/75 transition hover:text-white sm:inline"
            >
              Why it’s different
            </a>
            {user ? (
              <Link
                to="/history"
                className="btn-pill-primary px-3.5 py-1 text-xs font-semibold"
              >
                Open dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStartDemo}
                disabled={startingDemo}
                className="btn-pill-primary px-3.5 py-1 text-xs font-semibold"
              >
                {startingDemo ? 'Opening…' : 'Try the demo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Flagship Dark Hero Showcase */}
      <section className="relative overflow-hidden bg-black px-4 pb-20 pt-14 text-[#f5f5f7] sm:px-6 sm:pb-28 sm:pt-20">
        {/* Subtle Radial Illumination */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,113,227,0.22)_0%,rgba(48,209,88,0.06)_45%,transparent_70%)] blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-[1080px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-medium text-[#2997ff]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>AI interview coach · Grounded in your evidence</span>
            </div>

            <h1 className="font-display text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-[#f5f5f7] sm:text-[56px] lg:text-[64px]">
              Walk in knowing what they’ll ask.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-[1.45] text-[#86868b] sm:text-[21px]">
              Upload your resume, paste the job description, and practise six
              questions built from both. Every question cites your resume lines
              and the role’s requirements, and every answer gets a
              hiring-manager score with a stronger rewrite.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              {user ? (
                <Link
                  to="/history"
                  className="btn-pill-primary min-h-[44px] w-full px-7 py-3 text-[15px] font-semibold sm:w-auto"
                >
                  <span>Open dashboard</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartDemo}
                    disabled={startingDemo}
                    className="btn-pill-primary min-h-[44px] w-full px-7 py-3 text-[15px] font-semibold sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {startingDemo
                        ? 'Launching demo studio…'
                        : 'Try the demo — no sign-up'}
                    </span>
                  </button>
                  <Link
                    to="/login"
                    className="btn-pill-secondary-dark min-h-[44px] w-full px-7 py-3 text-[15px] font-semibold sm:w-auto"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#86868b]">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#30d158]" aria-hidden="true" />
                Free
              </span>
              <span aria-hidden="true">·</span>
              <span>Takes 10 minutes</span>
              <span aria-hidden="true">·</span>
              <span>Your resume stays private</span>
            </p>
          </div>

          {/* Live Glassmorphic Bento Product Preview */}
          <div className="mt-12 sm:mt-16">
            <div className="mx-auto max-w-[960px] rounded-[28px] border border-white/15 bg-[#161617]/90 p-5 shadow-glass-dark backdrop-blur-2xl sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] font-mono text-xs font-bold text-white">
                    Q1
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#86868b]">
                    Senior Product Analyst · FinFlow
                  </span>
                  <span className="rounded-full bg-[#0071e3]/20 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#2997ff]">
                    Behavioral
                  </span>
                </div>
                <span className="font-mono text-xs text-[#30d158]">
                  ● Live Grounded Preview (Hover or tap R3 / J2)
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                {/* Left 7 cols: Question + Citations + Answer Excerpt */}
                <div className="space-y-4 lg:col-span-7">
                  <p className="font-display text-lg font-semibold leading-snug text-[#f5f5f7] sm:text-xl">
                    “Walk me through how you redesigned the onboarding funnel at
                    PayWave to lift activation by 18%, and how that approach
                    applies to owning our B2B checkout conversion roadmap.”
                  </p>

                  {/* Interactive Citation Chips */}
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#86868b]">
                      Grounded in:
                    </span>
                    <ReferenceChip
                      id="R3"
                      kind="resume"
                      text="Redesigned merchant onboarding funnel using Amplitude + SQL cohort analysis, increasing 30-day activation by 18% across 14,000 SMB accounts."
                    />
                    <ReferenceChip
                      id="J2"
                      kind="jd"
                      text="Own end-to-end funnel diagnostics and checkout conversion experiments across B2B payment flows."
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#86868b]">
                      <span>Candidate Response (STAR structure)</span>
                      <span className="font-mono text-[#30d158]">
                        72 words · Optimal STAR pace
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
                      “At PayWave, 38% of SMBs dropped off at KYB document
                      upload. I ran SQL cohort queries across 14,000 accounts,
                      partnered with engineering to ship async verification, and
                      lifted 30-day activation by 18% in two quarters…”
                    </p>
                  </div>
                </div>

                {/* Right 5 cols: Score Ring + Hiring Manager Verdict */}
                <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-white/10 bg-[#1c1c1e] p-5 lg:col-span-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#86868b]">
                        Hiring-Manager Verdict
                      </p>
                      <p className="mt-1 font-display text-lg font-bold text-[#f5f5f7]">
                        Strong · Quantified impact
                      </p>
                      <p className="mt-0.5 text-xs text-[#86868b]">
                        Backed by R3 · Zero unverified claims
                      </p>
                    </div>
                    <ScoreRing score={84} size="md" theme="dark" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#86868b]">Relevance</span>
                      <p className="font-mono font-semibold text-[#30d158]">
                        5 / 5
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#86868b]">Evidence</span>
                      <p className="font-mono font-semibold text-[#30d158]">
                        4 / 5
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#0071e3]/30 bg-[#0071e3]/10 p-3 text-xs text-[#f5f5f7]">
                    <span className="font-semibold text-[#2997ff]">
                      One fix to reach 95+:
                    </span>{' '}
                    Tie the 18% activation lift directly to B2B checkout latency
                    trade-offs in J2.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (3-Step Studio Workflow on Light Canvas) */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0071e3]">
            How It Works
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
            Three steps from PDF to interview-ready.
          </h2>
          <p className="mt-3 text-base text-[#6e6e73] sm:text-lg">
            No generic question banks. Every session is synthesized directly
            from your career history and the target role.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs font-bold text-[#86868b]">
                STEP 01
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Upload resume &amp; JD
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Drop your PDF resume (up to 5 MB) and paste the job description.
              RoleReady indexes your resume into numbered evidence lines (
              <code className="font-mono text-xs text-[#0071e3]">R1..Rn</code>)
              and extracts key requirements (
              <code className="font-mono text-xs text-[#1d1d1f]">J1..Jn</code>).
            </p>
          </div>

          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
                <Layers className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs font-bold text-[#86868b]">
                STEP 02
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Answer 6 tailored questions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Practise 2 behavioral, 2 technical/role, and 2 resume-probe
              questions. Every prompt displays clickable citation chips so you
              know the exact resume bullet and requirement being tested.
            </p>
          </div>

          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#30d158]/15 text-[#15803d]">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs font-bold text-[#86868b]">
                STEP 03
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Get scored, fix, re-drill
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Receive an instant 0–100 score across Relevance, Specificity,
              Structure, and Evidence—plus one concrete fix, a stronger rewrite,
              and a 1-click re-drill on your lowest-scoring question.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Why It's Different (2-Column Bento Grid) */}
      <section
        id="grounded-architecture"
        className="mx-auto max-w-[1080px] px-4 pb-20 sm:px-6 sm:pb-28"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#f56300]">
            Why It’s Different
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
            Built for precision, not generic pep talks.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Card 1: Grounded, not generic */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0071e3]/10 px-3 py-1 font-mono text-xs font-semibold text-[#0071e3]">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                R1..Rn · J1..Jn
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Grounded, not generic
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Every question cites exact lines from your uploaded resume and
                the target job description. Hover or focus any chip to inspect
                the verbatim source text.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#f5f5f7] p-3.5">
              <span className="rounded-full border border-[#0071e3]/30 bg-[#0071e3]/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#0071e3]">
                R1 · SQL Cohort Analysis
              </span>
              <span className="rounded-full border border-black/15 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-[#1d1d1f]">
                J4 · Executive Storytelling
              </span>
            </div>
          </div>

          {/* Card 2: Scored like a hiring manager */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#30d158]/15 px-3 py-1 font-mono text-xs font-semibold text-[#15803d]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                0–100 Rubric
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Scored like a hiring manager
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Each response is graded on Relevance, Specificity, STAR
                Structure, and Evidence—complete with what worked, the single
                highest-leverage fix, and a copyable rewrite.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#f5f5f7] p-3.5">
              <div>
                <p className="font-mono text-[11px] uppercase text-[#6e6e73]">
                  Sample Session Avg
                </p>
                <p className="font-display text-lg font-bold text-[#1d1d1f]">
                  Strong Readiness
                </p>
              </div>
              <ScoreRing score={82} size="sm" theme="light" />
            </div>
          </div>

          {/* Card 3: Evidence check */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ff9f0a]/15 px-3 py-1 font-mono text-xs font-semibold text-[#b45309]">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Hallucination Guard
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Evidence check
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Claimed a metric or team size that isn’t on your resume?
                RoleReady flags unsupported claims immediately so you can align
                your verbal stories with your written CV.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[#ff9f0a]/30 bg-[#fffbeb] p-3.5 text-xs text-[#92400e]">
              <span className="font-mono font-bold uppercase">
                Not in your resume:
              </span>{' '}
              “Managed 12 engineers” — your resume cites leading cross-functional
              analytics pods (R2).
            </div>
          </div>
        </div>
      </section>

      {/* 4. Closing Dark Flagship CTA Band */}
      <section className="bg-black px-4 py-16 text-center text-[#f5f5f7] sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#f5f5f7] sm:text-5xl">
            Your next interview is a practice run away.
          </h2>
          <p className="mt-4 text-base text-[#86868b] sm:text-lg">
            Jump straight into a seeded demo session or upload your own PDF
            resume in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleStartDemo}
              disabled={startingDemo}
              className="btn-pill-primary min-h-[44px] w-full px-8 py-3 text-[15px] font-semibold sm:w-auto"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>
                {startingDemo
                  ? 'Opening demo…'
                  : user
                    ? 'Open dashboard'
                    : 'Try the demo'}
              </span>
            </button>
            {!user && (
              <Link
                to="/login"
                className="btn-pill-secondary-dark min-h-[44px] w-full px-8 py-3 text-[15px] font-semibold sm:w-auto"
              >
                Sign in with email
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 5. Directory Footer */}
      <footer className="border-t border-white/10 bg-[#161617] px-4 py-10 text-xs text-[#86868b] sm:px-6">
        <div className="mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo theme="dark" size="sm" />
            <span className="text-[#86868b]">
              · Built by Team 44 · Outskill AI Accelerator 2026
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/" className="hover:text-[#f5f5f7]">
              Overview
            </Link>
            <Link to="/history" className="hover:text-[#f5f5f7]">
              History
            </Link>
            <Link to="/new" className="hover:text-[#f5f5f7]">
              New Practice
            </Link>
            <Link to="/login" className="hover:text-[#f5f5f7]">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
