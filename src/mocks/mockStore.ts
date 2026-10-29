import type {
  Session,
  Question,
  Feedback,
  Scores,
  ScoreAnswerResponse,
  ParseResumeResponse,
  GenerateQuestionsResponse,
  ResumeLine,
} from '@contracts';
import {
  SAMPLE_RESUME_LINES,
  SAMPLE_JD_REQUIREMENTS,
  buildQuestionsForSession,
  buildSeedData,
} from './fixtures';

const USER_STORAGE_KEY = 'roleready_mock_user_v1';
const STORE_STORAGE_KEY = 'roleready_mock_store_v1';

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
  const refsText = citedLines.map((r) => `${r.text} (${r.id})`).join(' ');
  switch (question.position) {
    case 1:
      return `At PayPulse, account managers lacked proactive visibility into merchant churn risk. I partnered with commercial stakeholders to build an automated Looker churn-risk dashboard used weekly by 40 account managers (R4), combining payment failure signals and product engagement drops. By running bi-weekly Looker office hours for 25+ stakeholders (R9) to embed the tool into weekly account reviews, we drove consistent adoption and reduced logo churn by 14% over two quarters.`;
    case 2:
      return `Across 18 A/B tests on payment retry logic and dunning emails at PayPulse (R3), I used Python (scipy) and SQL (R12) to run pre-experiment power calculations and size minimum detectable effects. Because merchant invoice values were right-skewed, I evaluated both binary payment recovery rate and winsorized ARR per cohort while monitoring voluntary churn as a strict guardrail, ultimately recovering $420K in annualised ARR.`;
    case 3:
      return `To replace 22 brittle legacy SQL reporting scripts at PayPulse, I architected a modular dbt pipeline on BigQuery split into staging, intermediate, and incremental mart layers (R5). I validated parity against historical outputs and integrated schema checks from our Stripe Webhook billing migration—which resolved a 6% revenue discrepancy with Finance (R6)—cutting daily pipeline runtime by 58% and lowering warehouse spend by 25%.`;
    case 4:
      return `When presenting my quarterly pricing-tier elasticity analysis to the VP of Product (R10), leadership pushed back on whether higher tier thresholds might depress new merchant conversion. I paired cohort elasticity models with funnel evidence from our merchant onboarding redesign—which lifted 7-day activation from 41% to 54% across 12,000 signups (R2)—to demonstrate strong top-of-funnel resilience, securing approval for a packaging update that lifted expansion revenue by 11%.`;
    case 5:
      return `First, I would coordinate with the 5 checkout engineers (R2) to isolate the broken client release and quarantine malformed payloads in dbt staging so executive Looker dashboards remain accurate. Longer term, drawing on my PayPulse audit of 85 frontend events in Segment and Amplitude—where I raised schema compliance from 64% to 97% (R7)—I would enforce an automated tracking plan check in CI before checkout PRs merge.`;
    case 6:
      return `In my first 30 days on FinFlow's Core Payments & Retention squad (R1), I would audit the dbt/BigQuery billing models and Stripe event pipelines, applying lessons from my Stripe Webhook migration that closed a 6% Finance discrepancy (R6). In days 31 to 60, I would roll out a Looker retention dashboard modelled on my PayPulse workflow that cut logo churn 14% (R4) and scope high-impact onboarding and payment recovery tests building on my 41%-to-54% activation lift (R2).`;
    default:
      return `Drawing directly on my background—specifically: ${refsText}—I approached this by defining clear baseline metrics, aligning cross-functional stakeholders, executing iteratively, and measuring the concrete business impact.`;
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
          'The AI scoring engine encountered a temporary error while evaluating your answer. Please retry.',
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
      // Check if that exact phrase is in the resume
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

  // Check keyword overlap with cited resume lines
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

  // Check numbers / metrics in the answer
  const numberMatches = answerText.match(/\b\d+(?:\.\d+)?%?|\$\d+[kKmM]?/g) ?? [];
  const hasNumbers = numberMatches.length > 0;
  const hasMultipleNumbers = numberMatches.length >= 2;

  // Structure score: answers under 60 words score low on structure (1 or 2)
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

  // Evidence score: based on keyword overlap with cited resume lines and unsupported claims penalty
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

  // Impact score: concrete outcome or number
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

  // Relevance score: answers the question asked for this role
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

  const citedIdsLabel = question.resume_refs.join(', ');
  const whatWorkedParts: string[] = [];
  if (matchedKeywordCount >= 2) {
    whatWorkedParts.push(
      `Grounded your response in specific details from your resume (${citedIdsLabel})`
    );
  } else {
    whatWorkedParts.push('Addressed the core theme of the prompt directly');
  }
  if (hasNumbers) {
    whatWorkedParts.push(
      `included quantified metrics (${numberMatches.slice(0, 3).join(', ')}) to demonstrate concrete business impact`
    );
  }
  if (wordCount >= 60) {
    whatWorkedParts.push('organized the narrative with clear context, actions, and outcomes');
  }
  const what_worked = `${whatWorkedParts.join(', and ')}.`;

  let one_fix = '';
  if (unsupportedClaims.length > 0) {
    one_fix = `Remove claims not supported by your resume (such as "${unsupportedClaims[0]}") and anchor your story strictly in ${citedIdsLabel}.`;
  } else if (wordCount < 60) {
    one_fix = `Expand your answer to at least 60–90 words using the STAR method (Situation, Task, Action, Result) and explicitly cite the outcome from ${citedIdsLabel}.`;
  } else if (!hasNumbers) {
    const sampleLine = citedResumeLines[0]?.text ?? 'your resume';
    one_fix = `Quantify the business outcome using the exact metrics from ${citedIdsLabel} (for example: "${sampleLine}").`;
  } else if (matchedKeywordCount < 3) {
    one_fix = `Tie your actions more explicitly to the tools and context in ${citedIdsLabel} so the interviewer sees direct evidence for ${question.jd_refs.join(', ')}.`;
  } else {
    one_fix = `Tighten the closing sentence by explicitly linking your result from ${citedIdsLabel} to how you would drive similar impact in your first 60 days at ${session.company ?? 'the company'}.`;
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

  // Upsert answer in store
  const existingIdx = store.answers.findIndex((a) => a.question_id === questionId);
  if (existingIdx >= 0) {
    store.answers[existingIdx] = feedback;
  } else {
    store.answers.push(feedback);
  }

  // Check how many questions in this session are answered
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

