import { useState, useEffect, useCallback } from 'react';
import type { Question, Feedback, ResumeLine, JdRequirement } from '@contracts';

export type TierLevel = 'tier1' | 'tier2' | 'tier3';
export type TierFrameworkId =
  | 'outcome'
  | 'ambition'
  | 'competitive'
  | 'niche'
  | 'csuite';
export type HeatLevel = 1 | 2 | 3 | 4;
export type InterviewerGender = 'female' | 'male';

export interface RoleGrillContext {
  industry: string;
  department: string;
  seniority: string;
  nicheCategory: string;
  cSuiteCategory: string;
  nicheFocus: string;
  uploadedFiles: string[];
  sharedLinks: string[];
}

export const DEFAULT_GRILL_CONTEXT: RoleGrillContext = {
  industry: 'FinTech & Payments',
  department: 'Product Management',
  seniority: 'VP / SVP / Managing Director',
  nicheCategory: 'Regulated FinTech, KYB & Cross-Border Payments',
  cSuiteCategory: 'Chief Product Officer (CPO) / VP Product',
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
  'C-Suite Executive',
  'Board Member / Operating Partner',
];

export const NICHE_CATEGORY_OPTIONS = [
  'Regulated FinTech, KYB & Cross-Border Payments',
  'AI Agents, Model Evals & Inference Infrastructure',
  'PE Portfolio Turnaround & Post-Merger Integration',
  'Clinical Biotech, Trial Design & Regulatory Submissions',
  'Zero-Trust Security, Defence & Sovereign Cloud',
  'Quantitative Pricing, Risk & Market Microstructure',
  'Enterprise Usage Billing, PLG & Funnel Diagnostics',
  'Deep-Tech Hardware, Robotics & Supply Chain',
];

