import React from 'react';
import { Volume2 } from 'lucide-react';
import { useInterviewerVoice, type InterviewerGender } from '../lib/interviewerVoice';

// Lets the candidate choose (and hear) their interviewer before the
// questions are generated, so the very first question uses that voice.

const SAMPLE = "Hi, I'll be your interviewer today. Take your time, and answer in your own words.";

const OPTIONS: { value: InterviewerGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export const InterviewerPicker: React.FC = () => {
  const voice = useInterviewerVoice();
  if (!voice.supported) return null;

  const choose = (g: InterviewerGender) => {
    voice.setGender(g);
    if (!voice.enabled) voice.setEnabled(true);
    voice.speak(SAMPLE, 'preview', true);
  };

  return (
    <div
      data-ui="interviewer-picker"
      className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">Your interviewer</p>
        <p className="text-xs text-[#6e6e73]">
          They read each question and your feedback aloud. Tap one to hear them. You can switch later.
        </p>
      </div>
      <div role="radiogroup" aria-label="Interviewer voice" className="flex shrink-0 gap-2">
        {OPTIONS.map((o) => {
          const selected = voice.gender === o.value;
          const playing = selected && voice.speakingId === 'preview';
          return (
            <button data-tip="Choose who reads your questions aloud"
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(o.value)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                selected
                  ? 'border-[#0ea5e9]/50 bg-[#0ea5e9]/15 text-[#0369a1]'
                  : 'border-black/15 bg-white text-[#424245] hover:bg-black/[0.04]'
              }`}
            >
              <Volume2 className={`h-3.5 w-3.5 ${playing ? 'animate-pulse' : ''}`} aria-hidden="true" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
