type Provider = "gemini" | "anthropic";

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
// Tried in order when the main model is overloaded (503), rate limited (429) or hangs,
// so a live demo still answers. GEMINI_FALLBACK_MODELS (comma-separated) overrides it.
const DEFAULT_GEMINI_FALLBACK_MODELS = "gemini-3.5-flash,gemini-3.1-flash-lite,gemini-flash-lite-latest";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
// Edge functions allow up to 150 s per request. The main Gemini model gets a short
// budget so a hung or overloaded call still leaves time for the fallback model.
const REQUEST_TIMEOUT_MS = 60_000;
const PRIMARY_GEMINI_TIMEOUT_MS = 12_000;

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

/** Generate JSON from the configured LLM provider. The result is always parsed
 * and validated by the caller; the model is never trusted as a source of IDs. */
export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const provider = (Deno.env.get("LLM_PROVIDER") ?? "gemini") as Provider;
  if (provider !== "gemini" && provider !== "anthropic") {
    throw new LlmError("LLM_PROVIDER must be gemini or anthropic.");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const repairPrompt = attempt === 0
      ? userPrompt
      : `${userPrompt}\n\nYour previous response was invalid. Return only corrected JSON matching the requested schema.`;
    // Retry malformed model output once, but do not spend another full request
    // timeout retrying an unavailable provider.
    let raw: string;
    try {
      raw = provider === "gemini"
        ? await callGemini(systemPrompt, repairPrompt)
        : await callAnthropic(systemPrompt, repairPrompt);
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        console.error("LLM request timed out", error);
        throw new LlmError("The AI took too long to respond. Please try again.");
      }
      throw error;
    }
    try {
      const parsed = parseJson(raw);
      if (validate(parsed)) return parsed;
      lastError = new Error("The model response did not match the required schema.");
    } catch (error) {
      lastError = error;
    }
  }

  console.error("LLM output failed validation after one retry", lastError);
  throw new LlmError("The AI could not produce a valid response. Please try again.");
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new LlmError("GEMINI_API_KEY is not configured.");
  const primary = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL;
  const fallbacks = (Deno.env.get("GEMINI_FALLBACK_MODELS") ?? DEFAULT_GEMINI_FALLBACK_MODELS)
    .split(",").map((model) => model.trim()).filter((model) => model && model !== primary);
  const models = [primary, ...fallbacks];

  // Two passes: a busy (503/429) model often answers a second later; one that timed out is skipped.
  const timedOut = new Set<string>();
  for (let pass = 0; pass < 2; pass += 1) {
    if (pass > 0) await new Promise((resolve) => setTimeout(resolve, 1500));
    for (const [index, model] of models.entries()) {
      if (timedOut.has(model)) continue;
      const isLast = pass === 1 && index === models.length - 1;
      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                // Gemini 3 models think at "high" by default, which is slow; these are structured extraction tasks.
                ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
              },
            }),
            signal: AbortSignal.timeout(isLast ? REQUEST_TIMEOUT_MS : PRIMARY_GEMINI_TIMEOUT_MS),
          },
        );
      } catch (error) {
        if (!isLast && error instanceof DOMException && error.name === "TimeoutError") {
          console.error("Gemini request timed out, trying the next model", model);
          timedOut.add(model);
          continue;
        }
        throw error;
      }
      if (!response.ok) {
        const detail = await response.text();
        console.error("Gemini request failed", model, response.status, detail.slice(0, 300));
        // 403 shows up intermittently on free keys under load; 404 means the model is not offered to this key.
        if ([403, 404, 429, 503].includes(response.status)) continue;
        throw new LlmError("The AI provider request failed.");
      }
      const payload = await response.json();
      const text = payload?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "").join("");
      if (typeof text !== "string" || !text.trim()) throw new LlmError("The AI returned an empty response.");
      if (model !== primary) console.log("Gemini answered with fallback model", model);
      return text;
    }
  }
  throw new LlmError("The AI service is busy right now. Please try again in a moment.");
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new LlmError("ANTHROPIC_API_KEY is not configured.");
  const model = Deno.env.get("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 5000,
      temperature: 0.2,
      system: `${systemPrompt}\nReturn only a valid JSON object, with no markdown fences or commentary.`,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Anthropic request failed", response.status, detail.slice(0, 500));
    throw new LlmError("The AI provider request failed.");
  }
  const payload = await response.json();
  const text = payload?.content?.find((block: { type?: string }) => block.type === "text")?.text;
  if (typeof text !== "string" || !text.trim()) throw new LlmError("The AI returned an empty response.");
  return text;
}

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
