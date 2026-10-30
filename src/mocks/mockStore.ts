import type {
  Session,
  Question,
  Feedback,
  Scores,
  ScoreAnswerResponse,
  ParseResumeResponse,
  GenerateQuestionsResponse,
  ResumeLine,
  GrillHeat,
  GrillFollowUpResponse,
  GrillReplyResponse,
} from '@contracts';
import {
  SAMPLE_RESUME_LINES,
  SAMPLE_JD_REQUIREMENTS,
  buildQuestionsForSession,
  buildSeedData,
} from './fixtures';

const USER_STORAGE_KEY = 'roleready_mock_user_v1';
const STORE_STORAGE_KEY = 'roleready_mock_store_v2';

export interface MockUser {
  id: string;
  email: string;
}

interface MockStoreData {
  sessions: Session[];
  questions: Question[];
  answers: Feedback[];
}

export function getMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setMockUser(user: MockUser | null): void {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
  } else {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    // Ensure store is initialized for this user
    loadStore(user.id);
  }
}

function loadStore(userId: string): MockStoreData {
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockStoreData;
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to seed
  }
  const seeded = buildSeedData(userId);
  saveStore(seeded);
  return seeded;
}

function saveStore(data: MockStoreData): void {
  localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(data));
}

export function mockCreateSession(params: {
  userId: string;
  jdText: string;
  roleTitle?: string;
  company?: string;
}): Session {
  const store = loadStore(params.userId);
  const id = `session-${Date.now()}`;
  const newSession: Session = {
    id,
    user_id: params.userId,
    role_title: params.roleTitle?.trim() ? params.roleTitle.trim() : 'Senior Product Analyst',
    company: params.company?.trim() ? params.company.trim() : 'FinFlow',
    jd_text: params.jdText,
    resume_path: `resumes/${params.userId}/${id}.pdf`,
    resume_lines: null,
    jd_requirements: null,
    status: 'draft',
    overall_score: null,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  store.sessions.unshift(newSession);
  saveStore(store);
  return newSession;
}

export function mockParseResume(userId: string, sessionId: string): ParseResumeResponse {
  const store = loadStore(userId);
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'Session could not be found when parsing resume.',
      },
    };
  }
  session.resume_lines = SAMPLE_RESUME_LINES;
  session.jd_requirements = SAMPLE_JD_REQUIREMENTS;
  saveStore(store);
  return {
    resume_lines: SAMPLE_RESUME_LINES,
    jd_requirements: SAMPLE_JD_REQUIREMENTS,
  };
}

export function mockGenerateQuestions(
  userId: string,
  sessionId: string
): GenerateQuestionsResponse {
  const store = loadStore(userId);
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'Session could not be found when generating questions.',
      },
    };
  }
  // Remove any existing questions for this session if no answers exist
  store.questions = store.questions.filter((q) => q.session_id !== sessionId);
  const generated = buildQuestionsForSession(sessionId);
  store.questions.push(...generated);
  session.status = 'ready';
  saveStore(store);
  return { questions: generated };
}

function extractSignificantWords(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'how',
    'what', 'when', 'where', 'why', 'who', 'did', 'were', 'was', 'are', 'have',
    'has', 'had', 'into', 'over', 'across', 'used', 'using', 'our', 'their',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%$]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));
}

function clampScore(val: number): number {
  return Math.max(1, Math.min(5, Math.round(val)));
}

