type Provider = "gemini" | "anthropic";

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

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
    const raw = provider === "gemini"
      ? await callGemini(systemPrompt, repairPrompt)
      : await callAnthropic(systemPrompt, repairPrompt);
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
  const model = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(25_000),
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini request failed", response.status, detail.slice(0, 500));
    throw new LlmError("The AI provider request failed.");
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "").join("");
  if (typeof text !== "string" || !text.trim()) throw new LlmError("The AI returned an empty response.");
  return text;
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
    signal: AbortSignal.timeout(25_000),
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
