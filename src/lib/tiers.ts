import { useState, useEffect, useCallback } from 'react';
import type { Question, Feedback, ResumeLine, JdRequirement } from '@contracts';

export type TierLevel = 'tier1' | 'tier2' | 'tier3';
export type TierFrameworkId = 'outcome' | 'ambition' | 'competitive';
export type HeatLevel = 1 | 2 | 3 | 4;
export type InterviewerGender = 'female' | 'male';

export interface RoleGrillContext {
  industry: string;
  department: string;
  seniority: string;
  nicheFocus: string;
  uploadedFiles: string[];
  sharedLinks: string[];
}

export const DEFAULT_GRILL_CONTEXT: RoleGrillContext = {
  industry: 'FinTech & Payments',
  department: 'Product Management',
  seniority: 'C-Suite (CPO / VP Product)',
  nicheFocus: 'B2B Payment Orchestration, KYB Onboarding & Unit Economics',
  uploadedFiles: ['FinFlow_Q4_Board_Strategy_Deck.pdf'],
  sharedLinks: ['https://finflow.io/investor-relations/series-c-memo'],
};

export const INDUSTRY_OPTIONS = [
  'FinTech & Payments',
  'AI & Foundation Models',
  'Private Equity & Venture Capital',
  'Enterprise B2B SaaS',
  'Healthcare & Biotech',
  'Cybersecurity & Defence',
  'Management Consulting',
  'Consumer & Marketplaces',
];

export const DEPARTMENT_OPTIONS = [
  'Executive Leadership / General Management',
  'Product Management',
  'Software & Systems Engineering',
  'Data Science & Quantitative Analytics',
  'Finance, Strategy & CorpDev',
  'Commercial, GTM & Revenue',
  'Operations & Risk',
];

export const SENIORITY_OPTIONS = [
  'Mid-Level IC (L4–L5)',
  'Senior / Staff / Principal IC (L6–L8)',
  'Director / Head of Department',
  'VP / SVP / Managing Director',
  'C-Suite (CEO, CTO, CFO, CPO, COO, CRO)',
  'Board Member / Operating Partner',
];

export interface HeatLevelMeta {
  level: HeatLevel;
  name: string;
  shortLabel: string;
  timeLimitSeconds: number;
  description: string;
  badgeClass: string;
}

export const HEAT_LEVELS: Record<HeatLevel, HeatLevelMeta> = {
  1: {
    level: 1,
    name: 'Warm Rehearsal',
    shortLabel: 'Warm',
    timeLimitSeconds: 120,
    description:
      'Supportive coaching tone. Helps you organise your STAR story and surface missing metrics without time pressure.',
    badgeClass: 'border-[#30d158]/40 bg-[#30d158]/15 text-[#30d158]',
  },
  2: {
    level: 2,
    name: 'Panel Pressure',
    shortLabel: 'Panel',
    timeLimitSeconds: 90,
    description:
      'Realistic cross-functional hiring panel. Probes your methodology, stakeholder alignment, and role fit.',
    badgeClass: 'border-[#2997ff]/40 bg-[#0071e3]/20 text-[#2997ff]',
  },
  3: {
    level: 3,
    name: 'Bar-Raiser Grill',
    shortLabel: 'Grill',
    timeLimitSeconds: 75,
    description:
      'Sceptical bar-raiser cross-examination. Isolates personal ownership from team momentum and challenges trade-offs.',
    badgeClass: 'border-[#ff9f0a]/45 bg-[#ff9f0a]/15 text-[#ff9f0a]',
  },
  4: {
    level: 4,
    name: 'Executive Roast',
    shortLabel: 'Roast',
    timeLimitSeconds: 60,
    description:
      'Maximum heat. Unfiltered C-Suite & Board-level stress test that attacks weak assumptions, P&L risk, and filler words under a 60s clock.',
    badgeClass: 'border-[#ff453a]/50 bg-[#ff453a]/20 text-[#ff453a]',
  },
};

export interface InterviewerPersona {
  gender: InterviewerGender;
  name: string;
  title: string;
  styleNote: string;
  pitch: number;
  rateByHeat: Record<HeatLevel, number>;
}