function buildStrongerAnswerForQuestion(
  question: Question,
  citedLines: ResumeLine[]
): string {
  const refsText = citedLines.map((r) => r.text).join(' ');
  switch (question.position) {
    case 1:
      return `At PayPulse, account managers lacked early visibility into merchant churn risk. I worked with commercial leads to build an automated Looker churn-risk dashboard used weekly by 40 account managers, combining payment failure signals and login drops. Running bi-weekly Looker office hours for 25 stakeholders embedded the dashboard into weekly account reviews and reduced logo churn by 14% over two quarters.`;
    case 2:
      return `Across 18 A/B tests on payment retry logic and dunning emails at PayPulse, I used Python (scipy) and SQL to run pre-test power calculations and size minimum detectable effects. Because merchant invoice values were right-skewed, I tracked both binary payment recovery rate and winsorized ARR per cohort while watching voluntary churn as a guardrail, recovering $420K in annualised ARR.`;
    case 3:
      return `To replace 22 legacy SQL reporting scripts at PayPulse, I built a modular dbt pipeline on BigQuery split into staging, intermediate, and incremental mart layers. I checked parity against historical outputs and added schema checks from our Stripe Webhook billing migration, which resolved a 6% revenue discrepancy with Finance, cutting daily pipeline runtime by 58% and lowering warehouse spend by 25%.`;
    case 4:
      return `When presenting my quarterly pricing-tier elasticity analysis to the VP of Product, leadership asked whether higher tier thresholds might slow new merchant conversion. I paired cohort elasticity models with funnel data from our merchant onboarding redesign, which lifted 7-day activation from 41% to 54% across 12,000 signups, to show top-of-funnel resilience and get approval for a packaging update that lifted expansion revenue by 11%.`;
    case 5:
      return `First, I would work with the 5 checkout engineers to isolate the broken client release and filter malformed payloads in dbt staging so Looker dashboards stay accurate. Longer term, using the playbook from my PayPulse audit of 85 frontend events in Segment and Amplitude, where I raised schema compliance from 64% to 97%, I would add an automated tracking plan check in CI before checkout PRs merge.`;
    case 6:
      return `In my first 30 days on FinFlow's Core Payments & Retention squad, I would audit the dbt and BigQuery billing models and Stripe event pipelines, applying lessons from my Stripe Webhook migration that closed a 6% Finance discrepancy. In days 31 to 60, I would roll out a Looker retention dashboard modelled on my PayPulse workflow that cut logo churn 14% and scope onboarding and payment recovery tests building on my 41%-to-54% activation lift.`;
    default:
      return `Drawing on my experience (${refsText}), I set clear baseline metrics, aligned stakeholders, shipped the changes, and measured the business result.`;
  }
}

