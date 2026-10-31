import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { isMockMode } from "./api";

// The talking interviewer: reads questions and feedback aloud with the
// browser's built-in speech synthesis (free, no API key, works offline in most
// browsers). Where speechSynthesis is missing, `supported` is false and the UI
// hides every voice control, so the text flow is unchanged.

const STORAGE_KEY = "roleready.interviewerVoice";

interface VoiceState {
  supported: boolean;
  enabled: boolean;
  /** Which thing is being read right now, e.g. "q:<id>" or "fb:<id>". */
  speakingId: string | null;
  /** The browser refused to speak until the user clicks something. */
  blocked: boolean;
}

const synth: SpeechSynthesis | null =
  typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;

const readEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

let state: VoiceState = {
  supported: synth !== null && typeof SpeechSynthesisUtterance !== "undefined",
  enabled: readEnabled(),
  speakingId: null,
  blocked: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setState = (patch: Partial<VoiceState>) => {
  state = { ...state, ...patch };
  emit();
};

// Pick a clear English voice. Prefer a British one (the team and users are UK),
// then any natural-sounding English voice, then the browser default.
let chosenVoice: SpeechSynthesisVoice | null = null;
const pickVoice = () => {
  if (!synth) return;
  const voices = synth.getVoices();
  if (!voices.length) return;
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  // Voices built into the computer are far more reliable than Chrome's
  // network voices ("Google UK English…"), which can fail silently.
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (v.localService) s += 5;
    // Edge's "Natural" voices (e.g. Microsoft Sonia Online) sound far more human.
    if (/natural/i.test(v.name)) s += 6;
    if (/en[-_]GB/i.test(v.lang)) s += 4;
    if (
      /daniel|serena|kate|hazel|susan|george|libby|sonia|ryan|samantha/i.test(
        v.name,
      )
    )
      s += 2;
    if (/premium|enhanced/i.test(v.name)) s += 1;
    return s;
  };
  chosenVoice = [...english].sort((a, b) => score(b) - score(a))[0] ?? null;
};
if (synth) {
  pickVoice();
  synth.addEventListener?.("voiceschanged", pickVoice);
}

// Chrome stops long utterances after ~15 seconds, so speak sentence-sized
// chunks one after another. Keep references so they are not garbage-collected
// mid-speech (another Chrome quirk that drops the `end` event).
const live: { utterances: SpeechSynthesisUtterance[] } = { utterances: [] };
let runToken = 0;

