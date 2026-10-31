import { supabase } from './supabase';
import { getVoiceState, setLiveActive } from './interviewerVoice';

// Live interview (beta): a real two-way spoken interview with Gemini Live.
// The browser asks our `live-token` edge function for a short-lived,
// single-use token (the interviewer's instructions are locked into it on the
// server), then streams microphone audio to Gemini over a WebSocket and plays
// the interviewer's voice as it arrives. If it fails, the typed interview
// below is unchanged.

// On for everyone (Pro tested it with a real mic, 31 Oct). ?live=0 hides it
// on this browser as an escape hatch; ?live=1 brings it back.
export const isLiveInterviewEnabled = (): boolean => {
  if (import.meta.env.VITE_LIVE_INTERVIEW === 'false') return false;
  if (typeof window === 'undefined') return true;
  try {
    const param = new URLSearchParams(window.location.search).get('live');
    if (param === '0') localStorage.setItem('roleready.liveInterview', 'off');
    if (param === '1') localStorage.removeItem('roleready.liveInterview');
    return localStorage.getItem('roleready.liveInterview') !== 'off';
  } catch {
    return true;
  }
};

export const isLiveInterviewSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof WebSocket !== 'undefined' &&
  typeof AudioWorkletNode !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

export type LiveStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'ended'
  | 'error';

export interface LiveLine {
  who: 'interviewer' | 'you';
  text: string;
}

interface Callbacks {
  onStatus: (status: LiveStatus, message?: string) => void;
  onTranscript: (lines: LiveLine[]) => void;
}

const WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';

