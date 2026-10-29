import React, { useState, useMemo } from 'react';
import {
  Flame,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  TrendingUp,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import type { Question, Feedback, ResumeLine, JdRequirement } from '@contracts';
import {
  useSubscriptionTier,
  buildGrillRoundsForQuestion,
} from '../lib/tiers';
import { TierPricingSection } from './TierPricingSection';

interface GrillMeDeepDivePanelProps {
  question: Question;
  resumeLines: ResumeLine[];
  jdItems: JdRequirement[];
  feedback?: Feedback;
  roleTitle?: string | null;
  company?: string | null;
}

export const GrillMeDeepDivePanel: React.FC<GrillMeDeepDivePanelProps> = ({
  question,
  resumeLines,
  jdItems,
  feedback,
  roleTitle,
  company,
}) => {
  const {
    currentTierDef,
    tier3Def,
    isTier3Unlocked,
    setTier,
  } = useSubscriptionTier();

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [activeRound, setActiveRound] = useState<1 | 2>(1);
  const [settledIds, setSettledIds] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [copiedScript, setCopiedScript] = useState(false);

  const plan = useMemo(
    () =>
      buildGrillRoundsForQuestion(
        question,
        resumeLines,
        jdItems,
        feedback,
        roleTitle,
        company
      ),
    [question, resumeLines, jdItems, feedback, roleTitle, company]
  );

  const round1 = plan.rounds[0];
  const round2 = plan.rounds[1];
  const currentRoundObj = activeRound === 1 ? round1 : round2;

  const isRound1Settled = round1.questions.every((q) => Boolean(settledIds[q.id]));
  const isRound2Settled = round2.questions.every((q) => Boolean(settledIds[q.id]));
  const isTreeCleared = isRound1Settled && isRound2Settled;

  const handleSettleQuestion = (qId: string, recommended: string) => {
    const chosen = customNotes[qId]?.trim() || recommended;
    setSettledIds((prev) => ({
      ...prev,
      [qId]: chosen,
    }));
  };

  const handleCopyNegotiation = async () => {
    try {
      await navigator.clipboard.writeText(plan.negotiationScript.spokenScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <section
      data-ui="grill-me-panel"
      aria-label="Grill Me deep-dive stress test"
      className="bento-card-dark mt-6 overflow-hidden p-6 text-[#f5f5f7] sm:p-8"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-3 py-1 text-xs font-semibold text-white">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Grill Me™ Deep-Dive Stress Test</span>
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-[#d2d2d7]">
            {isTier3Unlocked
              ? `Active · ${tier3Def.name}`
              : `Current Tier · ${currentTierDef.name}`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPricingModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[#2997ff] transition-colors hover:bg-white/10"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Compare 3 tiers</span>
        </button>
      </div>

      {/* LOCKED STATE (Tier 1 or Tier 2) -> Psychological Nudge + Frontier Preview */}
      {!isTier3Unlocked ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-12 lg:items-center">
            <div className="space-y-2.5 lg:col-span-8">
              <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                First-pass answers clear screening. Deep-dive rounds win the offer.
              </h3>
              <p className="text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
                {currentTierDef.psychologicalNudge} Switch to{' '}
                <strong className="text-white">{tier3Def.name}</strong> to run
                multi-round decision-tree grilling on every resume claim and
                practise your salary negotiation script.
              </p>
            </div>
            <div className="rounded-2xl border border-[#30d158]/30 bg-[#30d158]/10 p-4 lg:col-span-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#30d158]">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span>{tier3Def.highlightBadge}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#f5f5f7]">
                {tier3Def.roiAnchor}
              </p>
            </div>
          </div>

          {/* Teaser of Round 1 Frontier Q1 */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#2997ff]">
                {round1.roundTitle} (Preview)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#ff9f0a]">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>2 rounds + negotiation script gated</span>
              </span>
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white">
              <HelpCircle
                className="h-4 w-4 shrink-0 text-[#2997ff]"
                aria-hidden="true"
              />
              <span>
                {round1.questions[0].code} · {round1.questions[0].title}
              </span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
              {round1.questions[0].prompt}
            </p>

            {/* Gated Recommended Angle & Round 2 */}
            <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/50 p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#a1a1a6]">
                  <ArrowRight
                    className="h-3.5 w-3.5 text-[#2997ff]"
                    aria-hidden="true"
                  />
                  <span>
                    Recommended executive angle + Round 2 Failure-Mode Probe
                  </span>
                </p>
                <p className="text-xs text-[#86868b]">
                  Includes recommended rebuttal, second-order follow-ups, and
                  closing compensation script.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => setTier('tier3')}
                  className="btn-pill-primary min-h-[42px] px-5 py-2 text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Switch to {tier3Def.name} ({tier3Def.priceMonthly}/mo)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TIER 3 STATE -> Full Multi-Round Decision-Tree Grilling Engine */
        <div className="mt-6 space-y-6">
          {/* Round Stepper */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-xs font-semibold text-[#2997ff]">
                {currentRoundObj.roundTitle}
              </p>
              <p className="mt-0.5 text-xs text-[#a1a1a6]">
                {currentRoundObj.frontierSummary}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRound(1)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeRound === 1
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <span>Round 1</span>
                {isRound1Settled && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#30d158]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveRound(2)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeRound === 2
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <span>Round 2</span>
                {isRound2Settled && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#30d158]" />
                )}
              </button>
            </div>
          </div>

          {/* Frontier Questions for Current Round */}
          <div className="space-y-4">
            {currentRoundObj.questions.map((q) => {
              const isSettled = Boolean(settledIds[q.id]);
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 transition-colors ${
                    isSettled
                      ? 'border-[#30d158]/40 bg-[#30d158]/[0.07]'
                      : 'border-white/15 bg-white/[0.04]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-white sm:text-base">
                      <HelpCircle
                        className="h-4 w-4 shrink-0 text-[#2997ff]"
                        aria-hidden="true"
                      />
                      <span>
                        {q.code} · {q.title}
                      </span>
                    </span>
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#30d158]/20 px-2.5 py-0.5 text-xs font-semibold text-[#30d158]">
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>Branch settled</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#ff9f0a]">
                        Open frontier branch
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#f5f5f7] sm:text-sm">
                    {q.prompt}
                  </p>

                  <p className="mt-2 text-xs text-[#a1a1a6]">
                    <strong className="text-[#d2d2d7]">What this tests:</strong>{' '}
                    {q.hiddenRiskTested}
                  </p>

                  {/* Recommended Answer Block */}
                  <div className="mt-4 rounded-xl border border-[#0071e3]/35 bg-[#0071e3]/15 p-3.5 text-xs leading-relaxed text-[#f5f5f7]">
                    <p className="flex items-center gap-1.5 font-semibold text-[#2997ff]">
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Recommended angle:</span>
                    </p>
                    <p className="mt-1">{q.recommendedAnswer}</p>
                  </div>

                  {/* Interactive Defence Input or Quick Accept */}
                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      aria-label={`Your defence or notes for ${q.code}`}
                      value={customNotes[q.id] ?? ''}
                      onChange={(e) =>
                        setCustomNotes((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Optional: type your specific metric or press Lock in this angle…"
                      className="min-h-[40px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white placeholder:text-[#86868b] focus:border-[#2997ff] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSettleQuestion(q.id, q.recommendedAnswer)
                      }
                      className="btn-pill-primary min-h-[40px] shrink-0 px-4 py-2 text-xs font-semibold"
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      <span>
                        {isSettled
                          ? 'Update branch'
                          : 'Yes, lock in this angle'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advance to Round 2 CTA when Round 1 is settled */}
          {activeRound === 1 && isRound1Settled && !isRound2Settled && (
            <div className="flex items-center justify-between rounded-2xl border border-[#0071e3]/40 bg-[#0071e3]/15 p-4">
              <p className="text-xs font-semibold text-white sm:text-sm">
                Round 1 frontier settled. Ready for Round 2 failure-mode probes?
              </p>
              <button
                type="button"
                onClick={() => setActiveRound(2)}
                className="btn-pill-primary min-h-[38px] px-4 py-1.5 text-xs font-semibold"
              >
                <span>Advance to Round 2</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Executive Offer & Salary Negotiation Script */}
          <div
            className={`rounded-2xl border p-5 ${
              isTreeCleared
                ? 'border-[#30d158]/50 bg-[#30d158]/10'
                : 'border-white/15 bg-black/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#30d158]">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span>{plan.negotiationScript.anchorHeadline}</span>
                </span>
                <p className="mt-0.5 text-xs text-[#a1a1a6]">
                  {plan.negotiationScript.leveragePoint}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNegotiation}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                {copiedScript ? (
                  <>
                    <Check
                      className="h-3.5 w-3.5 text-[#30d158]"
                      aria-hidden="true"
                    />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy script</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f5f5f7] sm:text-sm">
              {plan.negotiationScript.spokenScript}
            </p>
          </div>
        </div>
      )}

      {showPricingModal && (
        <TierPricingSection
          mode="modal"
          onCloseModal={() => setShowPricingModal(false)}
        />
      )}
    </section>
  );
};