export const INTERVIEWER_PERSONAS: Record<InterviewerGender, InterviewerPersona> = {
  female: {
    gender: 'female',
    name: 'Elena Vance',
    title: 'Managing Partner & Bar-Raiser',
    styleNote: ' Crisp, analytical, zeroes in on commercial leverage and governance.',
    pitch: 1.04,
    rateByHeat: { 1: 0.96, 2: 1.0, 3: 1.05, 4: 1.1 },
  },
  male: {
    gender: 'male',
    name: 'Marcus Sterling',
    title: 'Chief Product & Technology Officer',
    styleNote: 'Direct, metric-driven, challenges architectural and operational trade-offs.',
    pitch: 0.92,
    rateByHeat: { 1: 0.96, 2: 1.0, 3: 1.05, 4: 1.1 },
  },
};

export interface DeliveryComposureMetrics {
  calmScore: number; // 0..100
  calmLabel: string;
  latencySeconds: number;
  latencyVerdict: string;
  wpm: number;
  wpmVerdict: string;
  fillerCount: number;
  fillerWordsFound: string[];
  durationSeconds: number;
  timeBoxTargetSeconds: number;
  coachingNote: string;
}

const FILLER_PATTERNS = [
  'um',
  'uh',
  'erm',
  'like',
  'basically',
  'honestly',
  'sort of',
  'kind of',
  'i guess',
  'you know',
  'maybe',
];

