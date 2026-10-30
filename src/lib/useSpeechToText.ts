import { useCallback, useEffect, useRef, useState } from 'react';

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

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const rec = new Ctor();
    rec.lang = navigator.language || 'en-GB';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current(text.trim());
        } else {
          pending += text;
        }
      }
      setInterim(pending);
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

    setError(null);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError('Could not start the microphone. Try again, or type your answer.');
    }
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}
