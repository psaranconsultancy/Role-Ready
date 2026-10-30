import type {
  Session,
  Question,
  Feedback,
  ParseResumeResponse,
  GenerateQuestionsResponse,
  ScoreAnswerResponse,
  ScoreAnswerClarification,
  ApiError,
  GrillHeat,
  GrillFollowUpResponse,
  GrillReplyResponse,
} from '@contracts';
import { supabase } from './supabase';
import {
  getMockUser,
  setMockUser,
  mockCreateSession,
  mockParseResume,
  mockGenerateQuestions,
  mockScoreAnswer,
  mockGetSession,
  mockListSessions,
  mockDeleteSession,
  mockGrillFollowUp,
  mockGrillReply,
  type MockUser,
} from '../mocks/mockStore';

export type AppUser = MockUser;

let hasWarnedMockFallback = false;

export function isMockMode(): boolean {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    return true;
  }
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const isUnconfigured =
    !supabaseUrl ||
    supabaseUrl.includes('placeholder') ||
    !supabaseAnonKey ||
    supabaseAnonKey.includes('placeholder');

  if (isUnconfigured) {
    if (!hasWarnedMockFallback) {
      hasWarnedMockFallback = true;
      console.warn('RoleReady: Supabase not configured, running on mock data.');
    }
    return true;
  }

  return false;
}

/**
 * Simulated 600–1500 ms delay required by AGENTS.md when VITE_USE_MOCKS is "true".
 */
function fakeDelay(minMs = 650, maxMs = 1350): Promise<void> {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function isApiError(err: unknown): err is ApiError {
  if (typeof err !== 'object' || err === null || !('error' in err)) {
    return false;
  }
  const inner = (err as { error?: unknown }).error;
  return (
    typeof inner === 'object' &&
    inner !== null &&
    typeof (inner as { code?: unknown }).code === 'string' &&
    typeof (inner as { message?: unknown }).message === 'string'
  );
}

export function toApiError(
  err: unknown,
  fallbackCode: ApiError['error']['code'] = 'bad_request',
  fallbackMessage = 'Something went wrong. Please try again.'
): ApiError {
  if (isApiError(err)) {
    return err;
  }
  if (err instanceof Error) {
    return {
      error: {
        code: fallbackCode,
        message: err.message || fallbackMessage,
      },
    };
  }
  return {
    error: {
      code: fallbackCode,
      message: fallbackMessage,
    },
  };
}

/**
 * Extracts structured ApiError from Supabase functions.invoke HTTP error context if available.
 */
export async function extractFunctionApiError(
  err: unknown,
  fallbackCode: ApiError['error']['code'] = 'bad_request',
  fallbackMessage = 'Something went wrong. Please try again.'
): Promise<ApiError> {
  if (isApiError(err)) {
    return err;
  }
  if (err && typeof err === 'object' && 'context' in err) {
    const ctx = (err as { context?: unknown }).context;
    if (ctx && typeof ctx === 'object') {
      try {
        if (typeof (ctx as Response).clone === 'function') {
          const body = await (ctx as Response).clone().json();
          if (isApiError(body)) {
            return body;
          }
        }
      } catch {
        // ignore JSON extraction failure
      }
    }
  }
  return toApiError(err, fallbackCode, fallbackMessage);
}

function validateAuthInput(email: string, password: string): void {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Please enter a valid email address.',
      },
    };
    throw err;
  }
  if (!password || password.length < 6) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Password must be at least 6 characters long.',
      },
    };
    throw err;
  }
}

export async function signUp(email: string, password: string): Promise<AppUser> {
  validateAuthInput(email, password);
  if (isMockMode()) {
    await fakeDelay(600, 1000);
    const user: AppUser = {
      id: `user-${btoa(email.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'demo'}`,
      email: email.trim().toLowerCase(),
    };
    setMockUser(user);
    return user;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error || !data.user) {
    throw toApiError(error, 'unauthorized', error?.message || 'Could not create account.');
  }
  return { id: data.user.id, email: data.user.email ?? email.trim() };
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  validateAuthInput(email, password);
  if (isMockMode()) {
    await fakeDelay(600, 1000);
    const user: AppUser = {
      id: `user-${btoa(email.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'demo'}`,
      email: email.trim().toLowerCase(),
    };
    setMockUser(user);
    return user;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) {
    throw toApiError(error, 'unauthorized', error?.message || 'Invalid email or password.');
  }
  return { id: data.user.id, email: data.user.email ?? email.trim() };
}

