// RoleReady shared contracts v0.1 (must-haves only)
// Lives at supabase/functions/_shared/contracts.ts so both the Deno edge
// functions and the React app (via a Vite alias "@contracts") import the same file.
// Change it only through a PR approved by Person A plus the owner of the affected endpoint.

// ---------- Grounding ids ----------
// Resume lines are numbered R1..Rn, JD requirements J1..Jn.
// Questions and feedback cite these ids so the UI can show "why we're asking".
export interface ResumeLine { id: string; text: string }      // { id: "R7", text: "Led migration of billing to Stripe, cut failed payments 30%" }
export interface JdRequirement { id: string; text: string }   // { id: "J3", text: "Experience with payment integrations" }

// ---------- Rows (mirror supabase/migrations/0001_init.sql) ----------
export type SessionStatus = "draft" | "ready" | "in_progress" | "completed";

export interface Session {
  id: string;
  user_id: string;
  role_title: string | null;
  company: string | null;
  jd_text: string;
  resume_path: string | null;          // "resumes/{user_id}/{session_id}.pdf" in Storage
  resume_lines: ResumeLine[] | null;   // filled by parse-resume
  jd_requirements: JdRequirement[] | null;
  status: SessionStatus;
  overall_score: number | null;        // 0-100, average of answer.overall, set when completed
  created_at: string;
  completed_at: string | null;
}

export type QuestionType = "behavioural" | "technical" | "role_fit" | "situational";

export interface Question {
  id: string;
  session_id: string;
  position: number;                    // 1..6
  text: string;
  type: QuestionType;
  why_asking: string;                  // one sentence shown under the question
  resume_refs: string[];               // e.g. ["R7"]  (at least one of resume_refs / jd_refs is non-empty)
  jd_refs: string[];                   // e.g. ["J3"]
}

export interface Scores {              // each 1..5
  relevance: number;                   // answers the question asked, for this role
  evidence: number;                    // uses real facts from the resume
  structure: number;                   // clear STAR-style story
  impact: number;                      // concrete outcome or number
}

export interface Feedback {
  question_id: string;
  answer_text: string;
  scores: Scores;
  overall: number;                     // 0..100 = round((sum of scores - 4) / 16 * 100)
  what_worked: string;
  one_fix: string;
  stronger_answer: string;             // rewritten using only facts present in resume_lines
  unsupported_claims: string[];        // claims in the answer not backed by the resume
}

// ---------- Edge function endpoints ----------
// All: POST {SUPABASE_URL}/functions/v1/<name>
// Headers: Authorization: Bearer <user access token>, Content-Type: application/json
// Errors: non-2xx with body ApiError.

export interface ApiError { error: { code: "bad_request" | "unauthorized" | "not_found" | "llm_failed" | "parse_failed"; message: string } }

// 1. parse-resume  (owner: Person C)
// Reads the PDF at session.resume_path, extracts text, numbers the lines,
// pulls 5-10 requirements out of jd_text, saves both on the session.
export interface ParseResumeRequest { session_id: string }
export interface ParseResumeResponse { resume_lines: ResumeLine[]; jd_requirements: JdRequirement[] }

// 2. generate-questions  (owner: Person C)
// Creates exactly 6 questions, inserts them, sets session.status = "ready".
// Calling it again replaces the 6 questions (only while no answers exist).
export interface GenerateQuestionsRequest { session_id: string }
export interface GenerateQuestionsResponse { questions: Question[] }

// 3. score-answer  (owner: Person D)
// Scores one answer, upserts the answers row (one per question; re-answering overwrites).
// Sets session.status = "in_progress", or "completed" + overall_score once all 6 are answered.
export interface ScoreAnswerRequest { question_id: string; answer_text: string }   // answer_text 20..4000 chars
export interface ScoreAnswerResponse extends Feedback {
  session_completed: boolean;
  session_overall: number | null;
}

