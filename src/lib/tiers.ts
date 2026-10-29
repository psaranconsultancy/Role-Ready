import { useState, useEffect, useCallback } from 'react';
import type { Question, Feedback, ResumeLine, JdRequirement } from '@contracts';

export type TierLevel = 'tier1' | 'tier2' | 'tier3';
export type TierFrameworkId = 'outcome' | 'ambition' | 'competitive';

export interface TierDefinition {
  level: TierLevel;
  badgeLabel: string;
  name: string;
  subtitle: string;
  priceMonthly: string;
  billingNote: string;
  positioning: string;
  psychologicalNudge: string;
  ctaLabel: string;
  isDecoyBridge?: boolean;
  isFlagship?: boolean;
  highlightBadge?: string;
  roiAnchor?: string;
  features: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
}

export interface TierFramework {
  id: TierFrameworkId;
  label: string;
  tagline: string;
  tiers: [TierDefinition, TierDefinition, TierDefinition];
}

export const TIER_FRAMEWORKS: Record<TierFrameworkId, TierFramework> = {
  outcome: {
    id: 'outcome',
    label: 'Outcome-Driven',
    tagline: 'Move from basic practice to a secured offer and stronger compensation.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Entry',
        name: 'Essential Prep',
        subtitle: 'Basic practice for lower-stakes interviews.',
        priceMonthly: '£19',
        billingNote: 'per month · basic access',
        positioning: 'Covers initial screening prompts for lower-stakes roles.',
        psychologicalNudge:
          'Covers surface-level prompts only. Most candidates rejected in final panel rounds stop their preparation here.',
        ctaLabel: 'Stay on Essential Prep',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & model answer rewrites', included: false },
          {
            text: 'Grill Me™ Deep-Dive Questioning (Multi-Round Decision Tree)',
            included: false,
          },
          {
            text: 'Executive Offer & Salary Negotiation Scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Standard',
        name: 'Interview Ready',
        subtitle: 'Comprehensive preparation for standard mid-level roles.',
        priceMonthly: '£69',
        billingNote: 'per month · standard prep',
        positioning: 'The baseline for serious candidates entering mid-level loops.',
        psychologicalNudge:
          'Gets you through standard first-pass questions, but leaves out multi-round follow-up grilling and offer negotiation.',
        ctaLabel: 'Select Interview Ready',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & model answer rewrites', included: true },
          {
            text: 'Grill Me™ Deep-Dive Questioning (Multi-Round Decision Tree)',
            included: false,
          },
          {
            text: 'Executive Offer & Salary Negotiation Scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Hired Elite',
        name: 'Offer Secured',
        subtitle:
          'End-to-end strategy, executive-level deep-dive prep, and offer negotiation.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for high-stakes panel loops where interviewers probe two and three layers deep into every claim.',
        psychologicalNudge:
          'Directly connects your preparation to landing the offer and negotiating a higher base salary.',
        ctaLabel: 'Choose Offer Secured',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & model answer rewrites', included: true },
          {
            text: 'Grill Me™ Deep-Dive Questioning (Multi-Round Decision Tree)',
            included: true,
            highlight: true,
          },
          {
            text: 'Executive Offer & Salary Negotiation Scripts',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
  ambition: {
    id: 'ambition',
    label: 'Role & Ambition',
    tagline: 'Choose whether you show up as another applicant or the choice hire.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Entry',
        name: 'Applicant',
        subtitle: 'Standard tools to get through the initial screening.',
        priceMonthly: '£19',
        billingNote: 'per month · screening tier',
        positioning: 'Standard tools to get through the initial recruiter phone screen.',
        psychologicalNudge:
          'Keeps you at the same preparation level as everyone else in the general applicant pool.',
        ctaLabel: 'Stay as Applicant',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: false },
          {
            text: 'Grill Me™ High-Stakes Follow-Up Decision Tree',
            included: false,
          },
          {
            text: 'Live Counter-Offer & Compensation Strategy',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Bridge',
        name: 'Shortlist',
        subtitle: 'Tools to clear panel rounds and behavioral assessments.',
        priceMonthly: '£69',
        billingNote: 'per month · shortlist prep',
        positioning: 'Moves you into the shortlist for standard behavioral and technical rounds.',
        psychologicalNudge:
          'Helps you reach the final three candidates, where hiring committees start stress-testing every trade-off.',
        ctaLabel: 'Select Shortlist',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: true },
          {
            text: 'Grill Me™ High-Stakes Follow-Up Decision Tree',
            included: false,
          },
          {
            text: 'Live Counter-Offer & Compensation Strategy',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · The Choice Hire',
        name: 'Top Candidate',
        subtitle:
          'Tailored mock interviews, high-stakes question banks, and deep-dive grilling.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Shortlist',
        positioning:
          'Designed for high-achieving professionals who refuse to settle for mid-tier preparation.',
        psychologicalNudge:
          'Walk into the final loop having already resolved every sceptical follow-up question on your decision tree.',
        ctaLabel: 'Choose Top Candidate',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: true },
          {
            text: 'Grill Me™ High-Stakes Follow-Up Decision Tree',
            included: true,
            highlight: true,
          },
          {
            text: 'Live Counter-Offer & Compensation Strategy',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
  competitive: {
    id: 'competitive',
    label: 'Competitive Advantage',
    tagline: 'Job hunting is zero-sum. Only one candidate gets the offer.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Minimum',
        name: 'Baseline',
        subtitle: 'Self-guided question library and basic tips.',
        priceMonthly: '£19',
        billingNote: 'per month · bare minimum',
        positioning: 'Defines the bare minimum required to show up to an interview.',
        psychologicalNudge:
          'When five finalists have similar resumes, bare-minimum preparation is the fastest way to lose the role.',
        ctaLabel: 'Stay on Baseline',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: false },
          {
            text: 'Grill Me™ Socratic Stress-Test Questioning',
            included: false,
          },
          {
            text: 'Negotiation Scripts & 1-on-1 Closing Strategy',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Contender',
        name: 'Competitive Edge',
        subtitle: 'AI mock feedback, company-specific insights, and answer scoring.',
        priceMonthly: '£69',
        billingNote: 'per month · contender tier',
        positioning: 'Lets you compete seriously, though without deep-dive stress-testing.',
        psychologicalNudge:
          'You can compete with the shortlist, but you are still missing the closing advantage when the panel presses hard.',
        ctaLabel: 'Select Competitive Edge',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: true },
          {
            text: 'Grill Me™ Socratic Stress-Test Questioning',
            included: false,
          },
          {
            text: 'Negotiation Scripts & 1-on-1 Closing Strategy',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Winner',
        name: 'Unfair Advantage',
        subtitle:
          'Full-suite platform including deep-dive grilling, negotiation scripts, and custom framing.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning: 'Why leave your dream job to chance when you can rehearse every branch?',
        psychologicalNudge:
          'Why leave your dream job to chance? Stress-test every metric and walk in with your negotiation script ready.',
        ctaLabel: 'Choose Unfair Advantage',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: true },
          {
            text: 'Grill Me™ Socratic Stress-Test Questioning',
            included: true,
            highlight: true,
          },
          {
            text: 'Negotiation Scripts & 1-on-1 Closing Strategy',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
};

const TIER_STORAGE_KEY = 'roleready_subscription_tier_v1';
const FRAMEWORK_STORAGE_KEY = 'roleready_tier_framework_v1';
const TIER_CHANGE_EVENT = 'roleready:tier-change';

export function getStoredTier(): TierLevel {
  try {
    const val = localStorage.getItem(TIER_STORAGE_KEY);
    if (val === 'tier1' || val === 'tier2' || val === 'tier3') return val;
  } catch {
    // ignore storage errors
  }
  return 'tier1';
}

export function getStoredFramework(): TierFrameworkId {
  try {
    const val = localStorage.getItem(FRAMEWORK_STORAGE_KEY);
    if (val === 'outcome' || val === 'ambition' || val === 'competitive') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'outcome';
}

export function setStoredTier(tier: TierLevel): void {
  try {
    localStorage.setItem(TIER_STORAGE_KEY, tier);
    window.dispatchEvent(new CustomEvent(TIER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function setStoredFramework(framework: TierFrameworkId): void {
  try {
    localStorage.setItem(FRAMEWORK_STORAGE_KEY, framework);
    window.dispatchEvent(new CustomEvent(TIER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function useSubscriptionTier() {
  const [tier, setTierState] = useState<TierLevel>(() => getStoredTier());
  const [framework, setFrameworkState] = useState<TierFrameworkId>(() =>
    getStoredFramework()
  );

  useEffect(() => {
    const handleSync = () => {
      setTierState(getStoredTier());
      setFrameworkState(getStoredFramework());
    };
    window.addEventListener(TIER_CHANGE_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(TIER_CHANGE_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setTier = useCallback((next: TierLevel) => {
    setTierState(next);
    setStoredTier(next);
  }, []);

  const setFramework = useCallback((next: TierFrameworkId) => {
    setFrameworkState(next);
    setStoredFramework(next);
  }, []);

  const activeFramework = TIER_FRAMEWORKS[framework];
  const currentTierDef =
    activeFramework.tiers.find((t) => t.level === tier) ??
    activeFramework.tiers[0];
  const tier3Def = activeFramework.tiers[2];

  return {
    tier,
    setTier,
    framework,
    setFramework,
    activeFramework,
    currentTierDef,
    tier3Def,
    isTier3Unlocked: tier === 'tier3',
  };
}

export interface GrillFrontierQuestion {
  id: string;
  code: 'Q1' | 'Q2';
  title: string;
  prompt: string;
  hiddenRiskTested: string;
  recommendedAnswer: string;
}

export interface GrillRound {
  roundNumber: 1 | 2;
  roundTitle: string;
  frontierSummary: string;
  questions: [GrillFrontierQuestion, GrillFrontierQuestion];
}

export interface GrillTreePlan {
  rounds: [GrillRound, GrillRound];
  negotiationScript: {
    anchorHeadline: string;
    spokenScript: string;
    leveragePoint: string;
  };
}

export function buildGrillRoundsForQuestion(
  question: Question,
  resumeLines: ResumeLine[],
  jdItems: JdRequirement[],
  feedback?: Feedback,
  roleTitle?: string | null,
  company?: string | null
): GrillTreePlan {
  const citedResume = resumeLines.find((r) =>
    question.resume_refs.includes(r.id)
  );
  const citedJd = jdItems.find((j) => question.jd_refs.includes(j.id));

  const resumeId = citedResume?.id ?? question.resume_refs[0] ?? 'R1';
  const jdId = citedJd?.id ?? question.jd_refs[0] ?? 'J1';
  const resumeSnippet =
    citedResume?.text ??
    'your quantified project delivery and cross-functional execution on this initiative';
  const jdSnippet =
    citedJd?.text ??
    'owning end-to-end delivery and measurable business impact in this role';

  const targetRole = roleTitle || 'Senior Role';
  const targetCompany = company || 'the hiring team';

  return {
    rounds: [
      {
        roundNumber: 1,
        roundTitle: 'Frontier Round 1 · Counterfactual & Metric Stress-Test',
        frontierSummary: `Probing the primary causal link between your resume evidence (${resumeId}) and the role requirement (${jdId}).`,
        questions: [
          {
            id: `${question.id}-r1-q1`,
            code: 'Q1',
            title: 'Isolating your personal contribution from team momentum',
            prompt: `In ${resumeId} you cite "${resumeSnippet}". If I spoke to the engineering or product lead on that project today, what specific decision would they say only happened because you were in the room, and what metric would have stayed flat without your intervention?`,
            hiddenRiskTested:
              'Tests whether you owned the bottleneck or merely participated in a successful team launch.',
            recommendedAnswer: `Anchor on the exact diagnostic step you led in ${resumeId}: state the baseline metric before your change, name the trade-off you proposed, and tie the resulting lift directly to ${jdId}.`,
          },
          {
            id: `${question.id}-r1-q2`,
            code: 'Q2',
            title: 'Defending the trade-off under resource constraints',
            prompt: `To deliver on "${jdSnippet}" (${jdId}) at ${targetCompany}, what did you deliberately choose not to build or analyse during ${resumeId}, and how did you convince sceptical stakeholders that cutting that scope was safe?`,
            hiddenRiskTested:
              'Tests executive prioritisation and whether you fold when a senior panel challenges your methodology.',
            recommendedAnswer: `Explain the higher-effort option you rejected, quantify the weeks saved, and show how you monitored the downside risk during the first 30 days after launch.`,
          },
        ],
      },
      {
        roundNumber: 2,
        roundTitle: 'Frontier Round 2 · Failure Mode & Day-90 Transfer',
        frontierSummary:
          'Round 1 settled your ownership. Round 2 pushes the decision tree to edge-case failure modes and first-quarter execution.',
        questions: [
          {
            id: `${question.id}-r2-q1`,
            code: 'Q1',
            title: 'When your primary assumption breaks in production',
            prompt: `Suppose you apply the exact playbook from ${resumeId} to ${targetCompany} in your first 60 days, and the leading indicator moves in the opposite direction. What is the first instrumentation check you run, and at what threshold do you roll back?`,
            hiddenRiskTested:
              'Tests intellectual honesty, kill-criteria discipline, and operational maturity under pressure.',
            recommendedAnswer:
              feedback?.one_fix
                ? `Incorporate your top scorecard fix ("${feedback.one_fix}") and define a clear 14-day guardrail metric before scaling the rollout.`
                : `Define a pre-committed guardrail metric, segment the cohort by user tenure, and state the exact rollback trigger you share with leadership on day one.`,
          },
          {
            id: `${question.id}-r2-q2`,
            code: 'Q2',
            title: 'Executive alignment across competing KPIs',
            prompt: `Requirement ${jdId} often creates friction between speed of shipping and data rigour. Tell me about a moment during ${resumeId} where two senior leaders disagreed on the target metric—how did you break the tie without delaying the release?`,
            hiddenRiskTested:
              'Tests whether you can operate at a principal/lead level without needing a manager to resolve cross-functional deadlocks.',
            recommendedAnswer: `Show how you reframed the disagreement into a time-boxed experiment with a shared primary metric (${resumeId}) and a secondary guardrail metric (${jdId}).`,
          },
        ],
      },
    ],
    negotiationScript: {
      anchorHeadline: `Offer Negotiation Script · ${targetRole} at ${targetCompany}`,
      leveragePoint: `Uses your verified proof in ${resumeId} directly against their core requirement in ${jdId}.`,
      spokenScript: `"Thank you—I’m genuinely excited about the team and the scope we discussed around ${jdId}. Because I’ve already delivered this exact outcome in ${resumeId}, I can ramp without the usual 90-day learning curve and start moving that metric in quarter one. Based on that immediate impact, if we can move the base salary to the top of the band, I am ready to sign today."`,
    },
  };
}