const splitIntoChunks = (text: string): string[] => {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > 180 && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

// ---- Natural voice (Gemini text-to-speech) ------------------------------
// The interviewer speaks with Gemini's natural voice through our `speak` edge
// function. If it is slow, fails or runs out of quota, the browser's built-in
// voice takes over for that line, so the interview never stalls. Add
// ?voice=browser to the address to force the built-in voice (?voice=natural
// switches back).

const NATURAL_KEY = "roleready.naturalVoice";
let naturalFailures = 0;
let currentAudio: { el: HTMLAudioElement; url: string } | null = null;
const audioCache = new Map<string, Promise<Blob | null>>();

const naturalEnabled = (): boolean => {
  if (typeof window === "undefined" || typeof Audio === "undefined")
    return false;
  if (naturalFailures >= 3 || isMockMode()) return false;
  try {
    const param = new URLSearchParams(window.location.search).get("voice");
    if (param === "browser") localStorage.setItem(NATURAL_KEY, "off");
    if (param === "natural") localStorage.removeItem(NATURAL_KEY);
    return localStorage.getItem(NATURAL_KEY) !== "off";
  } catch {
    return true;
  }
};

// Gemini returns raw 16-bit PCM; wrap it in a WAV header so <audio> can play it.
const toWavBlob = (b64: string, mime: string): Blob => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (
    /wav/i.test(mime) ||
    (bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46)
  ) {
    return new Blob([bytes], { type: "audio/wav" });
  }
  const rate = Number(/rate=(\d+)/i.exec(mime)?.[1] ?? 24000);
  const header = new DataView(new ArrayBuffer(44));
  const str = (o: number, t: string) =>
    [...t].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  header.setUint32(4, 36 + bytes.length, true);
  str(8, "WAVE");
  str(12, "fmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, rate, true);
  header.setUint32(28, rate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  str(36, "data");
  header.setUint32(40, bytes.length, true);
  return new Blob([header.buffer, bytes], { type: "audio/wav" });
};

const fetchNatural = (text: string): Promise<Blob | null> => {
  const cached = audioCache.get(text);
  if (cached) return cached;
  const p = (async () => {
    const { data, error } = await supabase.functions.invoke<{
      audio: string;
      mime: string;
    }>("speak", {
      body: { text },
    });
    if (error || !data?.audio) throw new Error("speak failed");
    naturalFailures = 0;
    return toWavBlob(data.audio, data.mime ?? "");
  })().catch(() => {
    audioCache.delete(text);
    naturalFailures += 1;
    return null;
  });
  audioCache.set(text, p);
  if (audioCache.size > 40)
    audioCache.delete(audioCache.keys().next().value as string);
  return p;
};

/** Start making the natural voice for a line we expect to speak soon. */
export const prefetchSpeech = (text: string) => {
  const clean = text.trim();
  if (clean && state.supported && state.enabled && naturalEnabled())
    void fetchNatural(clean);
};

const stopAudio = () => {
  if (!currentAudio) return;
  currentAudio.el.onended = null;
  currentAudio.el.onerror = null;
  currentAudio.el.pause();
  URL.revokeObjectURL(currentAudio.url);
  currentAudio = null;
};

export const stopSpeaking = () => {
  runToken += 1;
  stopAudio();
  live.utterances = [];
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  if (state.speakingId !== null) setState({ speakingId: null });
};

/**
 * Read `text` aloud. `id` labels what is being read so a button can show
 * "Stop". With `force` it speaks even when the voice is switched off (used by
 * the per-question "Hear it" button, which is an explicit request).
 */
export const speak = (text: string, id: string, force = false) => {
  if (!state.supported) return;
  if (!state.enabled && !force) return;
  const clean = text.trim();
  if (!clean) return;

  stopSpeaking();
  const token = runToken;
  if (!chosenVoice) pickVoice();
  const chunks = splitIntoChunks(clean);
  setState({ speakingId: id });

  const finish = () => {
    if (token !== runToken) return;
    live.utterances = [];
    stopAudio();
    setState({ speakingId: null });
  };

  if (naturalEnabled()) {
    // Wait a little for the natural voice; past that, use the browser voice.
    const waitMs = Math.min(12000, 5000 + clean.length * 12);
    const timeout = new Promise<"timeout">((r) =>
      window.setTimeout(() => r("timeout"), waitMs),
    );
    void Promise.race([fetchNatural(clean), timeout]).then((blob) => {
      if (token !== runToken) return;
      if (!(blob instanceof Blob)) return browserSpeak();
      const url = URL.createObjectURL(blob);
      const el = new Audio(url);
      currentAudio = { el, url };
      el.onended = () => finish();
      el.onerror = () => {
        if (token !== runToken) return;
        stopAudio();
        browserSpeak();
      };
      el.play().then(
        () => {
          if (state.blocked) setState({ blocked: false });
        },
        (err: { name?: string }) => {
          if (token !== runToken) return;
          stopAudio();
          if (err?.name === "NotAllowedError") {
            setState({ blocked: true });
            return finish();
          }
          browserSpeak();
        },
      );
    });
    return;
  }
  browserSpeak();

  function browserSpeak() {
    if (!synth) return finish();

    // Speak one chunk at a time; Chrome is more reliable this way than with a
    // long queue. If the chosen voice fails, retry that chunk with the default.
    const sayChunk = (i: number, useChosen: boolean) => {
      if (token !== runToken) return;
      if (i >= chunks.length) return finish();
      const u = new SpeechSynthesisUtterance(chunks[i]);
      if (useChosen && chosenVoice) {
        u.voice = chosenVoice;
        u.lang = chosenVoice.lang;
      } else {
        u.lang = "en-GB";
      }
      let started = false;
      u.onstart = () => {
        started = true;
        if (state.blocked) setState({ blocked: false });
      };
      u.onend = () => sayChunk(i + 1, useChosen);
      u.onerror = (e: SpeechSynthesisErrorEvent) => {
        if (
          token !== runToken ||
          e.error === "interrupted" ||
          e.error === "canceled"
        )
          return;
        if (e.error === "not-allowed") {
          setState({ blocked: true });
          return finish();
        }
        if (useChosen && chosenVoice) return sayChunk(i, false);
        finish();
      };
      live.utterances = [u];
      try {
        synth.resume();
      } catch {
        /* ignore */
      }
      synth.speak(u);
      // Some browsers never start or end (no voices, or speech blocked before a
      // click). Don't leave the "speaking" state stuck.
      window.setTimeout(() => {
        if (token === runToken && !started && !synth.speaking) {
          if (useChosen && chosenVoice) return sayChunk(i, false);
          setState({ blocked: true });
          finish();
        }
      }, 3000);
    };

    // Chrome can drop a speak() that comes straight after cancel(); wait a beat.
    window.setTimeout(() => sayChunk(0, true), 80);

    // Chrome sometimes never fires the last `end` event, which would leave the
    // interviewer "speaking" for ever (and the idle check-in never starting).
    // Two quiet checks in a row mean it has finished.
    let quietChecks = 0;
    const watchdog = window.setInterval(() => {
      if (token !== runToken || state.speakingId !== id)
        return window.clearInterval(watchdog);
      quietChecks = !synth.speaking && !synth.pending ? quietChecks + 1 : 0;
      if (quietChecks >= 2) {
        window.clearInterval(watchdog);
        finish();
      }
    }, 1000);
  }
};

export const setVoiceEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* private mode: keep it for this visit only */
  }
  if (!enabled) stopSpeaking();
  setState({ enabled });
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

/** React hook: the interviewer voice state, plus the actions. */
export function useInterviewerVoice() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snap,
    speak,
    stop: stopSpeaking,
    setEnabled: setVoiceEnabled,
  };
}

// Stop talking when the user leaves the page or the tab reloads.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => stopSpeaking());
}

// ---- What the interviewer says -------------------------------------------

export const questionScript = (position: number, text: string) =>
  `Question ${position}. ${text}`;

export const feedbackScript = (
  overall: number,
  bandLabel: string,
  whatWorked: string,
  oneFix: string,
) =>
  `You scored ${overall} out of 100. ${bandLabel}. ` +
  `What worked: ${whatWorked} ` +
  `One thing to fix: ${oneFix}`;
