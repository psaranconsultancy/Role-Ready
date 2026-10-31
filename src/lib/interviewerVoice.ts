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
  /** The browser refused to speak until the user clicks something. */
  blocked: boolean;
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
    if (/en[-_]GB/i.test(v.lang)) s += 4;
    if (/daniel|serena|kate|hazel|susan|george|libby|sonia|ryan|samantha/i.test(v.name)) s += 2;
    if (/premium|enhanced/i.test(v.name)) s += 1;
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
const live: { utterances: SpeechSynthesisUtterance[] } = { utterances: [] };
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
  if (!synth || !state.supported) return;
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
    setState({ speakingId: null });
  };

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
      u.lang = 'en-GB';
    }
    let started = false;
    u.onstart = () => {
      started = true;
      if (state.blocked) setState({ blocked: false });
    };
    u.onend = () => sayChunk(i + 1, useChosen);
    u.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (token !== runToken || e.error === 'interrupted' || e.error === 'canceled') return;
      if (e.error === 'not-allowed') {
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