export function evaluateDeliveryComposure(
  text: string,
  durationSeconds: number,
  latencySeconds: number,
  heat: HeatLevel
): DeliveryComposureMetrics {
  const timeBoxTargetSeconds = HEAT_LEVELS[heat].timeLimitSeconds;
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  const effectiveDuration = Math.max(durationSeconds, Math.round(wordCount / 2.3), 8);
  const wpm = wordCount > 0 ? Math.round((wordCount / effectiveDuration) * 60) : 138;

  const lower = text.toLowerCase();
  const fillerWordsFound: string[] = [];
  let fillerCount = 0;

  for (const pat of FILLER_PATTERNS) {
    const regex = new RegExp(`\\b${pat}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      fillerCount += matches.length;
      fillerWordsFound.push(`${pat} (${matches.length}×)`);
    }
  }

  let calmScore = 92;
  if (fillerCount > 0) calmScore -= Math.min(24, fillerCount * 6);
  if (latencySeconds > 4.5) calmScore -= 10;
  if (wpm > 180 || wpm < 95) calmScore -= 12;
  if (effectiveDuration > timeBoxTargetSeconds + 15) calmScore -= 10;
  if (wordCount >= 25 && /\d+%|\$\d+|\d+x|\b\d+\b/.test(text)) {
    calmScore = Math.min(98, calmScore + 5);
  }
  calmScore = Math.max(45, Math.min(98, calmScore));

  const calmLabel =
    calmScore >= 85
      ? 'Composed · Executive presence'
      : calmScore >= 70
        ? 'Steady · Minor pacing drift'
        : 'Pressured · Tighten delivery';

  const latencyVerdict =
    latencySeconds <= 2.8
      ? `${latencySeconds.toFixed(1)}s · Immediate command`
      : latencySeconds <= 4.5
        ? `${latencySeconds.toFixed(1)}s · Measured pause`
        : `${latencySeconds.toFixed(1)}s · Hesitation detected`;

  const wpmVerdict =
    wpm >= 120 && wpm <= 165
      ? `${wpm} WPM · Executive cadence`
      : wpm > 165
        ? `${wpm} WPM · Rushed under pressure`
        : `${wpm} WPM · Slow pacing`;

  let coachingNote =
    'You held a steady executive cadence, opened without hesitation, and backed your rebuttal with concrete numbers.';
  if (fillerCount > 0) {
    coachingNote = `Cut hedging words (${fillerWordsFound.slice(0, 3).join(', ')}) and replace them with a silent 1-second pause before stating your metric.`;
  } else if (wpm > 165) {
    coachingNote =
      'Slow your cadence by 15% on the headline metric so the hiring chair absorbs the business impact.';
  } else if (effectiveDuration > timeBoxTargetSeconds) {
    coachingNote = `In ${HEAT_LEVELS[heat].name} mode, land your bottom-line metric within the first ${timeBoxTargetSeconds} seconds.`;
  }

  return {
    calmScore,
    calmLabel,
    latencySeconds,
    latencyVerdict,
    wpm,
    wpmVerdict,
    fillerCount,
    fillerWordsFound,
    durationSeconds: effectiveDuration,
    timeBoxTargetSeconds,
    coachingNote,
  };
}

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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
          'Gets you through standard first-pass questions, but leaves out AI voice grilling, the Roast heat dial, composure timing, and offer negotiation.',
        ctaLabel: 'Select Interview Ready',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & model answer rewrites', included: true },
          {
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Hired Elite',
        name: 'Offer Secured',
        subtitle:
          'End-to-end strategy, executive AI voice grilling, heat dial, and offer negotiation.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for high-stakes panel and C-Suite loops where interviewers probe three layers deep under time pressure.',
        psychologicalNudge:
          'Directly connects your preparation to staying calm under fire, landing the offer, and negotiating a higher base salary.',
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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: true,
            highlight: true,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
          'Helps you reach the final three candidates, where C-Suite and bar-raiser panels start stress-testing every trade-off aloud.',
        ctaLabel: 'Select Shortlist',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: true },
          {
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · The Choice Hire',
        name: 'Top Candidate',
        subtitle:
          'Tailored AI voice interviews, C-Suite context packs, heat dial, and live composure scoring.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Shortlist',
        positioning:
          'Designed for high-achieving professionals who refuse to settle for mid-tier preparation.',
        psychologicalNudge:
          'Walk into the final loop having already been grilled aloud on every branch of your decision tree.',
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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: true,
            highlight: true,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
        positioning: 'Lets you compete seriously, though without voice stress-testing or heat control.',
        psychologicalNudge:
          'You can compete with the shortlist, but you are still missing the closing advantage when the panel turns up the heat.',
        ctaLabel: 'Select Competitive Edge',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Full 4-dimension rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: true },
          {
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: false,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Winner',
        name: 'Unfair Advantage',
        subtitle:
          'Full-suite platform including AI voice roasting, C-Suite context, timing telemetry, and negotiation scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning: 'Why leave your dream job to chance when you can rehearse every branch aloud?',
        psychologicalNudge:
          'Why leave your dream job to chance? Get roasted in private so the real panel feels easy.',
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
            text: 'Grill Me™ AI Voice Stress-Test (Male/Female Interviewer + Heat Dial)',
            included: true,
            highlight: true,
          },
          {
            text: 'Niche C-Suite Context Uploads, Composure Timing & Offer Scripts',
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
const CONTEXT_STORAGE_KEY = 'roleready_grill_context_v1';
const HEAT_STORAGE_KEY = 'roleready_grill_heat_v1';
const GENDER_STORAGE_KEY = 'roleready_interviewer_gender_v1';
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

export function getStoredGrillContext(): RoleGrillContext {
  try {
    const raw = localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RoleGrillContext>;
      return {
        industry: parsed.industry || DEFAULT_GRILL_CONTEXT.industry,
        department: parsed.department || DEFAULT_GRILL_CONTEXT.department,
        seniority: parsed.seniority || DEFAULT_GRILL_CONTEXT.seniority,
        nicheFocus: parsed.nicheFocus || DEFAULT_GRILL_CONTEXT.nicheFocus,
        uploadedFiles: Array.isArray(parsed.uploadedFiles)
          ? parsed.uploadedFiles
          : DEFAULT_GRILL_CONTEXT.uploadedFiles,
        sharedLinks: Array.isArray(parsed.sharedLinks)
          ? parsed.sharedLinks
          : DEFAULT_GRILL_CONTEXT.sharedLinks,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_GRILL_CONTEXT;
}

export function getStoredHeat(): HeatLevel {
  try {
    const val = Number(localStorage.getItem(HEAT_STORAGE_KEY));
    if (val === 1 || val === 2 || val === 3 || val === 4) return val;
  } catch {
    // ignore
  }
  return 3;
}

export function getStoredGender(): InterviewerGender {
  try {
    const val = localStorage.getItem(GENDER_STORAGE_KEY);
    if (val === 'female' || val === 'male') return val;
  } catch {
    // ignore
  }
  return 'female';
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

export function setStoredGrillContext(ctx: RoleGrillContext): void {
  try {
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
    window.dispatchEvent(new CustomEvent(TIER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function setStoredHeat(heat: HeatLevel): void {
  try {
    localStorage.setItem(HEAT_STORAGE_KEY, String(heat));
    window.dispatchEvent(new CustomEvent(TIER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function setStoredGender(gender: InterviewerGender): void {
  try {
    localStorage.setItem(GENDER_STORAGE_KEY, gender);
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
  const [grillContext, setGrillContextState] = useState<RoleGrillContext>(() =>
    getStoredGrillContext()
  );
  const [heat, setHeatState] = useState<HeatLevel>(() => getStoredHeat());
  const [interviewerGender, setInterviewerGenderState] =
    useState<InterviewerGender>(() => getStoredGender());

  useEffect(() => {
    const handleSync = () => {
      setTierState(getStoredTier());
      setFrameworkState(getStoredFramework());
      setGrillContextState(getStoredGrillContext());
      setHeatState(getStoredHeat());
      setInterviewerGenderState(getStoredGender());
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

  const updateGrillContext = useCallback((next: RoleGrillContext) => {
    setGrillContextState(next);
    setStoredGrillContext(next);
  }, []);

  const setHeat = useCallback((next: HeatLevel) => {
    setHeatState(next);
    setStoredHeat(next);
  }, []);

  const setInterviewerGender = useCallback((next: InterviewerGender) => {
    setInterviewerGenderState(next);
    setStoredGender(next);
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
    grillContext,
    updateGrillContext,
    heat,
    setHeat,
    interviewerGender,
    setInterviewerGender,
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
  company?: string | null,
  context: RoleGrillContext = DEFAULT_GRILL_CONTEXT,
  heat: HeatLevel = 3
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
  const uploadedArtifact =
    context.uploadedFiles[0] || 'your supplemental strategy brief';
  const sharedLink =
    context.sharedLinks[0] || 'the company investor & product roadmap';

  const heatPrefixRound1 =
    heat === 1
      ? `Let's rehearse your ${context.seniority} narrative for ${context.industry}:`
      : heat === 2
        ? `Speaking as the ${context.department} panel for ${targetCompany}:`
        : heat === 3
          ? `Bar-Raiser challenge for ${context.seniority} (${context.industry}):`
          : `Executive Roast (${context.seniority} · 60s clock · zero fluff):`;

  const q1PromptByHeat =
    heat === 4
      ? `${heatPrefixRound1} In ${resumeId} you claim "${resumeSnippet}". We cross-checked ${uploadedArtifact} and ${sharedLink}. Strip away the team halo: if we called your former CFO or VP of Engineering right now, would they credit you for that number, or did you ride a macro tailwind? Give me the exact unit-economic proof in 60 seconds.`
      : `${heatPrefixRound1} In ${resumeId} you cite "${resumeSnippet}". Given the ${context.nicheFocus || context.industry} context in ${uploadedArtifact}, what specific decision only happened because you were in the room, and what metric would have stayed flat without your intervention?`;

  const q2PromptByHeat =
    heat === 4
      ? `Look at requirement ${jdId} ("${jdSnippet}") alongside ${sharedLink}. At the ${context.seniority} level, saying you "collaborated" is a red flag. What high-profile initiative did you kill to fund ${resumeId}, and whose budget did you take to make it happen?`
      : `To deliver on "${jdSnippet}" (${jdId}) for a ${context.seniority} seat in ${context.department}, what did you deliberately choose not to build during ${resumeId}, and how did you align sceptical stakeholders around that trade-off?`;

  const r2q1PromptByHeat =
    heat === 4
      ? `Board-level failure scenario: You deploy your ${resumeId} playbook at ${targetCompany}, and within 45 days churn spikes and unit margins compress against the targets in ${sharedLink}. Don't give me theory: what is the exact kill-switch metric you pull, and how do you defend that reversal to the C-Suite?`
      : `Suppose you apply the playbook from ${resumeId} to ${targetCompany} (${context.industry}) in your first 60 days, and the leading indicator moves in the opposite direction. What is the first check you run, and at what threshold do you roll back?`;

  return {
    rounds: [
      {
        roundNumber: 1,
        roundTitle: `Frontier Round 1 · ${HEAT_LEVELS[heat].name} (${context.seniority})`,
        frontierSummary: `Cross-examining resume line ${resumeId}, requirement ${jdId}, ${uploadedArtifact}, and ${context.industry} benchmarks.`,
        questions: [
          {
            id: `${question.id}-r1-q1`,
            code: 'Q1',
            title: 'Isolating personal attribution vs. team tailwinds',
            prompt: q1PromptByHeat,
            hiddenRiskTested: `Tests whether your ${resumeId} claim holds up under ${context.seniority} scrutiny in ${context.industry}.`,
            recommendedAnswer: `Anchor on the exact diagnostic step you led in ${resumeId}: state the baseline metric before your change, reference how it aligns with ${uploadedArtifact}, and tie the resulting lift directly to ${jdId}.`,
          },
          {
            id: `${question.id}-r1-q2`,
            code: 'Q2',
            title: 'Defending capital & scope trade-offs',
            prompt: q2PromptByHeat,
            hiddenRiskTested: `Tests ${context.seniority} capital allocation discipline and whether you fold when challenged on ${jdId}.`,
            recommendedAnswer: `Explain the lower-ROI option you killed, quantify the engineering/commercial capacity saved, and connect that discipline to the priorities in ${sharedLink}.`,
          },
        ],
      },
      {
        roundNumber: 2,
        roundTitle: `Frontier Round 2 · Failure Mode & ${context.seniority} Governance`,
        frontierSummary:
          'Round 1 settled your ownership. Round 2 pushes the decision tree to production failure modes, kill criteria, and board/executive alignment.',
        questions: [
          {
            id: `${question.id}-r2-q1`,
            code: 'Q1',
            title: 'When your primary assumption breaks under fire',
            prompt: r2q1PromptByHeat,
            hiddenRiskTested:
              'Tests intellectual honesty, kill-criteria discipline, and composure when a senior panel attacks your plan.',
            recommendedAnswer:
              feedback?.one_fix
                ? `Incorporate your top scorecard fix ("${feedback.one_fix}") and define a clear 14-day guardrail metric before scaling the rollout.`
                : `Define a pre-committed guardrail metric, segment the cohort by customer tier, and state the exact rollback trigger you establish with leadership on day one.`,
          },
          {
            id: `${question.id}-r2-q2`,
            code: 'Q2',
            title: `Resolving ${context.department} vs. C-Suite deadlocks`,
            prompt: `Requirement ${jdId} in ${context.industry} often creates tension between short-term revenue velocity and long-term platform resilience. Walk me through a moment during ${resumeId} where two senior leaders deadlocked on the target metric: how did you break the tie without slipping the quarter?`,
            hiddenRiskTested: `Tests whether you operate with true ${context.seniority} gravitas across ${context.department}.`,
            recommendedAnswer: `Show how you reframed the deadlock into a time-boxed experiment with a shared primary metric (${resumeId}) and a downside guardrail metric (${jdId}).`,
          },
        ],
      },
    ],
    negotiationScript: {
      anchorHeadline: `Offer Negotiation Script · ${targetRole} (${context.seniority})`,
      leveragePoint: `Combines your verified proof in ${resumeId}, ${jdId}, and ${context.industry} context (${uploadedArtifact}).`,
      spokenScript: `"Thank you, I am excited about leading this scope in ${context.department} and delivering on ${jdId}. Because I have already executed this exact playbook in ${resumeId} within ${context.industry}, I can compress the ramp-up window and start moving the commercial needle in quarter one. Given that immediate ${context.seniority} impact, if we can position the base compensation at the top of the band, I am ready to sign and start."`,
    },
  };
}
