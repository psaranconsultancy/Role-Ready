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
            RoleReady
          </span>
          <div className="flex items-center gap-5">
            <a
              href="#how-it-works"
              className="hidden text-xs text-[#f5f5f7]/75 transition-colors hover:text-white sm:inline"
            >
              How it works
            </a>
            <a
              href="#grounded-architecture"
              className="hidden text-xs text-[#f5f5f7]/75 transition-colors hover:text-white sm:inline"
            >
              Why it works
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
        <div className="relative z-10 mx-auto max-w-[1080px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-medium text-[#2997ff]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interview practice built from your resume</span>
            </div>

            <h1 className="font-display text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-[#f5f5f7] sm:text-[56px] lg:text-[64px]">
              Walk in knowing what they’ll ask
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-[1.45] text-[#86868b] sm:text-[21px]">
              Upload your resume, paste the job description, and practise six
              questions built from both. Every question cites the exact line
              from your resume and the job requirement it tests, and every
              answer gets a 0–100 score with a stronger rewrite.
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
                      {startingDemo ? 'Opening demo…' : 'Try the demo'}
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
                Free to try, takes 10 minutes, and your resume stays private
              </span>
            </p>
          </div>

          {/* Live Bento Product Preview */}
          <div className="mt-12 sm:mt-16" data-ui="hero-preview">
            <div className="mx-auto max-w-[960px] rounded-[28px] border border-white/15 bg-[#161617] p-5 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-xs font-bold tabular-nums text-white">
                    Q1
                  </span>
                  <span className="text-xs font-medium text-[#86868b]">
                    Senior Product Analyst at FinFlow
                  </span>
                  <span className="rounded-full bg-[#0071e3]/20 px-2.5 py-0.5 text-xs font-medium text-[#2997ff]">
                    Behavioral
                  </span>
                </div>
                <span className="text-xs font-medium text-[#30d158]">
                  Hover or tap R3 and J2 to read the source text
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
                    <span className="text-xs font-medium text-[#86868b]">
                      Cites:
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
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#86868b]">
                      <span>Candidate answer</span>
                      <span className="tabular-nums text-[#30d158]">
                        72 words
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
                      “At PayWave, 38% of SMBs dropped off at KYB document
                      upload. I ran SQL cohort queries across 14,000 accounts,
                      worked with engineering to ship async verification, and
                      lifted 30-day activation by 18% in two quarters…”
                    </p>
                  </div>
                </div>

                {/* Right 5 cols: Score Ring + Verdict */}
                <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-white/10 bg-[#1c1c1e] p-5 lg:col-span-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#86868b]">
                        Scorecard
                      </p>
                      <p className="mt-1 font-display text-lg font-bold text-[#f5f5f7]">
                        Strong · Clear business impact
                      </p>
                      <p className="mt-0.5 text-xs text-[#86868b]">
                        Backed by line R3 with zero unverified claims
                      </p>
                    </div>
                    <ScoreRing score={84} size="md" theme="dark" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#86868b]">Relevance</span>
                      <p className="font-semibold tabular-nums text-[#30d158]">
                        5 / 5
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#86868b]">Evidence</span>
                      <p className="font-semibold tabular-nums text-[#30d158]">
                        4 / 5
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#0071e3]/30 bg-[#0071e3]/10 p-3 text-xs text-[#f5f5f7]">
                    <span className="font-semibold text-[#2997ff]">
                      What to fix next:
                    </span>{' '}
                    Connect the 18% activation lift directly to the B2B checkout
                    experiments in requirement J2.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
            Three steps from PDF to interview-ready
          </h2>
          <p className="mt-3 text-base text-[#6e6e73] sm:text-lg">
            Every session is built from your own career history and the job
            description you are targeting.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                1 of 3
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Upload resume and JD
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Drop your PDF resume (up to 5 MB) and paste the job description.
              RoleReady splits your resume into numbered lines and pulls out the
              core requirements from the job post.
            </p>
          </div>

          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
                <Layers className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                2 of 3
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Answer 6 tailored questions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Practise two behavioral, two technical, and two role-specific
              questions. Each question shows clickable chips so you can see the
              exact resume line and job requirement it is testing.
            </p>
          </div>

          <div className="bento-card-light p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#30d158]/15 text-[#15803d]">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                3 of 3
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-[#1d1d1f]">
              Get scored, fix, re-drill
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Get an instant 0–100 score across Relevance, Evidence, Structure,
              and Impact, along with one specific fix, a stronger rewrite, and a
              button to re-drill your lowest-scoring question.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Why It Works */}
      <section
        id="grounded-architecture"
        className="mx-auto max-w-[1080px] px-4 pb-20 sm:px-6 sm:pb-28"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
            How RoleReady scores your practice
          </h2>
          <p className="mt-3 text-base text-[#6e6e73] sm:text-lg">
            Every question and scorecard is tied directly to the facts on your
            resume.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-semibold text-[#0071e3]">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Direct citations
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Cites your resume line by line
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Every question links to specific lines from your uploaded resume
                and the target job description. Hover or tap any chip to read
                the source text.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#f5f5f7] p-3.5">
              <span className="rounded-full border border-[#0071e3]/30 bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                <code>R1</code> · SQL cohort analysis
              </span>
              <span className="rounded-full border border-black/15 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1d1d1f]">
                <code>J4</code> · Looker dashboards
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#30d158]/15 px-3 py-1 text-xs font-semibold text-[#15803d]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                0–100 rubric
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Scored on four hiring criteria
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Each answer is graded on Relevance, Evidence, Structure, and
                Impact. You see what worked, the one change that will raise your
                score most, and a stronger rewrite.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#f5f5f7] p-3.5">
              <div>
                <p className="text-xs font-medium text-[#6e6e73]">
                  Sample session average
                </p>
                <p className="font-display text-lg font-bold text-[#1d1d1f]">
                  Strong readiness
                </p>
              </div>
              <ScoreRing score={82} size="sm" theme="light" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ff9f0a]/15 px-3 py-1 text-xs font-semibold text-[#b45309]">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Fact check
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#1d1d1f]">
                Catches claims not on your CV
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                If you mention a metric or team size that is not on your resume,
                RoleReady flags it so your spoken answers match what the
                interviewer is reading.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[#ff9f0a]/30 bg-[#fffbeb] p-3.5 text-xs text-[#92400e]">
              <span className="font-semibold">Flagged claim:</span> “Managed 12
              engineers” did not match your resume, which lists partnering with
              5 engineers on the onboarding flow (<code>R2</code>).
            </div>
          </div>
        </div>
      </section>

      {/* 4. Closing Dark Flagship CTA Band */}
      <section className="bg-black px-4 py-16 text-center text-[#f5f5f7] sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#f5f5f7] sm:text-5xl">
            Your next interview is a practice run away
          </h2>
          <p className="mt-4 text-base text-[#86868b] sm:text-lg">
            Open a sample session right now or upload your own PDF resume in
            seconds.
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
              Built by Team 44 · Outskill AI Accelerator 2026
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
              New practice
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
