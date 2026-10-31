import { useCallback, useEffect, useRef, useState } from 'react';
import { stopSpeaking } from './interviewerVoice';

// Browser speech-to-text (PRD should-have: the free fallback for a voice mock).
// Uses the Web Speech API, which Chrome, Edge and Safari support. Where it is
// missing, `supported` is false and the UI hides the mic button.

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow it in your browser settings, or type your answer.',
  'service-not-allowed':
    'Microphone access is blocked. Allow it in your browser settings, or type your answer.',
  'audio-capture': 'No microphone found. Plug one in, or type your answer.',
  network:
    'Speech-to-text needs an internet connection. Check it and try again, or type your answer.',
};

/**
 * Streams speech into text. `onFinalText` gets each finished phrase so the
 * caller can append it to the answer box; `interim` holds the phrase still
 * being spoken, for a live preview.
 */
export function useSpeechToText(onFinalText: (text: string) => void) {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalText);
  onFinalRef.current = onFinalText;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startingRef = useRef(false);

  const start = useCallback(async () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current || startingRef.current) return;
    setError(null);
    // Silence the interviewer first so the mic does not type up its voice.
    stopSpeaking();

    // Ask for the mic first. On phones a blocked mic often makes speech
    // recognition fail silently (button goes red, nothing happens), whereas
    // getUserMedia shows the permission prompt or rejects clearly.
    if (navigator.mediaDevices?.getUserMedia) {
      startingRef.current = true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const name = (err as { name?: string })?.name;
        setError(
          name === 'NotFoundError' || name === 'OverconstrainedError'
            ? ERROR_MESSAGES['audio-capture']
            : ERROR_MESSAGES['not-allowed']
        );
        return;
      } finally {
        startingRef.current = false;
      }
    }

    const rec = new Ctor();
    rec.lang = navigator.language || 'en-GB';
    rec.continuous = true;
    rec.interimResults = true;

    // Android Chrome re-sends earlier results, and each "final" result can
    // repeat the words before it. So we track which result slots are already
    // used and only add the words that are new since the last final phrase.
    const seen = new Map<number, string>();
    let lastFinal = '';

    rec.onresult = (e) => {
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript.trim();
        if (result.isFinal) {
          if (seen.get(i) === text) continue;
          seen.set(i, text);
          let fresh = text;
          const prev = lastFinal.toLowerCase();
          if (prev && text.toLowerCase().startsWith(prev)) {
            fresh = text.slice(lastFinal.length).trim();
          }
          if (text) lastFinal = text;
          if (fresh) onFinalRef.current(fresh);
        } else {
          pending += result[0].transcript;
        }
      }
      // Hide the part of the live preview we have already added.
      const p = pending.trim();
      setInterim(
        lastFinal && p.toLowerCase().startsWith(lastFinal.toLowerCase())
          ? p.slice(lastFinal.length).trim()
          : p
      );
    };
    rec.onerror = (e) => {
      // "no-speech" and "aborted" just end the take; nothing to report.
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(
          ERROR_MESSAGES[e.error] ??
            'Speech-to-text stopped unexpectedly. Try again, or type your answer.'
        );
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError('Could not start the microphone. Try again, or type your answer.');
    }
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}
