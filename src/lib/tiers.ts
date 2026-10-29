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
  nicheFocus: 'B2B payment flows, KYB onboarding, and checkout conversion',
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
      'Friendly coaching tone. Helps you structure your story and bring out the numbers on your resume without clock pressure.',
    badgeClass: 'border-[#30d158]/40 bg-[#30d158]/15 text-[#30d158]',
  },
  2: {
    level: 2,
    name: 'Panel Pressure',
    shortLabel: 'Panel',
    timeLimitSeconds: 90,
    description:
      'Standard hiring panel follow-ups. Tests your method, how you worked with other teams, and how your work fits the role.',
    badgeClass: 'border-[#2997ff]/40 bg-[#0071e3]/20 text-[#2997ff]',
  },
  3: {
    level: 3,
    name: 'Bar-Raiser Grill',
    shortLabel: 'Grill',
    timeLimitSeconds: 75,
    description:
      'Tough follow-up questioning. Separates what you personally did from what your team did and presses on your trade-offs.',
    badgeClass: 'border-[#ff9f0a]/45 bg-[#ff9f0a]/15 text-[#ff9f0a]',
  },
  4: {
    level: 4,
    name: 'Executive Roast',
    shortLabel: 'Roast',
    timeLimitSeconds: 60,
    description:
      'Maximum heat. C-Suite and board-level questioning that challenges weak assumptions, unit costs, and filler words on a 60-second clock.',
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
    styleNote: 'Direct and analytical. Presses on revenue impact, unit costs, and board reporting.',
    pitch: 1.04,
    rateByHeat: { 1: 0.96, 2: 1.0, 3: 1.05, 4: 1.1 },
  },
  male: {
    gender: 'male',
    name: 'Marcus Sterling',
    title: 'Chief Product & Technology Officer',
    styleNote: 'Focused on numbers, system bottlenecks, and what you cut to ship on time.',
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
      ? 'Calm under pressure'
      : calmScore >= 70
        ? 'Steady · slight pace drift'
        : 'Rushed · slow down';

  const latencyVerdict =
    latencySeconds <= 2.8
      ? `${latencySeconds.toFixed(1)}s · Clear start`
      : latencySeconds <= 4.5
        ? `${latencySeconds.toFixed(1)}s · Brief pause`
        : `${latencySeconds.toFixed(1)}s · Slow start`;

  const wpmVerdict =
    wpm >= 120 && wpm <= 165
      ? `${wpm} WPM · Steady pace`
      : wpm > 165
        ? `${wpm} WPM · Speaking fast`
        : `${wpm} WPM · Speaking slow`;

  let coachingNote =
    'You started without hesitation, kept a steady pace, and backed your point with specific numbers.';
  if (fillerCount > 0) {
    coachingNote = `Cut filler words (${fillerWordsFound.slice(0, 3).join(', ')}) and pause for one second before stating your main number.`;
  } else if (wpm > 165) {
    coachingNote =
      'Slow down by about 15% when you state the final result so the interviewer catches the number.';
  } else if (effectiveDuration > timeBoxTargetSeconds) {
    coachingNote = `In ${HEAT_LEVELS[heat].name} mode, state your main result within ${timeBoxTargetSeconds} seconds.`;
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
    tagline: 'From basic screening practice to final-round voice grilling and salary negotiation.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Entry',
        name: 'Essential Prep',
        subtitle: 'Basic practice for lower-stakes interviews.',
        priceMonthly: '£19',
        billingNote: 'per month · basic access',
        positioning: 'Covers first-round screening questions for lower-stakes roles.',
        psychologicalNudge:
          'Covers surface-level questions only. Candidates rejected in final panel rounds usually stop their practice here.',
        ctaLabel: 'Stay on Essential Prep',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & stronger answer rewrites', included: false },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Standard',
        name: 'Interview Ready',
        subtitle: 'Practice and rewrites for standard mid-level roles.',
        priceMonthly: '£69',
        billingNote: 'per month · standard prep',
        positioning: 'The baseline for candidates entering standard mid-level interviews.',
        psychologicalNudge:
          'Covers standard first-pass questions, but leaves out AI voice grilling, the Roast heat dial, voice timing scores, and salary negotiation.',
        ctaLabel: 'Select Interview Ready',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & stronger answer rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Hired Elite',
        name: 'Offer Secured',
        subtitle:
          'Executive AI voice grilling, adjustable heat dial, C-Suite context, and salary negotiation scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for panel and C-Suite interviews where hiring managers push three questions deep under time pressure.',
        psychologicalNudge:
          'Helps you stay calm under tough follow-up questions, land the offer, and negotiate a higher base salary.',
        ctaLabel: 'Choose Offer Secured',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Unlimited re-drills & stronger answer rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
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
    tagline: 'Decide whether you prepare like another applicant or the choice hire.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Entry',
        name: 'Applicant',
        subtitle: 'Standard tools to get through the initial screening.',
        priceMonthly: '£19',
        billingNote: 'per month · screening tier',
        positioning: 'Standard tools to get through the first recruiter call.',
        psychologicalNudge:
          'Keeps you at the same preparation level as everyone else in the general applicant pool.',
        ctaLabel: 'Stay as Applicant',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: false },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
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
        positioning: 'Gets you onto the shortlist for standard behavioral and technical rounds.',
        psychologicalNudge:
          'Helps you reach the final three candidates, where C-Suite and bar-raiser panels start testing every trade-off aloud.',
        ctaLabel: 'Select Shortlist',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · The Choice Hire',
        name: 'Top Candidate',
        subtitle:
          'Tailored AI voice interviews, C-Suite context uploads, heat dial, and live timing feedback.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Shortlist',
        positioning:
          'Built for senior and executive candidates who want every weak spot tested before the real panel.',
        psychologicalNudge:
          'Walk into the final round having already answered the hardest follow-up questions aloud.',
        ctaLabel: 'Choose Top Candidate',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Panel-round behavioral & technical rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
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
    tagline: 'Five finalists may have similar resumes, and only one gets the offer.',
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Minimum',
        name: 'Baseline',
        subtitle: 'Self-guided question library and basic tips.',
        priceMonthly: '£19',
        billingNote: 'per month · bare minimum',
        positioning: 'The bare minimum required to show up to an interview.',
        psychologicalNudge:
          'When five finalists have similar resumes, bare-minimum preparation is the fastest way to lose the role.',
        ctaLabel: 'Stay on Baseline',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: false },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
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
        positioning: 'Lets you compete seriously, though without voice grilling or heat control.',
        psychologicalNudge:
          'You can compete with the shortlist, but you are still missing voice practice under pressure and salary scripts.',
        ctaLabel: 'Select Competitive Edge',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Winner',
        name: 'Unfair Advantage',
        subtitle:
          'AI voice roasting, C-Suite context files, timing feedback, and salary negotiation scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning: 'Why leave your dream job to chance when you can rehearse every branch aloud?',
        psychologicalNudge:
          'Why leave your dream job to chance? Get grilled in private so the real panel feels easy.',
        ctaLabel: 'Choose Unfair Advantage',
        isFlagship: true,
        highlightBadge: 'Best Value for High-Stakes Roles',
        roiAnchor:
          'A single successful offer negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          { text: 'Company-specific answer framing & rewrites', included: true },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'C-Suite context uploads, voice timing score & salary scripts',
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
    proofSummary: string;
    spokenScript: string;
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
    'your project results and cross-team delivery on this work';
  const jdSnippet =
    citedJd?.text ??
    'owning delivery and measurable business results in this role';

  const targetRole = roleTitle || 'Senior Role';
  const targetCompany = company || 'the hiring team';
  const uploadedDoc =
    context.uploadedFiles[0] || 'your strategy brief';
  const sharedLink =
    context.sharedLinks[0] || 'the company product roadmap';

  const heatPrefixRound1 =
    heat === 1
      ? `Warm rehearsal (${context.seniority} · ${context.industry}):`
      : heat === 2
        ? `Panel follow-up (${context.department} · ${targetCompany}):`
        : heat === 3
          ? `Bar-raiser challenge (${context.seniority} · ${context.industry}):`
          : `Executive roast (${context.seniority} · 60s clock):`;

  const q1PromptByHeat =
    heat === 4
      ? `${heatPrefixRound1} In ${resumeId} you state "${resumeSnippet}". We read ${uploadedDoc} and ${sharedLink}. If we called your former CFO or VP of Engineering today, would they credit you for that number, or did you ride a broader market trend? Give the exact numbers in 60 seconds.`
      : `${heatPrefixRound1} In ${resumeId} you cite "${resumeSnippet}". Given the ${context.nicheFocus || context.industry} focus in ${uploadedDoc}, what specific decision only happened because you were in the room, and what number would have stayed flat without your call?`;

  const q2PromptByHeat =
    heat === 4
      ? `Look at requirement ${jdId} ("${jdSnippet}") alongside ${sharedLink}. At the ${context.seniority} level, saying you "collaborated" does not answer the question. What project did you cut to fund ${resumeId}, and whose budget did you move to make it happen?`
      : `To deliver on "${jdSnippet}" (${jdId}) in a ${context.seniority} seat in ${context.department}, what did you choose not to build during ${resumeId}, and how did you get other leaders to agree to that cut?`;

  const r2q1PromptByHeat =
    heat === 4
      ? `Board-level failure test: You run your ${resumeId} playbook at ${targetCompany}, and within 45 days churn rises and margins drop against the targets in ${sharedLink}. What is the exact metric that tells you to pull the plug, and how do you explain that reversal to the board?`
      : `Suppose you apply the approach from ${resumeId} at ${targetCompany} (${context.industry}) in your first 60 days, and the main metric moves the wrong way. What is the first check you run, and at what number do you roll the change back?`;

  return {
    rounds: [
      {
        roundNumber: 1,
        roundTitle: `Round 1 · ${HEAT_LEVELS[heat].name} (${context.seniority})`,
        frontierSummary: `Checking resume line ${resumeId}, requirement ${jdId}, ${uploadedDoc}, and ${context.industry} benchmarks.`,
        questions: [
          {
            id: `${question.id}-r1-q1`,
            code: 'Q1',
            title: 'Your personal work vs. team momentum',
            prompt: q1PromptByHeat,
            hiddenRiskTested: `Checks whether your ${resumeId} result holds up under ${context.seniority} questioning in ${context.industry}.`,
            recommendedAnswer: `Start with the exact problem you spotted in ${resumeId}: state the number before your change, show how it connects to ${uploadedDoc}, and tie the final result directly to ${jdId}.`,
          },
          {
            id: `${question.id}-r1-q2`,
            code: 'Q2',
            title: 'Defending budget and scope cuts',
            prompt: q2PromptByHeat,
            hiddenRiskTested: `Checks how you make ${context.seniority} budget and scope decisions when challenged on ${jdId}.`,
            recommendedAnswer: `Name the lower-return option you cut, state the engineering or commercial time saved, and connect that decision to the priorities in ${sharedLink}.`,
          },
        ],
      },
      {
        roundNumber: 2,
        roundTitle: `Round 2 · What Happens When the Plan Breaks (${context.seniority})`,
        frontierSummary:
          'Round 1 covered your ownership. Round 2 tests what you do when a metric drops in production or two leaders disagree.',
        questions: [
          {
            id: `${question.id}-r2-q1`,
            code: 'Q1',
            title: 'When your main assumption breaks in production',
            prompt: r2q1PromptByHeat,
            hiddenRiskTested:
              'Checks whether you set clear rollback thresholds and stay calm when a senior panel challenges your plan.',
            recommendedAnswer:
              feedback?.one_fix
                ? `Use your top scorecard fix ("${feedback.one_fix}") and set a 14-day safety metric before rolling the change out to all users.`
                : `Name the safety metric you track in the first 14 days, split the data by customer size, and state the exact threshold where you roll back.`,
          },
          {
            id: `${question.id}-r2-q2`,
            code: 'Q2',
            title: `Breaking ${context.department} vs. C-Suite deadlocks`,
            prompt: `Requirement ${jdId} in ${context.industry} often creates friction between shipping fast and protecting margins. Walk me through a moment during ${resumeId} where two senior leaders disagreed on the target metric: how did you settle it without missing the deadline?`,
            hiddenRiskTested: `Checks whether you can resolve senior disagreements across ${context.department} without escalating to your boss.`,
            recommendedAnswer: `Show how you turned the disagreement into a two-week test with one shared main metric (${resumeId}) and one safety metric (${jdId}).`,
          },
        ],
      },
    ],
    negotiationScript: {
      anchorHeadline: `Salary Negotiation Script · ${targetRole} (${context.seniority})`,
      proofSummary: `Connects your proven result in ${resumeId} and ${uploadedDoc} directly to requirement ${jdId}.`,
      spokenScript: `"Thank you, I am excited about leading this work in ${context.department} and delivering on ${jdId}. Because I have already delivered this result in ${resumeId} within ${context.industry}, I can skip the usual 90-day ramp-up and start moving that number in quarter one. Given that direct ${context.seniority} fit, if we can set the base salary at the top of the band, I am ready to sign today."`,
    },
  };
}
