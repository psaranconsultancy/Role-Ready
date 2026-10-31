import { GoogleGenAI, Modality } from "npm:@google/genai@2.32.0";
import { apiError, corsHeaders, isUuid, jsonResponse } from "../_shared/http.ts";
import { ownedSession, userClient } from "../_shared/session.ts";

// Live interview (beta): mints a short-lived, single-use Gemini Live token for
// one practice session. The interviewer's instructions (this session's six
// questions, the role and the resume) are locked into the token on the server,
// so the browser never sees the API key and cannot change the prompt.

interface Question { position: number; text: string }
interface ResumeLine { text: string }
interface JdRequirement { text: string }

const DEFAULT_LIVE_MODEL = "gemini-3.8-live";

function interviewerPrompt(
  role: string,
  company: string | null,
  questions: Question[],
  resume: ResumeLine[],
  jd: JdRequirement[],
): string {
  const qs = questions
    .sort((a, b) => a.position - b.position)
    .map((q) => `${q.position}. ${q.text}`)
    .join("\n");
  const cv = resume.slice(0, 25).map((r) => `- ${r.text}`).join("\n");
  const reqs = jd.slice(0, 15).map((j) => `- ${j.text}`).join("\n");
  return `You are a friendly but professional interviewer from RoleReady, holding a spoken practice interview for the role of ${role}${company ? ` at ${company}` : ""}. Speak British English. Keep every turn short: two or three sentences at most.

How to run the interview:
1. Greet the candidate in one sentence, then ask question 1.
2. Ask the questions below in order, one at a time, word for word or very close.
3. After each answer, give one short reaction (what was good, or what was missing). If the answer was vague or had no result or number, ask ONE short follow-up before moving on. Otherwise move to the next question.
4. If the candidate asks you to repeat or rephrase, do so in plainer words.
5. After the last question, thank them, say in two sentences what went best and the one thing to work on, and tell them they can type their answers on the page to get a full scorecard.
Never invent facts about the candidate. Only use what they say and the resume below. Do not give scores out of 100. Stay on the interview.

The questions:
${qs}

The candidate's resume lines:
${cv || "- (none)"}

What the job asks for:
${reqs || "- (none)"}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return apiError("bad_request", "Use POST for this endpoint.", 405);
  let body: { session_id?: string };
  try { body = await request.json(); } catch { return apiError("bad_request", "Request body must be JSON.", 400); }
  if (!isUuid(body?.session_id)) return apiError("bad_request", "A valid session_id is required.", 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return apiError("llm_failed", "The live interviewer is not available right now.", 503);

  try {
    const client = userClient(request);
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) return apiError("unauthorized", "Please sign in and try again.", 401);
    const session = await ownedSession(client, body.session_id, auth.user.id);
    if (!session) return apiError("not_found", "Practice session not found.", 404);

    const { data: qRows, error: qError } = await client.from("questions")
      .select("position, text")
      .eq("session_id", session.id);
    if (qError) throw qError;
    const questions = (qRows ?? []) as Question[];
    if (!questions.length) return apiError("bad_request", "This session has no questions yet.", 400);

    const model = Deno.env.get("GEMINI_LIVE_MODEL") ?? DEFAULT_LIVE_MODEL;
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: interviewerPrompt(
              session.role_title || "this role",
              session.company,
              questions,
              (session.resume_lines ?? []) as ResumeLine[],
              (session.jd_requirements ?? []) as JdRequirement[],
            ),
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    if (!token.name) throw new Error("No token returned");
    return jsonResponse({ token: token.name, model });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError("unauthorized", "Please sign in and try again.", 401);
    }
    console.error("live-token failed", error);
    return apiError("llm_failed", "The live interviewer could not start. Please try again.", 502);
  }
});
