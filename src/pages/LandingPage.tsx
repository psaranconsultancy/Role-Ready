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
import { ScoreRing } from '../components/ScoreRing';
import { ReferenceChip } from '../components/ReferenceChip';
import { Logo } from '../components/Logo';
import { AmbientHeroCanvas } from '../components/AmbientHeroCanvas';
import { ComingNextSection } from '../components/ComingNextSection';

export const LandingPage: React.FC = () => {
  const { user, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [startingDemo, setStartingDemo] = useState(false);

  const handleStartDemo = async () => {
    if (user) {
      navigate('/history');
      return;
    }
    setStartingDemo(true);
    try {
      await signInDemo();
      navigate('/history');
    } catch {
      // Demo sign-in unavailable (e.g. anonymous sign-ins off): offer email sign-in.
      navigate('/login');
    } finally {
      setStartingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a]">
      {/* 1. Flagship Dark Hero Showcase with Ambient Video + 60fps Canvas */}
      <section className="relative overflow-hidden bg-[#0f172a] px-4 pb-20 pt-14 text-[#f8fafc] sm:px-6 sm:pb-28 sm:pt-20">
        <AmbientHeroCanvas
          backdropImage="/assets/img/hero-boardroom.jpg"
          videoOpacity={0.55}
        />

        <div className="relative z-10 mx-auto max-w-[1080px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1 text-xs font-medium text-[#38bdf8]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ready, Set, You’re Hired</span>
            </div>

            <h1 className="font-display text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-[#f8fafc] sm:text-[56px] lg:text-[64px]">
              Walk in knowing what they’ll ask
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-[1.45] text-[#d2d2d7] sm:text-[21px]">
              Upload your resume and the job spec, and practise 5, 10 or 15
              questions built from both. Every question shows the exact line
              from your resume and the job requirement it tests, and every
              answer gets a score out of 100 and a stronger example answer.
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

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#a1a1a6]">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#14b8a6]" aria-hidden="true" />
                Free to try, takes 10 minutes, and your resume stays private
              </span>
            </p>
          </div>

          {/* Editorial Candidate Confidence Banner + Live Bento Product Preview */}
          <div className="mt-12 space-y-6 sm:mt-16" data-ui="hero-preview">
            {/* Editorial Studio Confidence Visual */}
            <div className="mx-auto max-w-[960px] overflow-hidden rounded-[28px] border border-white/15 bg-[#0f172a]">
              <div className="grid lg:grid-cols-12">
                <div className="visual-media-frame min-h-[240px] rounded-none lg:col-span-7 lg:min-h-[300px]">
                  <img
                    src="/assets/img/hero-candidate-focus.jpg"
                    alt="Prepared candidate reviewing interview readiness scores in a calm evening studio"
                    loading="eager"
                    decoding="async"
                    className="visual-media-img"
                  />
                  <div className="visual-media-scrim" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/65 px-4 py-2.5 backdrop-blur-md">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Quiet confidence comes from rehearsal
                      </p>
                      <p className="text-xs text-[#a1a1a6]">
                        Practise your real projects until every metric and story
                        flows naturally
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#14b8a6]/20 px-2.5 py-1 text-xs font-semibold text-[#14b8a6]">
                      Ready
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-5">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0284c7]/20 px-3 py-1 text-xs font-semibold text-[#38bdf8]">
                    Built for calm confidence
                  </span>
                  <h2 className="mt-3 font-display text-xl font-bold leading-snug text-[#f8fafc] sm:text-2xl">
                    You already did the work. We help you tell the story.
                  </h2>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                    Interview nerves happen when you are guessing what the panel
                    wants. Seeing your own resume lines mapped to their job
                    description turns uncertainty into a clear, repeatable plan.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Question + Scorecard Preview */}
            <div className="mx-auto max-w-[960px] rounded-[28px] border border-white/15 bg-[#0f172a]/95 p-5 backdrop-blur-md sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0284c7] text-xs font-bold tabular-nums text-white">
                    Q1
                  </span>
                  <span className="text-xs font-medium text-[#a1a1a6]">
                    Senior Product Analyst at FinFlow
                  </span>
                  <span className="rounded-full bg-[#0284c7]/20 px-2.5 py-0.5 text-xs font-medium text-[#38bdf8]">
                    Behavioural
                  </span>
                </div>
                <span className="text-xs font-medium text-[#14b8a6]">
                  Hover over or tap a tag to read the exact line
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                {/* Left 7 cols: Question + Citations + Answer Excerpt */}
                <div className="space-y-4 lg:col-span-7">
                  <p className="font-display text-lg font-semibold leading-snug text-[#f8fafc] sm:text-xl">
                    “Walk me through how you redesigned sign-up at PayWave so 18%
                    more new customers started using the product, and how you
                    would use that approach to improve our checkout.”
                  </p>

                  {/* Interactive Citation Chips */}
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="basis-full text-xs font-medium text-[#a1a1a6]">
                      Based on:
                    </span>
                    <ReferenceChip
                      id="resume-onboarding"
                      kind="resume"
                      text="Redesigned sign-up for 14,000 small-business customers, so 18% more of them were actively using the product within their first month."
                    />
                    <ReferenceChip
                      id="jd-checkout"
                      kind="jd"
                      theme="dark"
                      text="Find where business customers drop out of checkout and test changes that help more of them complete payment."
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#a1a1a6]">
                      <span>Candidate answer</span>
                      <span className="tabular-nums text-[#14b8a6]">
                        72 words
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
                      “At PayWave, 38% of small businesses gave up at the ID
                      check during sign-up. I studied where 14,000 accounts
                      dropped out, worked with engineers to run the check in the
                      background, and raised first-month use by 18% in six months…”
                    </p>
                  </div>
                </div>

                {/* Right 5 cols: Score Ring + Verdict */}
                <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-white/10 bg-[#1e293b] p-5 lg:col-span-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#a1a1a6]">
                        Scorecard
                      </p>
                      <p className="mt-1 font-display text-lg font-bold text-[#f8fafc]">
                        Strong · Clear business impact
                      </p>
                      <p className="mt-0.5 text-xs text-[#a1a1a6]">
                        Every claim matches the PayWave line on your resume
                      </p>
                    </div>
                    <ScoreRing score={84} size="md" theme="dark" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#a1a1a6]">Relevance</span>
                      <p className="font-semibold tabular-nums text-[#14b8a6]">
                        5 / 5
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="text-[#a1a1a6]">Evidence</span>
                      <p className="font-semibold tabular-nums text-[#14b8a6]">
                        4 / 5
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#0284c7]/30 bg-[#0284c7]/10 p-3 text-xs text-[#f8fafc]">
                    <span className="font-semibold text-[#38bdf8]">
                      What to fix next:
                    </span>{' '}
                    Link the 18% rise in active customers to the checkout
                    improvements this job asks for.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works with Editorial Photography Frames */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Three steps to interview‑ready
          </h2>
          <p className="mt-3 text-base text-[#6e6e73] sm:text-lg">
            Every session is built from your own career history and the job
            description you are targeting.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="bento-card-light flex flex-col overflow-hidden p-6 sm:p-7">
            <div className="visual-media-frame mb-5 h-44 w-full">
              <img
                src="/assets/img/feature-evidence-mapping.jpg"
                alt="Candidate reviewing resume lines mapped to role requirements at a sunlit desk"
                loading="lazy"
                decoding="async"
                className="visual-media-img"
              />
              <div className="visual-media-scrim" />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                Step 1 · Match your experience
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0284c7]/10 text-[#0369a1]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                1 of 3
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
              Add your resume and the job
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Drop in your PDF resume (up to 5 MB), then upload the job spec or paste its text.
              RoleReady reads your resume line by line and picks out what the
              job is asking for.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bento-card-light flex flex-col overflow-hidden p-6 sm:p-7">
            <div className="visual-media-frame mb-5 h-44 w-full">
              <img
                src="/assets/img/feature-calm-interview.jpg"
                alt="Confident candidate speaking with two attentive hiring managers in a glass meeting room"
                loading="lazy"
                decoding="async"
                className="visual-media-img"
              />
              <div className="visual-media-scrim" />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                Step 2 · Practise real questions
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0284c7]/10 text-[#0369a1]">
                <Layers className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                2 of 3
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
              Answer 5, 10 or 15 tailored questions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Pick behavioural, technical, situational or a mix of all of
              them. Each question has tags you can tap to see the exact
              resume line and job requirement it is testing.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bento-card-light flex flex-col overflow-hidden p-6 sm:p-7">
            <div className="visual-media-frame mb-5 h-44 w-full">
              <img
                src="/assets/img/feature-ready-mindset.jpg"
                alt="Accomplished candidate walking through a sunlit glass atrium with confidence"
                loading="lazy"
                decoding="async"
                className="visual-media-img"
              />
              <div className="visual-media-scrim" />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                Step 3 · Walk in ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14b8a6]/15 text-[#0f766e]">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                3 of 3
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
              Get scored, improve, try again
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              Get an instant score out of 100 for Relevance, Evidence, Structure,
              and Impact, along with one specific fix, a stronger example
              answer, and a button to retry your lowest-scoring question.
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
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
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
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0284c7]/10 px-3 py-1 text-xs font-semibold text-[#0369a1]">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Built from your resume
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
                Every question points to your resume
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Every question links to specific lines from your uploaded resume
                and the job description. Hover over or tap any tag to read the
                original text.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#f1f5f9] p-3.5">
              <span className="rounded-full border border-[#0284c7]/30 bg-[#0284c7]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0369a1]">
                Resume · Grew sign-ups 18%
              </span>
              <span className="rounded-full border border-black/15 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0f172a]">
                Job post · Improve checkout
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bento-card-light flex flex-col justify-between p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#14b8a6]/15 px-3 py-1 text-xs font-semibold text-[#0f766e]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Score out of 100
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
                Scored on four hiring criteria
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                Each answer is graded on Relevance, Evidence, Structure, and
                Impact. You see what worked, the one change that will raise your
                score most, and a stronger example answer.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#f1f5f9] p-3.5">
              <div>
                <p className="text-xs font-medium text-[#6e6e73]">
                  Sample session average
                </p>
                <p className="font-display text-lg font-bold text-[#0f172a]">
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
              <h3 className="mt-4 font-display text-xl font-bold text-[#0f172a]">
                Catches claims not on your resume
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
              5 engineers on the onboarding flow.
            </div>
          </div>
        </div>
      </section>

      {/* 4. Roadmap: what is coming next */}
      <section
        id="pricing-tiers"
        className="border-t border-black/[0.06] bg-white/60 px-4 py-16 sm:px-6 sm:py-24"
      >
        <ComingNextSection mode="section" />
      </section>

      {/* 5. Closing Dark Flagship CTA Band with Ambient Canvas */}
      <section className="relative overflow-hidden bg-[#0f172a] px-4 py-16 text-center text-[#f8fafc] sm:px-6 sm:py-24">
        <AmbientHeroCanvas
          backdropImage="/assets/img/feature-ready-mindset.jpg"
          videoOpacity={0.42}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-5xl">
            Your next interview is a practice run away
          </h2>
          <p className="mt-4 text-base text-[#d2d2d7] sm:text-lg">
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
      <footer className="border-t border-white/10 bg-[#0f172a] px-4 py-10 text-xs text-[#86868b] sm:px-6">
        <div className="mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo theme="dark" size="sm" />
            <span className="text-[#86868b]">
              Built by Team 44 · Outskill AI Accelerator 2026
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/" className="hover:text-[#f8fafc]">
              Overview
            </Link>
            <Link to="/history" className="hover:text-[#f8fafc]">
              History
            </Link>
            <Link to="/new" className="hover:text-[#f8fafc]">
              New practice
            </Link>
            <Link to="/login" className="hover:text-[#f8fafc]">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
