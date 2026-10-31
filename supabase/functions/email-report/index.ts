import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";
import { apiError, corsHeaders, isUuid, jsonResponse } from "../_shared/http.ts";
import { ownedSession, userClient } from "../_shared/session.ts";

// Emails a finished practice session's report to the candidate.
// The email is built here from the database (never from text the browser
// sends), and sent through Gmail SMTP with an app password:
//   secrets GMAIL_USER and GMAIL_APP_PASSWORD.
// Limits: 5 emails per user per day, 60 per hour overall.

interface Question { id: string; position: number; text: string; type: string }
interface Answer {
  question_id: string; answer_text: string; overall: number;
  scores: Record<string, number>; what_worked: string; one_fix: string;
  stronger_answer: string; unsupported_claims: string[];
}

const TYPE_LABELS: Record<string, string> = {
  behavioural: "Behavioural", technical: "Technical", role_fit: "Role fit", situational: "Situational",
};
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const SITE = "https://roleready-team44.vercel.app";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const colour = (n: number) => (n >= 75 ? "#0d9488" : n >= 50 ? "#d97706" : "#dc2626");

function buildEmail(role: string, dateText: string, overall: number, questions: Question[], answers: Map<string, Answer>, sessionId: string) {
  const answered = questions.filter((q) => answers.has(q.id));
  const focus = [...answered].sort((a, b) => answers.get(a.id)!.overall - answers.get(b.id)!.overall)[0];
  const tiles = questions.map((q) => {
    const a = answers.get(q.id);
    return `<td style="padding:4px"><div style="background:#1e293b;border-radius:10px;padding:8px 10px;color:#a1a1a6;font-size:11px">Q${q.position}<div style="color:#fff;font-size:18px;font-weight:700">${a ? a.overall : "-"}</div></div></td>`;
  }).join("");
  const blocks = answered.map((q) => {
    const a = answers.get(q.id)!;
    const crit = ["relevance", "evidence", "structure", "impact"].map((k) =>
      `<td style="padding:3px"><div style="background:#f1f5f9;border-radius:8px;padding:6px 8px;font-size:12px;color:#6e6e73">${k[0].toUpperCase() + k.slice(1)} <b style="color:#0f172a">${esc(a.scores?.[k])}/5</b></div></td>`
    ).join("");
    const claims = a.unsupported_claims?.length
      ? `<p style="margin:12px 0 4px;font-size:11px;font-weight:700;color:#6e6e73;text-transform:uppercase">Not backed by your resume</p><ul style="margin:0;padding-left:18px;color:#b45309">${a.unsupported_claims.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
      : "";
    const h = (t: string) => `<p style="margin:12px 0 4px;font-size:11px;font-weight:700;color:#6e6e73;text-transform:uppercase;letter-spacing:.04em">${t}</p>`;
    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px 20px;margin-top:14px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:12px;font-weight:700;color:#0284c7">Q${q.position} · ${esc(TYPE_LABELS[q.type] ?? q.type)}</td>
        <td align="right" style="font-size:14px;font-weight:700;color:${colour(a.overall)}">${a.overall}/100</td></tr></table>
      <p style="margin:6px 0 8px;font-size:15px;font-weight:700;color:#0f172a;line-height:1.4">${esc(q.text)}</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 -3px"><tr>${crit}</tr></table>
      ${h("Your answer")}<p style="margin:0;color:#424245;white-space:pre-wrap">${esc(a.answer_text)}</p>
      ${h("What worked")}<p style="margin:0">${esc(a.what_worked)}</p>
      ${h("One fix")}<p style="margin:0">${esc(a.one_fix)}</p>
      ${h("Stronger answer")}<p style="margin:0;background:#f0f9ff;border-left:3px solid #0284c7;padding:8px 12px;border-radius:6px">${esc(a.stronger_answer)}</p>
      ${claims}</div>`;
  }).join("");

  const link = `${SITE}/session/${sessionId}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:640px;margin:0 auto;padding:24px 14px">
    <div style="background:#0f172a;color:#f8fafc;border-radius:18px;padding:22px">
      <div style="font-size:13px;font-weight:700">Role<span style="color:#38bdf8">Ready</span> <span style="font-weight:400;color:#a1a1a6">· Interview practice report</span></div>
      <div style="font-size:20px;font-weight:700;margin-top:8px">${esc(role)}</div>
      <div style="font-size:12px;color:#a1a1a6">${esc(dateText)}</div>
      <div style="margin-top:12px"><span style="font-size:36px;font-weight:700">${overall}</span><span style="color:#a1a1a6"> /100 session average across ${questions.length} questions</span></div>
      <table cellpadding="0" cellspacing="0" style="margin:8px -4px 0"><tr>${tiles}</tr></table>
      ${focus ? `<p style="margin:12px 0 0;font-size:13px">Practise next: Q${focus.position} (${answers.get(focus.id)!.overall}/100). ${esc(answers.get(focus.id)!.one_fix)}</p>` : ""}
    </div>
    ${blocks}
    <p style="text-align:center;margin:22px 0 6px"><a href="${link}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:10px 22px">Open this session in RoleReady</a></p>
    <p style="text-align:center;font-size:12px;color:#86868b">You can download the full PDF from the session page. Ready, Set, You're Hired.</p>
  </div></body></html>`;

  const text = [
    `RoleReady practice report: ${role}`, dateText, "", `Session average: ${overall}/100`, "",
    ...answered.flatMap((q) => {
      const a = answers.get(q.id)!;
      return [`Q${q.position} (${a.overall}/100): ${q.text}`, `What worked: ${a.what_worked}`, `One fix: ${a.one_fix}`, `Stronger answer: ${a.stronger_answer}`, ""];
    }),
    `Open the session: ${link}`,
  ].join("\n");
  return { html, text };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return apiError("bad_request", "Use POST for this endpoint.", 405);
  let body: { session_id?: string; to?: string };
  try { body = await request.json(); } catch { return apiError("bad_request", "Request body must be JSON.", 400); }
  if (!isUuid(body?.session_id)) return apiError("bad_request", "A valid session_id is required.", 400);

  // Find the secrets even if a name was typed with different case or spaces.
  const env = Deno.env.toObject();
  const pick = (want: string) => {
    const key = Object.keys(env).find((k) => k.trim().toUpperCase() === want);
    return key ? env[key]?.trim() : undefined;
  };
  const gmailUser = pick("GMAIL_USER");
  const gmailPass = pick("GMAIL_APP_PASSWORD")?.replace(/\s+/g, "");
  if (!gmailUser || !gmailPass) {
    // Names only, never values.
    console.error("email-report: missing secret", {
      has_user: !!gmailUser,
      has_password: !!gmailPass,
      gmail_like_names: Object.keys(env).filter((k) => /gmail|smtp|mail|app_?pass/i.test(k)),
    });
    return apiError("bad_request", "Email is not set up yet. Download the PDF instead.", 503);
  }

  try {
    const client = userClient(request);
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) return apiError("unauthorized", "Please sign in and try again.", 401);
    const user = auth.user;

    const to = (body.to ?? "").trim() || user.email || "";
    if (!EMAIL_RE.test(to) || to.length > 200) {
      return apiError("bad_request", "Please enter a valid email address.", 400);
    }

    const session = await ownedSession(client, body.session_id!, user.id);
    if (!session) return apiError("not_found", "Practice session not found.", 404);

    const [{ data: qRows, error: qErr }, { data: aRows, error: aErr }] = await Promise.all([
      client.from("questions").select("id, position, text, type").eq("session_id", session.id).order("position"),
      client.from("answers").select("question_id, answer_text, overall, scores, what_worked, one_fix, stronger_answer, unsupported_claims").eq("session_id", session.id),
    ]);
    if (qErr) throw qErr;
    if (aErr) throw aErr;
    const questions = (qRows ?? []) as Question[];
    const answers = new Map(((aRows ?? []) as Answer[]).map((a) => [a.question_id, a]));
    if (!answers.size) return apiError("bad_request", "Answer at least one question first.", 400);

    // Rate limits, checked with the service role.
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const dayAgo = new Date(Date.now() - 864e5).toISOString();
    const hourAgo = new Date(Date.now() - 36e5).toISOString();
    const [{ count: mine }, { count: all }] = await Promise.all([
      admin.from("report_emails").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("sent_at", dayAgo),
      admin.from("report_emails").select("id", { count: "exact", head: true }).gte("sent_at", hourAgo),
    ]);
    if ((mine ?? 0) >= 5 || (all ?? 0) >= 60) {
      return apiError("bad_request", "You've reached today's email limit. Download the PDF instead.", 429);
    }

    const overall = session.overall_score ??
      Math.round([...answers.values()].reduce((s, a) => s + a.overall, 0) / Math.max(1, questions.length));
    const role = [session.role_title || "Interview practice", session.company].filter(Boolean).join(" at ");
    const dateText = new Date(session.completed_at ?? session.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London",
    });
    const { html, text } = buildEmail(role, dateText, overall, questions, answers, session.id);

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transport.sendMail({
      from: `"RoleReady" <${gmailUser}>`,
      to,
      subject: `Your RoleReady report: ${role} (${overall}/100)`,
      text,
      html,
    });

    await admin.from("report_emails").insert({ user_id: user.id, session_id: session.id });
    return jsonResponse({ sent_to: to });
  } catch (err) {
    console.error("email-report failed", err);
    if (err instanceof Error && err.message === "unauthorized") {
      return apiError("unauthorized", "Please sign in and try again.", 401);
    }
    return apiError("bad_request", "We couldn't send the email just now. Download the PDF instead.", 502);
  }
});