// Captures mic audio in 32 ms chunks on the audio thread.
const CAPTURE_WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(512); this.i = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let k = 0; k < ch.length; k++) {
        this.buf[this.i++] = ch[k];
        if (this.i >= this.buf.length) { this.port.postMessage(this.buf.slice()); this.i = 0; }
      }
    }
    return true;
  }
}
registerProcessor('rr-capture', Capture);
`;

const floatToPcm16Base64 = (input: Float32Array, inRate: number): string => {
  // Downsample to 16 kHz if the browser ignored our sample-rate request.
  const ratio = inRate / 16000;
  const outLen = Math.floor(input.length / ratio);
  const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

const base64ToFloat = (b64: string): Float32Array => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] / 0x8000;
  return out;
};

export class LiveInterview {
  private ws: WebSocket | null = null;
  private micCtx: AudioContext | null = null;
  private playCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private playHead = 0;
  private sources: AudioBufferSourceNode[] = [];
  private lines: LiveLine[] = [];
  private ended = false;
  private speakingTimer: number | null = null;
  private quietTimer: number | null = null;
  private lastActivity = 0;
  private status: LiveStatus = 'idle';

  constructor(private cb: Callbacks) {}

  async start(sessionId: string) {
    this.ended = false;
    setLiveActive(true);
    this.cb.onStatus('connecting');
    try {
      // 1. Mic first, so a blocked mic fails before we spend a token.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      // 2. A single-use token for this session.
      const { data, error } = await supabase.functions.invoke<{ token: string; model: string }>(
        'live-token',
        { body: { session_id: sessionId, voice: getVoiceState().gender } }
      );
      if (error || !data?.token) throw new Error('token');

      // 3. Audio output, created inside the click so browsers allow playback.
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.playCtx = new AC({ sampleRate: 24000 });
      await this.playCtx.resume();

      // 4. Connect.
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}?access_token=${encodeURIComponent(data.token)}`);
        this.ws = ws;
        let ready = false;
        const timeout = window.setTimeout(() => !ready && reject(new Error('timeout')), 15000);
        ws.onopen = () => {
          ws.send(JSON.stringify({ setup: { model: `models/${data.model}` } }));
        };
        ws.onmessage = async (ev) => {
          const text = typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text();
          let msg: Record<string, unknown>;
          try { msg = JSON.parse(text); } catch { return; }
          if (msg.setupComplete !== undefined && !ready) {
            ready = true;
            window.clearTimeout(timeout);
            resolve();
            return;
          }
          this.handleServer(msg);
        };
        ws.onerror = () => reject(new Error('socket'));
        ws.onclose = (ev) => {
          window.clearTimeout(timeout);
          if (!ready) reject(new Error(ev.reason || 'closed'));
          else if (!this.ended) this.finish('The interview connection closed.');
        };
      });

      // 5. Stream the mic.
      this.micCtx = new AC({ sampleRate: 16000 });
      const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
      await this.micCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      this.node = new AudioWorkletNode(this.micCtx, 'rr-capture');
      const rate = this.micCtx.sampleRate;
      this.node.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({
          realtimeInput: { audio: { data: floatToPcm16Base64(e.data, rate), mimeType: 'audio/pcm;rate=16000' } },
        }));
      };
      this.micCtx.createMediaStreamSource(this.stream).connect(this.node);

      // 6. Ask the interviewer to open.
      this.ws?.send(JSON.stringify({ realtimeInput: { text: 'Hello, I am ready to start the interview.' } }));
      this.setStatus('listening');

      // Never leave the candidate stuck: after 45 quiet seconds on their turn,
      // the interviewer checks in (more time, or move on).
      this.lastActivity = Date.now();
      this.quietTimer = window.setInterval(() => {
        if (this.ended || this.status !== 'listening') return;
        if (Date.now() - this.lastActivity < 45000) return;
        this.lastActivity = Date.now();
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            realtimeInput: { text: '[The candidate has gone quiet for a while. Check in kindly.]' },
          }));
        }
      }, 5000);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const message =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone access is blocked. Allow it in your browser settings to talk to the interviewer.'
          : name === 'NotFoundError'
            ? 'No microphone found. Plug one in and try again.'
            : 'The live interviewer could not start. Please try again, or use the typed interview below.';
      this.ended = true;
      this.cleanup();
      this.cb.onStatus('error', message);
    }
  }

  private handleServer(msg: Record<string, unknown>) {
    const sc = msg.serverContent as
      | {
          modelTurn?: { parts?: Array<{ inlineData?: { data: string } }> };
          interrupted?: boolean;
          turnComplete?: boolean;
          inputTranscription?: { text?: string };
          outputTranscription?: { text?: string };
        }
      | undefined;
    if (msg.goAway) {
      this.finish('The interview reached its time limit.');
      return;
    }
    if (!sc) return;
    if (sc.interrupted) this.stopPlayback();
    for (const part of sc.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) this.play(base64ToFloat(part.inlineData.data));
    }
    if (sc.inputTranscription?.text) {
      this.lastActivity = Date.now();
      this.append('you', sc.inputTranscription.text);
    }
    if (sc.outputTranscription?.text) this.append('interviewer', sc.outputTranscription.text);
  }

  private append(who: LiveLine['who'], text: string) {
    const last = this.lines[this.lines.length - 1];
    if (last && last.who === who) {
      this.lines = [...this.lines.slice(0, -1), { who, text: last.text + text }];
    } else {
      this.lines = [...this.lines, { who, text: text.trimStart() }];
    }
    this.cb.onTranscript(this.lines);
  }

  private play(samples: Float32Array) {
    const ctx = this.playCtx;
    if (!ctx || !samples.length) return;
    const buf = ctx.createBuffer(1, samples.length, 24000);
    buf.getChannelData(0).set(samples);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const at = Math.max(ctx.currentTime + 0.03, this.playHead);
    src.start(at);
    this.playHead = at + buf.duration;
    this.sources.push(src);
    src.onended = () => {
      this.sources = this.sources.filter((s) => s !== src);
    };
    this.lastActivity = Date.now();
    this.setStatus('speaking');
    if (this.speakingTimer) window.clearTimeout(this.speakingTimer);
    this.speakingTimer = window.setTimeout(() => {
      if (!this.ended) { this.lastActivity = Date.now(); this.setStatus('listening'); }
    }, Math.max(0, (this.playHead - ctx.currentTime) * 1000) + 150);
  }

  private stopPlayback() {
    this.sources.forEach((s) => {
      try { s.stop(); } catch { /* already stopped */ }
    });
    this.sources = [];
    this.playHead = 0;
    if (!this.ended) { this.lastActivity = Date.now(); this.setStatus('listening'); }
  }

  private finish(message?: string) {
    if (this.ended) return;
    this.ended = true;
    this.cleanup();
    this.cb.onStatus('ended', message);
  }

  private setStatus(s: LiveStatus, message?: string) {
    this.status = s;
    this.cb.onStatus(s, message);
  }

  stop() {
    this.finish();
  }

  private cleanup() {
    setLiveActive(false);
    if (this.quietTimer) window.clearInterval(this.quietTimer);
    this.quietTimer = null;
    if (this.speakingTimer) window.clearTimeout(this.speakingTimer);
    this.stopPlayback();
    try { this.node?.disconnect(); } catch { /* ignore */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) this.ws.close();
    this.micCtx?.close().catch(() => undefined);
    this.playCtx?.close().catch(() => undefined);
    this.ws = null;
    this.node = null;
    this.stream = null;
    this.micCtx = null;
    this.playCtx = null;
  }
}
