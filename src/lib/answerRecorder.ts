import { useCallback, useEffect, useRef, useState } from 'react';
import { stopSpeaking } from './interviewerVoice';

// Answer replay: while "Speak your answer" is on, we also record the
// candidate's voice in the browser so they can hear themselves next to the
// feedback. Recordings stay in this tab only (never uploaded) and are gone
// when the page is reloaded.
//
// Phones are left out on purpose: Android and iOS often stop speech-to-text
// when a second recorder holds the mic, and typing up the answer matters more
// than replaying it. Add ?replay=1 to the URL to try it on a phone anyway.

export interface AnswerTake {
  url: string;
  seconds: number;
}

const store = new Map<string, AnswerTake[]>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function saveAnswerRecording(questionId: string, takes: AnswerTake[]) {
  const old = store.get(questionId);
  old?.forEach((t) => {
    if (!takes.includes(t)) URL.revokeObjectURL(t.url);
  });
  if (takes.length) store.set(questionId, takes);
  else store.delete(questionId);
  notify();
}

export function useSavedRecording(questionId: string): AnswerTake[] | null {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return store.get(questionId) ?? null;
}

const pickMime = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* keep looking */
    }
  }
  return '';
};

export function isReplaySupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  if (new URLSearchParams(window.location.search).get('replay') === '1') return true;
  const ua = navigator.userAgent;
  const phone =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return !phone;
}

/**
 * Records while `active` is true. Each stretch of recording becomes one take.
 * Any failure is silent: replay is a bonus and must never block answering.
 */
export function useAnswerRecorder(active: boolean) {
  const [supported] = useState(isReplaySupported);
  const [takes, setTakesState] = useState<AnswerTake[]>([]);
  const takesRef = useRef<AnswerTake[]>([]);
  const setTakes = (fn: (prev: AnswerTake[]) => AnswerTake[]) => {
    takesRef.current = fn(takesRef.current);
    setTakesState(takesRef.current);
  };
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const wantRef = useRef(false);

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!supported) return;
    wantRef.current = active;
    if (active && !recRef.current) {
      void (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!wantRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const mime = pickMime();
          const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          const chunks: Blob[] = [];
          rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          rec.onstop = () => {
            const seconds = (Date.now() - startedAt.current) / 1000;
            release();
            recRef.current = null;
            if (chunks.length && seconds >= 1) {
              const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
              setTakes((prev) => [...prev, { url: URL.createObjectURL(blob), seconds }]);
            }
          };
          streamRef.current = stream;
          recRef.current = rec;
          startedAt.current = Date.now();
          rec.start(1000);
        } catch {
          release();
          recRef.current = null;
        }
      })();
    } else if (!active && recRef.current) {
      try {
        if (recRef.current.state !== 'inactive') recRef.current.stop();
      } catch {
        release();
        recRef.current = null;
      }
    }
  }, [active, supported]);

  useEffect(
    () => () => {
      wantRef.current = false;
      try {
        if (recRef.current && recRef.current.state !== 'inactive') {
          recRef.current.onstop = null;
          recRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      release();
    },
    []
  );

  /** Hands the takes over (e.g. to the saved store) and starts a fresh draft. */
  const take = useCallback(() => {
    const t = takesRef.current;
    setTakes(() => []);
    return t;
  }, []);

  /** Like take(), but first waits (up to 2 s) for a recording still closing. */
  const takeWhenDone = useCallback(async () => {
    const until = Date.now() + 2000;
    while (recRef.current && Date.now() < until) {
      await new Promise((r) => window.setTimeout(r, 100));
    }
    return take();
  }, [take]);

  /** Throws the draft takes away (the answer box was cleared). */
  const discard = useCallback(() => {
    takesRef.current.forEach((t) => URL.revokeObjectURL(t.url));
    setTakes(() => []);
  }, []);

  return { supported, takes, take, takeWhenDone, discard };
}

/** Plays the takes one after another. */
export function useTakesPlayer(takes: AnswerTake[] | null) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef(0);
  const doneBefore = useRef(0);
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
    setElapsed(0);
  }, []);

  const playFrom = useCallback(
    (i: number) => {
      if (!takes || i >= takes.length) return stop();
      idxRef.current = i;
      const a = new Audio(takes[i].url);
      audioRef.current = a;
      a.onended = () => {
        doneBefore.current += takes[i].seconds;
        playFrom(i + 1);
      };
      a.onerror = () => stop();
      a.play().catch(() => stop());
    },
    [takes, stop]
  );

  const play = useCallback(() => {
    if (!takes?.length) return;
    stopSpeaking();
    doneBefore.current = 0;
    setPlaying(true);
    setElapsed(0);
    playFrom(0);
    timer.current = window.setInterval(() => {
      setElapsed(doneBefore.current + (audioRef.current?.currentTime ?? 0));
    }, 250);
  }, [takes, playFrom]);

  useEffect(() => stop, [stop, takes]);

  const total = takes?.reduce((s, t) => s + t.seconds, 0) ?? 0;
  return { playing, elapsed, total, play, stop };
}

export const formatSeconds = (s: number) => {
  const n = Math.max(0, Math.round(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
};