export const CSUITE_CATEGORY_OPTIONS = [
  'Chief Product Officer (CPO) / VP Product',
  'Chief Executive Officer (CEO) / Managing Director',
  'Chief Technology Officer (CTO) / VP Engineering',
  'Chief Financial Officer (CFO) / Head of CorpDev',
  'Chief Operating Officer (COO) / Transformation Lead',
  'Chief Revenue Officer (CRO) / Commercial Lead',
  'Chief Information Security Officer (CISO) / Chief Risk Officer',
  'Board Director / Operating Partner / Advisory',
  'Non-C-Suite (Specialist IC / Manager / Director Track)',
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
      'Maximum heat. C-Suite and niche domain questioning that challenges weak assumptions, unit costs, and filler words on a 60-second clock.',
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
    styleNote:
      'Direct and analytical. Presses on revenue impact, unit costs, and board reporting.',
    pitch: 1.04,
    rateByHeat: { 1: 0.96, 2: 1.0, 3: 1.05, 4: 1.1 },
  },
  male: {
    gender: 'male',
    name: 'Marcus Sterling',
    title: 'Chief Product & Technology Officer',
    styleNote:
      'Focused on numbers, system bottlenecks, and what you cut to ship on time.',
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
  const effectiveDuration = Math.max(
    durationSeconds,
    Math.round(wordCount / 2.3),
    8
  );
  const wpm =
    wordCount > 0 ? Math.round((wordCount / effectiveDuration) * 60) : 138;

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

export interface TierPillarCard {
  categoryTag: string;
  title: string;
  description: string;
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
  headline: string;
  subheadline: string;
  tagline: string;
  pillars: [TierPillarCard, TierPillarCard, TierPillarCard, TierPillarCard];
  tiers: [TierDefinition, TierDefinition, TierDefinition];
}

export const TIER_FRAMEWORKS: Record<TierFrameworkId, TierFramework> = {
  outcome: {
    id: 'outcome',
    label: 'Outcome-Driven',
    headline: 'Move from basic practice to a signed offer and higher pay',
    subheadline:
      'Built around the outcome you want: clearing final-round panel pushback and negotiating top-of-band compensation.',
    tagline:
      'Outcome focus: Move from first-round screening practice to a signed offer and higher base salary.',
    pillars: [
      {
        categoryTag: 'Niche Category',
        title: '1. Niche domain proof that converts to offers',
        description:
          'Upload case studies, technical RFCs, or product specs for your exact niche so every answer proves you can deliver results from week one.',
      },
      {
        categoryTag: 'C-Suite Category',
        title: '2. C-Suite & VP offer-closing readiness',
        description:
          'Practise commercial, P&L, and budget questions for CEO, CPO, CTO, and CFO panels so you close the loop on compensation.',
      },
      {
        categoryTag: 'Voice & Heat Dial',
        title: '3. AI Voice Interviewer & Roast Heat Dial',
        description:
          'Switch between Male and Female AI interviewers and turn the heat from Warm Rehearsal up to Executive Roast before your real panel.',
      },
      {
        categoryTag: 'Timing & Salary ROI',
        title: '4. Timed composure & salary negotiation scripts',
        description:
          'Measures response delay, speaking pace, and filler words under a countdown clock, then builds a custom salary script from your strongest answers.',
      },
    ],
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Entry',
        name: 'Essential Prep',
        subtitle: 'Basic practice for lower-stakes interviews.',
        priceMonthly: '£19',
        billingNote: 'per month · basic access',
        positioning:
          'Covers first-round screening questions for lower-stakes roles.',
        psychologicalNudge:
          'Covers surface-level questions only. Candidates rejected in final panel rounds usually stop their practice here.',
        ctaLabel: 'Stay on Essential Prep',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Unlimited re-drills & stronger answer rewrites',
            included: false,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
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
        positioning:
          'The baseline for candidates entering standard mid-level interviews.',
        psychologicalNudge:
          'Covers standard first-pass questions, but leaves out AI voice grilling, the Roast heat dial, Niche & C-Suite categories, and salary negotiation.',
        ctaLabel: 'Select Interview Ready',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Unlimited re-drills & stronger answer rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Hired Elite',
        name: 'Offer Secured',
        subtitle:
          'Executive AI voice grilling, adjustable heat dial, Niche & C-Suite context, and salary negotiation scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for panel, Niche, and C-Suite interviews where hiring managers push three questions deep under time pressure.',
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
          {
            text: 'Unlimited re-drills & stronger answer rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
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
    headline: 'Stop sounding like another applicant and speak like the choice hire',
    subheadline:
      'Matches your preparation to your career level, from clearing recruiter screens to owning the room in senior panels.',
    tagline:
      'Ambition focus: Step out of the general applicant pool and walk into the panel as the first-choice candidate.',
    pillars: [
      {
        categoryTag: 'Niche Category',
        title: '1. Specialist Niche authority over generalist talk',
        description:
          'Select your specialist niche category and link product memos or industry reports so you speak like an insider, not a tourist.',
      },
      {
        categoryTag: 'C-Suite Category',
        title: '2. C-Suite & executive presence in the room',
        description:
          'Tailors follow-up questions to the exact C-Suite seat (CEO, CPO, CTO, CFO, COO, CRO) so your answers match leadership expectations.',
      },
      {
        categoryTag: 'Voice & Heat Dial',
        title: '3. Rehearse aloud with Male or Female bar-raisers',
        description:
          'Practise speaking your answers out loud while adjusting the interviewer from supportive rehearsal to sceptical bar-raiser pushback.',
      },
      {
        categoryTag: 'Timing & Composure',
        title: '4. Executive pacing & zero-hesitation scoring',
        description:
          'Tracks how fast you begin answering, flags rambling or filler habits, and trains you to land your point in under 75 seconds.',
      },
    ],
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
          {
            text: 'Panel-round behavioral & technical rewrites',
            included: false,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
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
        positioning:
          'Gets you onto the shortlist for standard behavioral and technical rounds.',
        psychologicalNudge:
          'Helps you reach the final three candidates, where Niche and C-Suite panels start testing every trade-off aloud.',
        ctaLabel: 'Select Shortlist',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Panel-round behavioral & technical rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · The Choice Hire',
        name: 'Top Candidate',
        subtitle:
          'Tailored AI voice interviews, Niche & C-Suite categories, heat dial, and live timing feedback.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Shortlist',
        positioning:
          'Built for senior, Niche, and C-Suite candidates who want every weak spot tested before the real panel.',
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
          {
            text: 'Panel-round behavioral & technical rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
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
    headline: 'Five finalists have similar resumes, and only one wins the offer',
    subheadline:
      'Job hunting is zero-sum. Beat the other four finalists by stress-testing the exact follow-up questions that catch unprepared candidates off guard.',
    tagline:
      'Competitive focus: Why leave your target role to chance when four other finalists want the same seat?',
    pillars: [
      {
        categoryTag: 'Niche Category',
        title: '1. Out-prepare rivals on Niche edge cases',
        description:
          'Feed in competitor benchmarks, regulatory filings, and niche workflows so you have concrete numbers where other finalists give vague answers.',
      },
      {
        categoryTag: 'C-Suite Category',
        title: '2. Defend C-Suite trade-offs under cross-examination',
        description:
          'Rehearse the exact budget cuts, headcount trade-offs, and board pushback that separate the winning executive from the runner-up.',
      },
      {
        categoryTag: 'Voice & Heat Dial',
        title: '3. Train on Executive Roast so the real panel feels easy',
        description:
          'Turn the Heat Dial to 4/4 Roast with a Male or Female AI voice interviewer so live panel pressure never rattles your delivery.',
      },
      {
        categoryTag: 'Timing & Edge',
        title: '4. Cut hesitation and lock in top-band pay',
        description:
          'Eliminates slow starts and filler words under a 60-second clock, and gives you a word-for-word counter-offer script.',
      },
    ],
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
          {
            text: 'Company-specific answer framing & rewrites',
            included: false,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Contender',
        name: 'Competitive Edge',
        subtitle:
          'AI mock feedback, company-specific insights, and answer scoring.',
        priceMonthly: '£69',
        billingNote: 'per month · contender tier',
        positioning:
          'Lets you compete seriously, though without voice grilling or heat control.',
        psychologicalNudge:
          'You can compete with the shortlist, but you are still missing Niche & C-Suite voice grilling under pressure and salary scripts.',
        ctaLabel: 'Select Competitive Edge',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Company-specific answer framing & rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: false,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Winner',
        name: 'Unfair Advantage',
        subtitle:
          'AI voice roasting, Niche & C-Suite context files, timing feedback, and salary negotiation scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Why leave your dream job to chance when you can rehearse every branch aloud?',
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
          {
            text: 'Company-specific answer framing & rewrites',
            included: true,
          },
          {
            text: 'Grill Me AI Voice Interviewer (Male/Female) & Heat Dial (Warm to Roast)',
            included: true,
            highlight: true,
          },
          {
            text: 'Dedicated Niche & C-Suite categories, voice timing & salary scripts',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
  niche: {
    id: 'niche',
    label: 'Niche Specialist',
    headline: 'Deep-dive questioning built for specialist & technical niches',
    subheadline:
      'Generic interview prep fails when your role sits in regulated FinTech, AI infrastructure, biotech, quantitative risk, or post-merger turnarounds.',
    tagline:
      'Niche focus: Add domain files, technical specs, and URLs so every follow-up tests the exact edge cases of your field.',
    pillars: [
      {
        categoryTag: 'Niche Category',
        title: '1. Dedicated Niche domain selector & custom briefs',
        description:
          'Choose from Regulated FinTech, AI Evals & Infra, Biotech & GxP, Quant Risk, Zero-Trust Security, or type your own specialist mandate.',
      },
      {
        categoryTag: 'Uploads & Links',
        title: '2. Grounded in your uploaded RFCs, case studies & URLs',
        description:
          'Attach technical architecture docs, clinical protocols, or product roadmaps and share live company links to sharpen every follow-up question.',
      },
      {
        categoryTag: 'Voice & Heat Dial',
        title: '3. Domain-specific AI voice grilling (Warm to Roast)',
        description:
          'Have a Male or Female AI interviewer challenge your technical trade-offs, failure modes, and rollback plans aloud.',
      },
      {
        categoryTag: 'Timing & Scarcity Pay',
        title: '4. Precision timing & specialist scarcity negotiation',
        description:
          'Trains you to explain complex niche mechanisms concisely under a countdown clock and negotiate pay around rare domain expertise.',
      },
    ],
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · Generalist',
        name: 'Generalist Prep',
        subtitle: 'Standard questions without specialist domain context.',
        priceMonthly: '£19',
        billingNote: 'per month · generalist tier',
        positioning: 'Covers surface resume and job description matching only.',
        psychologicalNudge:
          'Specialist hiring managers spot generic, textbook answers within the first 90 seconds.',
        ctaLabel: 'Stay on Generalist Prep',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Technical & domain-specific answer rewrites',
            included: false,
          },
          {
            text: 'Niche category selector, RFC/case-study uploads & URL context',
            included: false,
          },
          {
            text: 'AI Voice Interviewer, Heat Dial & specialist salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Practitioner',
        name: 'Domain Ready',
        subtitle: 'Written practice and rewrites for mid-level technical roles.',
        priceMonthly: '£69',
        billingNote: 'per month · practitioner tier',
        positioning:
          'Helps refine written answers, but lacks custom niche file uploads and live voice stress-testing.',
        psychologicalNudge:
          'Gives you solid written drafts, but leaves out uploaded technical briefs, live voice pushback, and heat control.',
        ctaLabel: 'Select Domain Ready',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Technical & domain-specific answer rewrites',
            included: true,
          },
          {
            text: 'Niche category selector, RFC/case-study uploads & URL context',
            included: false,
          },
          {
            text: 'AI Voice Interviewer, Heat Dial & specialist salary scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Domain Authority',
        name: 'Niche Specialist Pro',
        subtitle:
          'Full Niche category engine, custom document & link ingestion, AI voice roasting, and scarcity-based salary scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for high-scarcity roles where deep domain fluency and edge-case mastery decide the hire.',
        psychologicalNudge:
          'Prove you have solved the exact technical or regulatory bottleneck the team is hiring for.',
        ctaLabel: 'Choose Niche Specialist Pro',
        isFlagship: true,
        highlightBadge: 'Best Value for Specialist & Technical Roles',
        roiAnchor:
          'Negotiating a specialist scarcity premium pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Technical & domain-specific answer rewrites',
            included: true,
          },
          {
            text: 'Niche category selector, RFC/case-study uploads & URL context',
            included: true,
            highlight: true,
          },
          {
            text: 'AI Voice Interviewer, Heat Dial & specialist salary scripts',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
  csuite: {
    id: 'csuite',
    label: 'C-Suite & Board',
    headline: 'Boardroom-level grilling for CEO, CPO, CTO, CFO, COO & VP roles',
    subheadline:
      'Executive panels skip textbook questions and press directly on capital allocation, unit economics, 90-day turnarounds, and board governance.',
    tagline:
      'C-Suite focus: Upload board decks, 10-Ks, and investor memos to rehearse high-heat executive cross-examination aloud.',
    pillars: [
      {
        categoryTag: 'C-Suite Category',
        title: '1. Dedicated C-Suite & Board seat selection',
        description:
          'Select CEO, CPO, CTO, CFO, COO, CRO, CISO, or Board Director so every question tests P&L ownership, capital allocation, and org design.',
      },
      {
        categoryTag: 'Board Decks & 10-Ks',
        title: '2. Ingest board decks, 10-Ks & investor memos',
        description:
          'Upload quarterly board packs, earnings transcripts, or strategy memos and link investor updates to simulate real boardroom questioning.',
      },
      {
        categoryTag: 'Executive Roast',
        title: '3. 60-second Executive Roast with AI voice partners',
        description:
          'Practise aloud with Elena Vance (Managing Partner) or Marcus Sterling (CPTO) at Heat 4/4 to defend your thesis under board pressure.',
      },
      {
        categoryTag: 'Executive Comp',
        title: '4. Board composure metrics & executive comp scripts',
        description:
          'Scores vocal steadiness, concise 60-second framing, and equips you with base, bonus, and equity negotiation scripts.',
      },
    ],
    tiers: [
      {
        level: 'tier1',
        badgeLabel: 'Tier 1 · IC Screening',
        name: 'Standard Screen',
        subtitle: 'Basic screening practice built for individual contributors.',
        priceMonthly: '£19',
        billingNote: 'per month · entry tier',
        positioning: 'Standard resume-to-JD questions without executive context.',
        psychologicalNudge:
          'Answering a C-Suite panel like a mid-level manager is the fastest way to lose board confidence.',
        ctaLabel: 'Stay on Standard Screen',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: 'Basic 0–100 answer score on first draft', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Leadership & P&L answer framing rewrites',
            included: false,
          },
          {
            text: 'Dedicated C-Suite seat category, board deck & 10-K uploads',
            included: false,
          },
          {
            text: 'Executive Roast AI Voice Interviewer & equity/comp scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier2',
        badgeLabel: 'Tier 2 · Director Track',
        name: 'Department Lead',
        subtitle: 'Written preparation for functional and department heads.',
        priceMonthly: '£69',
        billingNote: 'per month · director tier',
        positioning:
          'Covers functional leadership questions, but leaves out boardroom voice roasting and investor deck ingestion.',
        psychologicalNudge:
          'Prepares you for functional rounds, but stops short of live CEO, PE Operating Partner, and Board cross-examination.',
        ctaLabel: 'Select Department Lead',
        isDecoyBridge: true,
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Leadership & P&L answer framing rewrites',
            included: true,
          },
          {
            text: 'Dedicated C-Suite seat category, board deck & 10-K uploads',
            included: false,
          },
          {
            text: 'Executive Roast AI Voice Interviewer & equity/comp scripts',
            included: false,
          },
        ],
      },
      {
        level: 'tier3',
        badgeLabel: 'Tier 3 · Boardroom Elite',
        name: 'C-Suite & Board',
        subtitle:
          'Full C-Suite seat category, board deck & 10-K uploads, 60s Executive Roast voice grilling, and executive comp scripts.',
        priceMonthly: '£79',
        billingNote: 'per month · only £10 more than Tier 2',
        positioning:
          'Built for C-Suite executives, VPs, and Board candidates facing investor and board scrutiny.',
        psychologicalNudge:
          'Walk into the boardroom having already defended your 90-day plan, unit economics, and capital trade-offs aloud.',
        ctaLabel: 'Choose C-Suite & Board',
        isFlagship: true,
        highlightBadge: 'Best Value for Executive & C-Suite Mandates',
        roiAnchor:
          'A single executive base or equity negotiation pays for this tier 50x over.',
        features: [
          { text: '6 initial resume-to-JD practice questions', included: true },
          { text: '4-part rubric scorecard (0–100)', included: true },
          { text: 'Line-by-line resume & JD citation chips', included: true },
          {
            text: 'Leadership & P&L answer framing rewrites',
            included: true,
          },
          {
            text: 'Dedicated C-Suite seat category, board deck & 10-K uploads',
            included: true,
            highlight: true,
          },
          {
            text: 'Executive Roast AI Voice Interviewer & equity/comp scripts',
            included: true,
            highlight: true,
          },
        ],
      },
    ],
  },
};

const TIER_STORAGE_KEY = 'roleready_subscription_tier_v1';
const FRAMEWORK_STORAGE_KEY = 'roleready_tier_framework_v2';
const CONTEXT_STORAGE_KEY = 'roleready_grill_context_v2';
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
    if (
      val === 'outcome' ||
      val === 'ambition' ||
      val === 'competitive' ||
      val === 'niche' ||
      val === 'csuite'
    ) {
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
        nicheCategory:
          parsed.nicheCategory || DEFAULT_GRILL_CONTEXT.nicheCategory,
        cSuiteCategory:
          parsed.cSuiteCategory || DEFAULT_GRILL_CONTEXT.cSuiteCategory,
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

export interface CandidateDecisionRecord {
  id: string;
  questionId: string;
  code: 'CDR-01' | 'CDR-02' | 'CDR-03' | 'CDR-04';
  roundNumber: 1 | 2;
  title: string;
  sourceDocsCited: string;
  panelChallenge: string;
  defaultDecisionSummary: string;
  tradeOffDefended: string;
  rollbackThreshold: string;
}

export interface DomainGlossaryEntry {
  term: string;
  categoryBadge: 'Niche Domain' | 'C-Suite Mandate' | 'Uploaded Doc';
  panelMeaning: string;
  yourGroundedProof: string;
}

export interface GrillTreePlan {
  rounds: [GrillRound, GrillRound];
  grillWithDocs: {
    dossierTitle: string;
    decisionRecords: [
      CandidateDecisionRecord,
      CandidateDecisionRecord,
      CandidateDecisionRecord,
      CandidateDecisionRecord,
    ];
    domainGlossary: [
      DomainGlossaryEntry,
      DomainGlossaryEntry,
      DomainGlossaryEntry,
      DomainGlossaryEntry,
    ];
  };
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

  const resumeSnippet =
    citedResume?.text ??
    'your project results and cross-team delivery on this work';
  const jdSnippet =
    citedJd?.text ??
    'owning delivery and measurable business results in this role';

  const targetRole = roleTitle || 'Senior Role';
  const targetCompany = company || 'the hiring team';
  const uploadedDoc = context.uploadedFiles[0] || 'your strategy brief';
  const sharedLink = context.sharedLinks[0] || 'the company product roadmap';

  const activeNiche =
    context.nicheCategory || context.nicheFocus || context.industry;
  const activeCSuite = context.cSuiteCategory || context.seniority;

  const heatPrefixRound1 =
    heat === 1
      ? `Warm rehearsal (${activeCSuite} · ${activeNiche}):`
      : heat === 2
        ? `Panel follow-up (${context.department} · ${targetCompany}):`
        : heat === 3
          ? `Bar-raiser challenge (${activeCSuite} · ${activeNiche}):`
          : `Executive roast (${activeCSuite} · 60s clock):`;

  const q1PromptByHeat =
    heat === 4
      ? `${heatPrefixRound1} On your resume you state "${resumeSnippet}". We read ${uploadedDoc} and ${sharedLink} through a ${activeNiche} lens. If we called your former CFO or VP of Engineering today, would they credit you for that number, or did you ride a broader market trend? Give the exact numbers in 60 seconds.`
      : `${heatPrefixRound1} On your resume you cite "${resumeSnippet}". Given the ${activeNiche} specialization and ${uploadedDoc}, what specific decision only happened because you were in the room, and what number would have stayed flat without your call?`;

  const q2PromptByHeat =
    heat === 4
      ? `The job description calls for "${jdSnippet}" alongside ${sharedLink}. In a ${activeCSuite} mandate, saying you "collaborated" does not answer the question. What project did you cut to fund this work, and whose budget did you move to make it happen?`
      : `To deliver on "${jdSnippet}" in a ${activeCSuite} seat across ${activeNiche}, what did you choose not to build during that project, and how did you get other leaders to agree to that cut?`;

  const r2q1PromptByHeat =
    heat === 4
      ? `Board-level failure test (${activeCSuite}): You run that same ${activeNiche} playbook at ${targetCompany}, and within 45 days churn rises and margins drop against the targets in ${sharedLink}. What is the exact metric that tells you to pull the plug, and how do you explain that reversal to the board?`
      : `Suppose you apply that same ${activeNiche} approach at ${targetCompany} in your first 60 days, and the main metric moves the wrong way. What is the first check you run, and at what number do you roll the change back?`;

  return {
    rounds: [
      {
        roundNumber: 1,
        roundTitle: `Round 1 · ${HEAT_LEVELS[heat].name} (${activeCSuite})`,
        frontierSummary: `Cross-checking your resume quote, the job description, ${uploadedDoc}, Niche (${activeNiche}), and C-Suite (${activeCSuite}) benchmarks.`,
        questions: [
          {
            id: `${question.id}-r1-q1`,
            code: 'Q1',
            title: 'Your personal work vs. team momentum',
            prompt: q1PromptByHeat,
            hiddenRiskTested: `Checks whether your resume result holds up under ${activeCSuite} questioning in ${activeNiche}.`,
            recommendedAnswer: `Start with the exact problem you spotted on your resume: state the number before your change, show how it connects to ${uploadedDoc} in ${activeNiche}, and tie the final result directly to the job requirement ("${jdSnippet}").`,
          },
          {
            id: `${question.id}-r1-q2`,
            code: 'Q2',
            title: 'Defending budget and scope cuts',
            prompt: q2PromptByHeat,
            hiddenRiskTested: `Checks how you make ${activeCSuite} budget and scope decisions when challenged on this requirement.`,
            recommendedAnswer: `Name the lower-return option you cut, state the engineering or commercial time saved, and connect that decision to the priorities in ${sharedLink}.`,
          },
        ],
      },
      {
        roundNumber: 2,
        roundTitle: `Round 2 · What Happens When the Plan Breaks (${activeNiche})`,
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
            title: `Breaking ${context.department} vs. ${activeCSuite} deadlocks`,
            prompt: `In ${activeNiche}, "${jdSnippet}" often creates friction between shipping fast and protecting margins. Walk me through a moment during that project where two senior leaders disagreed on the target metric: how did you settle it without missing the deadline?`,
            hiddenRiskTested: `Checks whether you can resolve senior disagreements across ${context.department} without escalating to your boss.`,
            recommendedAnswer: `Show how you turned the disagreement into a two-week test with one shared main metric from your resume and one safety metric from the job description.`,
          },
        ],
      },
    ],
    grillWithDocs: {
      dossierTitle: `Grill-With-Docs Dossier · ${targetRole} at ${targetCompany}`,
      decisionRecords: [
        {
          id: `${question.id}-cdr-1`,
          questionId: `${question.id}-r1-q1`,
          code: 'CDR-01',
          roundNumber: 1,
          title: 'Personal Ownership vs. Team Momentum',
          sourceDocsCited: `Resume bullet + ${uploadedDoc}`,
          panelChallenge: `Did your personal decision drive "${resumeSnippet}", or would the team have hit that number anyway?`,
          defaultDecisionSummary: `Personally led the diagnostic and execution cited on the resume, aligning the change with ${uploadedDoc} in ${activeNiche}.`,
          tradeOffDefended: `Focused engineering and analyst time on the highest-drop-off step instead of spreading effort across minor UI tweaks.`,
          rollbackThreshold: `Monitored 7-day and 30-day cohort conversion daily to confirm the lift held across all customer segments.`,
        },
        {
          id: `${question.id}-cdr-2`,
          questionId: `${question.id}-r1-q2`,
          code: 'CDR-02',
          roundNumber: 1,
          title: `${activeCSuite} Scope & Budget Cut Defense`,
          sourceDocsCited: `Job description + ${sharedLink}`,
          panelChallenge: `What lower-return project or budget item did you cut to deliver "${jdSnippet}" on schedule?`,
          defaultDecisionSummary: `Paused lower-impact reporting requests to free up capacity for the core ${activeNiche} delivery roadmap.`,
          tradeOffDefended: `Traded short-term cosmetic features for measurable movement on the primary revenue and retention metric in ${sharedLink}.`,
          rollbackThreshold: `Reviewed sprint velocity and stakeholder SLA impact every 14 days.`,
        },
        {
          id: `${question.id}-cdr-3`,
          questionId: `${question.id}-r2-q1`,
          code: 'CDR-03',
          roundNumber: 2,
          title: 'Production Failure & Rollback Protocol',
          sourceDocsCited: `${uploadedDoc} + ${sharedLink}`,
          panelChallenge: `If the ${activeNiche} playbook moves the main metric the wrong way in your first 60 days at ${targetCompany}, when do you pull the plug?`,
          defaultDecisionSummary: `Run a staged rollout with an explicit 14-day safety metric before exposing 100% of accounts.`,
          tradeOffDefended: `Accepts a slightly slower initial rollout in exchange for zero uncontained downside on margin or churn.`,
          rollbackThreshold: `Automatic rollback if the safety metric drops by more than 2% against the control cohort over 14 days.`,
        },
        {
          id: `${question.id}-cdr-4`,
          questionId: `${question.id}-r2-q2`,
          code: 'CDR-04',
          roundNumber: 2,
          title: `Resolving ${context.department} vs. ${activeCSuite} Deadlocks`,
          sourceDocsCited: `Resume proof + Job requirement`,
          panelChallenge: `How do you settle a disagreement between speed and margin in ${activeNiche} without escalating or missing the deadline?`,
          defaultDecisionSummary: `Frame the disagreement as a time-boxed two-week cohort test with one shared growth metric and one margin floor.`,
          tradeOffDefended: `Replaces opinion debates with a bounded experiment agreed upfront by both ${context.department} and ${activeCSuite} leaders.`,
          rollbackThreshold: `Pre-agreed go/no-go review at day 14 using a single shared dashboard.`,
        },
      ],
      domainGlossary: [
        {
          term: activeNiche,
          categoryBadge: 'Niche Domain',
          panelMeaning: `Tests whether you know the real operational bottlenecks in ${activeNiche} rather than speaking in textbook generalities.`,
          yourGroundedProof: `Anchor your answer in "${resumeSnippet}" and cross-reference ${uploadedDoc}.`,
        },
        {
          term: `${activeCSuite} Capital & Scope Allocation`,
          categoryBadge: 'C-Suite Mandate',
          panelMeaning: `At the ${activeCSuite} level, panels listen for what you chose not to fund and how you protected unit economics.`,
          yourGroundedProof: `Connect your scope-cut decision directly to "${jdSnippet}".`,
        },
        {
          term: '14-Day Guardrail & Rollback Metric',
          categoryBadge: 'Niche Domain',
          panelMeaning: `Proves you pair growth experiments with a clear safety floor so a bad release never damages core revenue or trust.`,
          yourGroundedProof: `Cite how you sized and monitored cohorts on your resume alongside ${sharedLink}.`,
        },
        {
          term: `Document Brief (${uploadedDoc})`,
          categoryBadge: 'Uploaded Doc',
          panelMeaning: `Shows the hiring panel you have studied the company's strategy and mapped your past work to their next 90 days.`,
          yourGroundedProof: `Tie your first-quarter plan for ${targetCompany} to ${uploadedDoc} and ${sharedLink}.`,
        },
      ],
    },
    negotiationScript: {
      anchorHeadline: `Salary Negotiation Script · ${targetRole} (${activeCSuite} · ${activeNiche})`,
      proofSummary: `Connects your proven resume results and ${uploadedDoc} directly to the job requirements.`,
      spokenScript: `"Thank you, I am excited about leading this ${activeNiche} work in ${context.department}. Because I have already delivered this result in a ${activeCSuite} capacity, I can skip the usual 90-day ramp-up and start moving that number in quarter one. Given that direct fit, if we can set the base salary at the top of the band, I am ready to sign today."`,
    },
  };
}
