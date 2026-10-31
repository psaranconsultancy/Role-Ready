import { apiError, corsHeaders, jsonResponse } from "../_shared/http.ts";
import { userClient } from "../_shared/session.ts";

// Natural interviewer voice: turns one short line (a question, a check-in or
// feedback) into speech with Gemini text-to-speech. The browser falls back to
// its own built-in voice if this is slow or fails, so the interview never stalls.

const DEFAULT_TTS_MODEL = "gemini-3.8-flash-tts";
const DEFAULT_VOICE = "Sulafat";
const STYLE =
  "a warm, friendly, encouraging job interviewer with a natural British accent, speaking at a relaxed conversational pace";
const MAX_CHARS = 1200;

async function synthesise(apiKey: string, model: string, voice: string, text: string, withStyle: boolean) {
  const part: Record<string, unknown> = withStyle
    ? { text, speech_metadata: { style: STYLE } }
    : { text: `Say this as ${STYLE}: ${text}` };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [part] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const inline = json?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data,
  )?.inlineData;
  if (!inline?.data) throw new Error("tts returned no audio");
  return { audio: inline.data as string, mime: (inline.mimeType as string) ?? "audio/L16;rate=24000" };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return apiError("bad_request", "Use POST for this endpoint.", 405);
  let body: { text?: string };
  try { body = await request.json(); } catch { return apiError("bad_request", "Request body must be JSON.", 400); }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) return apiError("bad_request", "Send between 1 and 1200 characters of text.", 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return apiError("llm_failed", "The natural voice is not available right now.", 503);

  const client = userClient(request);
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return apiError("unauthorized", "Please sign in and try again.", 401);

  const model = Deno.env.get("GEMINI_TTS_MODEL") ?? DEFAULT_TTS_MODEL;
  const voice = Deno.env.get("GEMINI_TTS_VOICE") ?? DEFAULT_VOICE;
  try {
    try {
      return jsonResponse(await synthesise(apiKey, model, voice, text, true));
    } catch (first) {
      console.warn("speak: styled request failed, retrying plain", String(first));
      return jsonResponse(await synthesise(apiKey, model, voice, text, false));
    }
  } catch (error) {
    console.error("speak failed", String(error));
    return apiError("llm_failed", "The natural voice could not speak this line.", 502);
  }
});