export async function signInAsDemo(): Promise<AppUser> {
  if (!isMockMode()) {
    // Real backend: a throwaway anonymous Supabase user, so the demo needs no
    // shared password. Requires "Allow anonymous sign-ins" in Supabase Auth.
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      throw toApiError(
        error,
        'unauthorized',
        'The demo is not available right now. Please create an account instead.'
      );
    }
    return { id: data.user.id, email: 'Demo user' };
  }
  await fakeDelay(600, 950);
  const demoUser: AppUser = {
    id: 'user-demo',
    email: 'demo@roleready.app',
  };
  setMockUser(demoUser);
  return demoUser;
}

export async function signOut(): Promise<void> {
  if (isMockMode()) {
    await fakeDelay(600, 800);
    setMockUser(null);
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw toApiError(error, 'bad_request', error.message);
  }
}

export async function getUser(): Promise<AppUser | null> {
  if (isMockMode()) {
    return getMockUser();
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return {
    id: data.user.id,
    email: data.user.email || (data.user.is_anonymous ? 'Demo user' : ''),
  };
}

export async function createSession(params: {
  file: File;
  jdText: string;
  roleTitle?: string;
  company?: string;
}): Promise<Session> {
  const { file, jdText, roleTitle, company } = params;

  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Only PDF files (.pdf) are supported for resume upload.',
      },
    };
    throw err;
  }
  if (file.size > 5 * 1024 * 1024) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Resume PDF must be 5 MB or smaller.',
      },
    };
    throw err;
  }
  if (jdText.trim().length < 200) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Job description must be at least 200 characters.',
      },
    };
    throw err;
  }

  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: {
        code: 'unauthorized',
        message: 'Please sign in to create an interview session.',
      },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(650, 1100);
    return mockCreateSession({
      userId: user.id,
      jdText: jdText.trim(),
      roleTitle,
      company,
    });
  }

  // Real backend: 1) insert sessions row (status draft)
  const { data: inserted, error: insertError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      role_title: roleTitle?.trim() || null,
      company: company?.trim() || null,
      jd_text: jdText.trim(),
      status: 'draft',
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    throw toApiError(insertError, 'bad_request', 'Failed to create interview session.');
  }

  const session = inserted as Session;
  const storageObjectPath = `${user.id}/${session.id}.pdf`;
  const resumePath = `resumes/${storageObjectPath}`;

  // 2) upload PDF to bucket 'resumes' at {user_id}/{session_id}.pdf
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storageObjectPath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw toApiError(uploadError, 'bad_request', 'Failed to upload resume PDF.');
  }

  // 3) update resume_path
  const { data: updated, error: updateError } = await supabase
    .from('sessions')
    .update({ resume_path: resumePath })
    .eq('id', session.id)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw toApiError(updateError, 'bad_request', 'Failed to save resume path on session.');
  }

  return updated as Session;
}

export async function parseResume(sessionId: string): Promise<ParseResumeResponse> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(750, 1400);
    try {
      return mockParseResume(user.id, sessionId);
    } catch (err) {
      throw toApiError(err, 'parse_failed', 'Could not read your resume.');
    }
  }

  const { data, error } = await supabase.functions.invoke<ParseResumeResponse>(
    'parse-resume',
    {
      body: { session_id: sessionId },
    }
  );
  if (error || !data) {
    throw await extractFunctionApiError(
      error,
      'parse_failed',
      'Could not read the text in your PDF. Try saving it again as a PDF and re-uploading.'
    );
  }
  return data;
}

export async function generateQuestions(
  sessionId: string
): Promise<GenerateQuestionsResponse> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(800, 1450);
    try {
      return mockGenerateQuestions(user.id, sessionId);
    } catch (err) {
      throw toApiError(err, 'llm_failed', 'Failed to generate interview questions.');
    }
  }

  const { data, error } = await supabase.functions.invoke<GenerateQuestionsResponse>(
    'generate-questions',
    {
      body: { session_id: sessionId },
    }
  );
  if (error || !data) {
    throw await extractFunctionApiError(
      error,
      'llm_failed',
      'Failed to generate tailored questions.'
    );
  }
  return data;
}

export async function scoreAnswer(
  questionId: string,
  answerText: string
): Promise<ScoreAnswerResponse | ScoreAnswerClarification> {
  const trimmed = answerText.trim();
  if (trimmed.length < 20 || trimmed.length > 4000) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Your answer must be between 20 and 4,000 characters.',
      },
    };
    throw err;
  }

  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(750, 1400);
    try {
      return mockScoreAnswer(user.id, questionId, trimmed);
    } catch (err) {
      throw toApiError(err, 'llm_failed', 'Could not score your answer. Please retry.');
    }
  }

  const { data, error } = await supabase.functions.invoke<ScoreAnswerResponse | ScoreAnswerClarification>(
    'score-answer',
    {
      body: { question_id: questionId, answer_text: trimmed },
    }
  );
  if (error || !data) {
    throw await extractFunctionApiError(
      error,
      'llm_failed',
      'Could not score your answer. Please retry.'
    );
  }
  return data;
}