export function mockScoreAnswer(
  userId: string,
  questionId: string,
  answerText: string
): ScoreAnswerResponse {
  // Check for #fail trigger
  if (answerText.includes('#fail')) {
    throw {
      error: {
        code: 'llm_failed' as const,
        message:
          'The scoring service timed out while grading your answer. Please try again.',
      },
    };
  }

  const store = loadStore(userId);
  const question = store.questions.find((q) => q.id === questionId);
  if (!question) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'Question not found in current session.',
      },
    };
  }

  const session = store.sessions.find((s) => s.id === question.session_id);
  if (!session) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'Session not found for this question.',
      },
    };
  }

  const resumeLines = session.resume_lines ?? SAMPLE_RESUME_LINES;
  const citedResumeLines = resumeLines.filter((r) =>
    question.resume_refs.includes(r.id)
  );
  const allResumeTextLower = resumeLines.map((r) => r.text.toLowerCase()).join(' ');

  // 1. Check unsupported claims: any sentence containing "led a team of" or "million" not in resume
  const sentences = answerText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const unsupportedClaims: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const hasLedTeam = lower.includes('led a team of');
    const hasMillion = lower.includes('million');
    if (hasLedTeam || hasMillion) {
      const inResume =
        (hasLedTeam && allResumeTextLower.includes('led a team of')) ||
        (hasMillion && allResumeTextLower.includes('million'));
      if (!inResume) {
        unsupportedClaims.push(sentence);
      }
    }
  }

  // 2. Deterministic scoring
  const words = answerText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const answerLower = answerText.toLowerCase();

  const citedKeywords = new Set<string>();
  for (const line of citedResumeLines) {
    for (const kw of extractSignificantWords(line.text)) {
      citedKeywords.add(kw);
    }
  }
  let matchedKeywordCount = 0;
  for (const kw of citedKeywords) {
    if (answerLower.includes(kw)) {
      matchedKeywordCount++;
    }
  }

  const numberMatches = answerText.match(/\b\d+(?:\.\d+)?%?|\$\d+[kKmM]?/g) ?? [];
  const hasNumbers = numberMatches.length > 0;
  const hasMultipleNumbers = numberMatches.length >= 2;

  let structure = 2;
  if (wordCount < 30) {
    structure = 1;
  } else if (wordCount < 60) {
    structure = 2;
  } else if (wordCount < 95) {
    structure = 4;
  } else {
    structure = 5;
  }

  let evidence = 2;
  if (matchedKeywordCount >= 5) {
    evidence = 5;
  } else if (matchedKeywordCount >= 3) {
    evidence = 4;
  } else if (matchedKeywordCount >= 1) {
    evidence = 3;
  } else {
    evidence = 2;
  }
  if (unsupportedClaims.length > 0) {
    evidence = Math.max(1, evidence - 2);
  }

  let impact = 2;
  if (hasMultipleNumbers && matchedKeywordCount >= 2) {
    impact = 5;
  } else if (hasNumbers) {
    impact = 4;
  } else if (wordCount >= 60) {
    impact = 3;
  } else {
    impact = 2;
  }

  let relevance = 3;
  if (matchedKeywordCount >= 3 && wordCount >= 50) {
    relevance = 5;
  } else if (matchedKeywordCount >= 2 || wordCount >= 60) {
    relevance = 4;
  } else if (wordCount < 25) {
    relevance = 2;
  }

  const scores: Scores = {
    relevance: clampScore(relevance),
    evidence: clampScore(evidence),
    structure: clampScore(structure),
    impact: clampScore(impact),
  };

  const sumScores = scores.relevance + scores.evidence + scores.structure + scores.impact;
  const overall = Math.round(((sumScores - 4) / 16) * 100);

  const whatWorkedParts: string[] = [];
  if (matchedKeywordCount >= 2) {
    whatWorkedParts.push(
      'Used specific facts and metrics from your resume'
    );
  } else {
    whatWorkedParts.push('Answered the core question directly');
  }
  if (hasNumbers) {
    whatWorkedParts.push(
      `included numbers (${numberMatches.slice(0, 3).join(', ')}) to show the outcome`
    );
  }
  if (wordCount >= 60) {
    whatWorkedParts.push('structured the story with clear context, actions, and results');
  }
  const what_worked = `${whatWorkedParts.join(', and ')}.`;

  let one_fix = '';
  if (unsupportedClaims.length > 0) {
    one_fix = `Remove claims that are not on your resume (such as "${unsupportedClaims[0]}") and stick to your verified resume experience.`;
  } else if (wordCount < 60) {
    one_fix =
      'Expand your answer to 60–90 words using Situation, Task, Action, and Result, and name the measurable outcome from your resume.';
  } else if (!hasNumbers) {
    const sampleLine = citedResumeLines[0]?.text ?? 'your resume';
    one_fix = `Add the exact numbers from your resume (for example: "${sampleLine}").`;
  } else if (matchedKeywordCount < 3) {
    one_fix =
      'Name the specific tools and context from your resume so the interviewer hears direct proof for the job requirements.';
  } else {
    one_fix = `Close with one sentence connecting your past result to how you would approach the same problem at ${session.company ?? 'the company'}.`;
  }

  const stronger_answer = buildStrongerAnswerForQuestion(question, citedResumeLines);

  const feedback: Feedback = {
    question_id: questionId,
    answer_text: answerText,
    scores,
    overall,
    what_worked,
    one_fix,
    stronger_answer,
    unsupported_claims: unsupportedClaims,
  };

  const existingIdx = store.answers.findIndex((a) => a.question_id === questionId);
  if (existingIdx >= 0) {
    store.answers[existingIdx] = feedback;
  } else {
    store.answers.push(feedback);
  }

  const sessionQuestions = store.questions.filter((q) => q.session_id === session.id);
  const sessionQuestionIds = new Set(sessionQuestions.map((q) => q.id));
  const sessionAnswers = store.answers.filter((a) => sessionQuestionIds.has(a.question_id));

  const allSixAnswered =
    sessionQuestions.length > 0 && sessionAnswers.length >= sessionQuestions.length;

  let sessionOverall: number | null = null;
  if (allSixAnswered) {
    const total = sessionAnswers.reduce((acc, a) => acc + a.overall, 0);
    sessionOverall = Math.round(total / sessionAnswers.length);
    session.status = 'completed';
    session.overall_score = sessionOverall;
    session.completed_at = new Date().toISOString();
  } else {
    session.status = 'in_progress';
  }

  saveStore(store);

  return {
    ...feedback,
    session_completed: allSixAnswered,
    session_overall: sessionOverall,
  };
}

export function mockGetSession(
  userId: string,
  sessionId: string
): { session: Session; questions: Question[]; answers: Feedback[] } {
  const store = loadStore(userId);
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'We could not find that interview session.',
      },
    };
  }
  const questions = store.questions
    .filter((q) => q.session_id === sessionId)
    .sort((a, b) => a.position - b.position);
  const qIds = new Set(questions.map((q) => q.id));
  const answers = store.answers.filter((a) => qIds.has(a.question_id));

  return { session, questions, answers };
}

