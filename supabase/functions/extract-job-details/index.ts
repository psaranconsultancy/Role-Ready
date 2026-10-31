import { createClient } from "npm:@supabase/supabase-js@2";
import { generateJson, LlmError } from "../_shared/llm.ts";

// Reads a job spec and returns the actual job title and hiring company, so the
// setup page can fill them in. Stateless: nothing is stored.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const apiError = (code: string, message: string, status: number) => jsonResponse({ error: { code, message } }, status);

interface Details { role_title: string | null; company: string | null }

const isDetails = (v: unknown): v is Details => {
  const d = v as Details;
  return !!d && typeof d === "object"
    && (d.role_title === null || typeof d.role_title === "string")
    && (d.company === null || typeof d.company === "string");
};

const clean = (s: string | null, max: number) => {
  const t = (s ?? "").replace(/\s+/g, " ").replace(/^["'\s]+|["'.\s]+$/g, "").trim();
  return t && t.length <= max ? t : null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return apiError("bad_request", "Use POST for this endpoint.", 405);
  let body: { jd_text?: unknown };
  try { body = await request.json(); } catch { return apiError("bad_request", "Request body must be JSON.", 400); }
  const jd = typeof body?.jd_text === "string" ? body.jd_text.trim() : "";
  if (jd.length < 40) return apiError("bad_request", "Send the job description text.", 400);

  try {
    const authorization = request.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!authorization || !url || !anonKey) return apiError("unauthorized", "Please sign in and try again.", 401);
    const client = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: auth, error } = await client.auth.getUser();
    if (error || !auth.user) return apiError("unauthorized", "Please sign in and try again.", 401);

    const result = await generateJson<Details>(
      "You extract facts from job adverts. Follow the output schema exactly. Never invent anything.",
      [
        "From the job description below, return the job title being hired for and the hiring company.",
        "Rules:",
        "- role_title is the job title only, as an employer would write it in Title Case, e.g. \"Senior Business Analyst\".",
        "  Leave out describing words (experienced, adaptable, talented), the team, location, contract type and salary.",
        "  If the text does not name a real job title, use null.",
        "- company is the employer's name only, e.g. \"FinFlow\". Not a recruitment agency unless it is the only name given.",
        "  If no company is named, use null.",
        "Return JSON: {\"role_title\": string|null, \"company\": string|null}",
        "<job_description>",
        jd.slice(0, 8000),
        "</job_description>",
      ].join("\n"),
      isDetails,
    );
    return jsonResponse({ role_title: clean(result.role_title, 100), company: clean(result.company, 100) });
  } catch (err) {
    console.error("extract-job-details failed", err);
    const message = err instanceof LlmError ? err.message : "Could not read the job details.";
    return apiError("llm_failed", message, 502);
  }
});