export function isClarification(
  res: ScoreAnswerResponse | ScoreAnswerClarification
): res is ScoreAnswerClarification {
  return 'clarification' in res && !!res.clarification;
}

/** Grill Me: one tougher follow-up on an already scored answer. */
export async function askGrillFollowUp(
  questionId: string,
  heat: GrillHeat
): Promise<GrillFollowUpResponse> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(700, 1300);
    try {
      return mockGrillFollowUp(user.id, questionId, heat);
    } catch (err) {
      throw toApiError(err, 'llm_failed', 'Grill Me could not respond. Please retry.');
    }
  }

  const { data, error } = await supabase.functions.invoke<GrillFollowUpResponse>(
    'grill-followup',
    { body: { question_id: questionId, heat } }
  );
  if (error || !data) {
    throw await extractFunctionApiError(
      error,
      'llm_failed',
      'Grill Me could not respond. Please retry.'
    );
  }
  return data;
}

/** Grill Me: judges the candidate's reply to a follow-up. Nothing is saved. */
export async function judgeGrillReply(
  questionId: string,
  heat: GrillHeat,
  followup: string,
  reply: string
): Promise<GrillReplyResponse> {
  const trimmed = reply.trim();
  if (trimmed.length < 20 || trimmed.length > 2000) {
    const err: ApiError = {
      error: {
        code: 'bad_request',
        message: 'Your reply must be between 20 and 2,000 characters.',
      },
    };
    throw err;
  }

  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(750, 1400);
    try {
      return mockGrillReply(user.id, questionId, heat, trimmed);
    } catch (err) {
      throw toApiError(err, 'llm_failed', 'Grill Me could not judge your reply. Please retry.');
    }
  }

  const { data, error } = await supabase.functions.invoke<GrillReplyResponse>(
    'grill-followup',
    { body: { question_id: questionId, heat, followup, reply: trimmed } }
  );
  if (error || !data) {
    throw await extractFunctionApiError(
      error,
      'llm_failed',
      'Grill Me could not judge your reply. Please retry.'
    );
  }
  return data;
}

export async function getSession(id: string): Promise<{
  session: Session;
  questions: Question[];
  answers: Feedback[];
}> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(600, 1000);
    try {
      return mockGetSession(user.id, id);
    } catch (err) {
      throw toApiError(err, 'not_found', 'Session not found.');
    }
  }

  const [sessionRes, questionsRes, answersRes] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase
      .from('questions')
      .select('*')
      .eq('session_id', id)
      .order('position', { ascending: true }),
    supabase.from('answers').select('*').eq('session_id', id),
  ]);

  if (sessionRes.error || !sessionRes.data) {
    throw toApiError(sessionRes.error, 'not_found', 'Session not found.');
  }
  if (questionsRes.error) {
    throw toApiError(questionsRes.error, 'bad_request', 'Could not load session questions.');
  }
  if (answersRes.error) {
    throw toApiError(answersRes.error, 'bad_request', 'Could not load session answers.');
  }

  return {
    session: sessionRes.data as Session,
    questions: (questionsRes.data ?? []) as Question[],
    answers: (answersRes.data ?? []) as Feedback[],
  };
}

export async function deleteSession(id: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(600, 900);
    try {
      mockDeleteSession(user.id, id);
      return;
    } catch (err) {
      throw toApiError(err, 'not_found', 'Session not found.');
    }
  }

  // Questions and answers go with the session (on delete cascade).
  const { data: deleted, error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .select('resume_path');
  if (error) {
    throw toApiError(error, 'bad_request', 'Could not delete this session.');
  }
  if (!deleted || deleted.length === 0) {
    const err: ApiError = {
      error: { code: 'not_found', message: 'Session not found.' },
    };
    throw err;
  }
  const resumePath = (deleted[0] as { resume_path: string | null }).resume_path;
  if (resumePath) {
    // Best effort: the session is already gone, so a leftover PDF is not an error.
    await supabase.storage.from('resumes').remove([resumePath.replace(/^resumes\//, '')]);
  }
}

export async function listSessions(): Promise<Session[]> {
  const user = await getUser();
  if (!user) {
    const err: ApiError = {
      error: { code: 'unauthorized', message: 'You must be signed in.' },
    };
    throw err;
  }

  if (isMockMode()) {
    await fakeDelay(600, 1000);
    return mockListSessions(user.id);
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toApiError(error, 'bad_request', 'Failed to load your interview sessions.');
  }
  return (data ?? []) as Session[];
}
