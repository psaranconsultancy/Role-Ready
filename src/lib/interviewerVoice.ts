import { useSyncExternalStore } from 'react';

// The talking interviewer: reads questions and feedback aloud with the
// browser's built-in speech synthesis (free, no API key, works offline in most
// browsers). Where speechSynthesis is missing, `supported` is false and the UI
// hides every voice control, so the text flow is unchanged.

const STORAGE_KEY = 'roleready.interviewerVoice';

interface VoiceState {
  supported: boolean;
  enabled: boolean;
  /** Which thing is being read right now, e.g. "q:<id>" or "fb:<id>". */
  speakingId: string | null;
}

const synth: SpeechSynthesis | null =
  typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;

const readEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
};

let state: VoiceState = {
  supported: synth !== null && typeof SpeechSynthesisUtterance !== 'undefined',
  enabled: readEnabled(),
  speakingId: null,
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
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (/en[-_]GB/i.test(v.lang)) s += 4;
    if (/natural|neural|online|google|premium|enhanced/i.test(v.name)) s += 3;
    if (/samantha|daniel|serena|libby|sonia|ryan/i.test(v.name)) s += 2;
    if (v.localService) s += 1;
    return s;
  };
  chosenVoice = [...english].sort((a, b) => score(b) - score(a))[0] ?? null;
};
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

// Chrome stops long utterances after ~15 seconds, so speak sentence-sized
// chunks one after another. Keep references so they are not garbage-collected
// mid-speech (another Chrome quirk that drops the `end` event).
let activeUtterances: SpeechSynthesisUtterance[] = [];
let runToken = 0;

const splitIntoChunks = (text: string): string[] => {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
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

export const stopSpeaking = () => {
  runToken += 1;
  activeUtterances = [];
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  if (state.speakingId !== null) setState({ speakingId: null });
};

/**
 * Read `text` aloud. `id` labels what is being read so a button can show
 * "Stop". With `force` it speaks even when the voice is switched off (used by
 * the per-question "Hear it" button, which is an explicit request).
 */
export const speak = (text: string, id: string, force = false) => {
  if (!synth || !state.supported) return;
  if (!state.enabled && !force) return;
  const clean = text.trim();
  if (!clean) return;

  stopSpeaking();
  const token = runToken;
  if (!chosenVoice) pickVoice();

  const chunks = splitIntoChunks(clean);
  activeUtterances = chunks.map((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    if (chosenVoice) {
      u.voice = chosenVoice;
      u.lang = chosenVoice.lang;
    } else {
      u.lang = 'en-GB';
    }
    u.rate = 1;
    u.pitch = 1;
    const isLast = i === chunks.length - 1;
    const done = () => {
      if (token === runToken && isLast) {
        activeUtterances = [];
        setState({ speakingId: null });
      }
    };
    u.onend = done;
    u.onerror = () => {
      if (token === runToken) {
        activeUtterances = [];
        setState({ speakingId: null });
      }
    };
    return u;
  });

  setState({ speakingId: id });
  // Safari and some Chrome builds sit "paused" after a cancel; resume first.
  try {
    synth.resume();
  } catch {
    /* ignore */
  }
  activeUtterances.forEach((u) => synth.speak(u));

  // Some browsers never fire `end` (no voices installed, or speech blocked
  // before a click). Clear the "speaking" state once the queue is empty.
  const watchdog = window.setInterval(() => {
    if (token !== runToken) return window.clearInterval(watchdog);
    if (!synth.speaking && !synth.pending) {
      window.clearInterval(watchdog);
      activeUtterances = [];
      setState({ speakingId: null });
    }
  }, 1000);
};

export const setVoiceEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
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
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => stopSpeaking());
}

// ---- What the interviewer says -------------------------------------------

export const questionScript = (position: number, text: string) =>
  `Question ${position}. ${text}`;

export const feedbackScript = (
  overall: number,
  bandLabel: string,
  whatWorked: string,
  oneFix: string
) =>
  `You scored ${overall} out of 100. ${bandLabel}. ` +
  `What worked: ${whatWorked} ` +
  `One thing to fix: ${oneFix}`;