export function mockListSessions(userId: string): Session[] {
  const store = loadStore(userId);
  return [...store.sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function mockDeleteSession(userId: string, sessionId: string): void {
  const store = loadStore(userId);
  if (!store.sessions.some((s) => s.id === sessionId)) {
    throw {
      error: {
        code: 'not_found' as const,
        message: 'We could not find that interview session.',
      },
    };
  }
  const qIds = new Set(
    store.questions.filter((q) => q.session_id === sessionId).map((q) => q.id)
  );
  saveStore({
    sessions: store.sessions.filter((s) => s.id !== sessionId),
    questions: store.questions.filter((q) => q.session_id !== sessionId),
    answers: store.answers.filter((a) => !qIds.has(a.question_id)),
  });
}

// ---------- Grill Me (mock) ----------

const MOCK_GRILL_OPENERS: Record<GrillHeat, string> = {
  1: "That's a good start.",
  2: 'Let me press on that a little.',
  3: "I'm not convinced yet.",
  4: "Let's be blunt.",
};

export function mockGrillFollowUp(
  userId: string,
  questionId: string,
  heat: GrillHeat
): GrillFollowUpResponse {
  const store = loadStore(userId);
  const question = store.questions.find((q) => q.id === questionId);
  const answer = store.answers.find((a) => a.question_id === questionId);
  if (!question || !answer) {
    throw {
      error: {
        code: 'bad_request' as const,
        message: 'Answer this question and get your score first.',
      },
    };
  }
  const session = store.sessions.find((s) => s.id === question.session_id);
  const lines = session?.resume_lines ?? SAMPLE_RESUME_LINES;
  const line =
    lines.find((l) => question.resume_refs.includes(l.id)) ?? lines[0];
  const claim = answer.unsupported_claims[0];
  const lineText = line.text.replace(/[.\s]+$/, '');

  const followup = claim
    ? `${MOCK_GRILL_OPENERS[heat]} You said "${claim}", but I can't see that on your resume. Where does that number come from, and what exactly did you do to get it?`
    : heat >= 3
      ? `${MOCK_GRILL_OPENERS[heat]} Your resume says "${lineText}". Which part of that result would not have happened without you personally, and how do you know?`
      : `${MOCK_GRILL_OPENERS[heat]} Can you walk me through the one decision you made in "${lineText}" that mattered most, and the result it led to?`;

  return {
    followup,
    presses_on: claim
      ? 'A claim your resume does not back up'
      : 'Your own part in the result',
    resume_refs: line ? [line.id] : [],
  };
}

export function mockGrillReply(
  userId: string,
  questionId: string,
  heat: GrillHeat,
  reply: string
): GrillReplyResponse {
  if (reply.includes('#fail')) {
    throw {
      error: {
        code: 'llm_failed' as const,
        message: 'Grill Me timed out while judging your reply. Please try again.',
      },
    };
  }
  const store = loadStore(userId);
  const question = store.questions.find((q) => q.id === questionId);
  const session = question
    ? store.sessions.find((s) => s.id === question.session_id)
    : undefined;
  const lines = session?.resume_lines ?? SAMPLE_RESUME_LINES;
  const line =
    lines.find((l) => question?.resume_refs.includes(l.id)) ?? lines[0];

  const lineText = line.text.replace(/[.\s]+$/, '');
  const words = reply.trim().split(/\s+/).length;
  const hasNumber = /\d/.test(reply);
  const bar = heat >= 3 ? 45 : 30;
  const verdict: GrillReplyResponse['verdict'] =
    hasNumber && words >= bar ? 'held_up' : hasNumber || words >= bar ? 'partly' : 'cracked';

  const feedback =
    verdict === 'held_up'
      ? 'You answered the question directly and backed it with a number from your own work.'
      : verdict === 'partly'
        ? 'There is substance here, but you need both a specific number and your own action to fully answer the challenge.'
        : 'This dodges the question. Name what you did yourself and the result, using a number from your resume.';

  return {
    verdict,
    feedback,
    better_reply: `Fair question. On my resume I list "${lineText}". My part was the decision itself: I scoped the work, made the call on what to build first, and tracked the result week by week. That is the number I would stand behind in a reference check.`,
  };
}
