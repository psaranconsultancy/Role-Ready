import React from 'react';
import { Play, Square } from 'lucide-react';
import { formatSeconds, useSavedRecording, useTakesPlayer } from '../lib/answerRecorder';

/** "Play your answer": the candidate's own recorded voice, next to the feedback. */
export const AnswerReplay: React.FC<{ questionId: string }> = ({ questionId }) => {
  const takes = useSavedRecording(questionId);
  const player = useTakesPlayer(takes);
  if (!takes?.length) return null;

  return (
    <div data-ui="answer-replay" className="mb-3 flex flex-wrap items-center gap-2.5">
      <button data-tip="Listen back to how you sounded"
        type="button"
        onClick={player.playing ? player.stop : player.play}
        aria-pressed={player.playing}
        className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
          player.playing
            ? 'border-[#0d9488]/40 bg-[#0d9488]/10 text-[#0f766e] hover:bg-[#0d9488]/15'
            : 'border-[#0284c7]/30 bg-white text-[#0369a1] hover:bg-[#0284c7]/[0.06]'
        }`}
      >
        {player.playing ? (
          <Square className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{player.playing ? 'Stop playback' : 'Play your answer'}</span>
      </button>
      <div className="flex min-w-[120px] flex-1 items-center gap-2" aria-hidden="true">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.08]">
          <div
            className="h-full rounded-full bg-[#0284c7] transition-[width] duration-200"
            style={{
              width: `${player.total ? Math.min(100, (player.elapsed / player.total) * 100) : 0}%`,
            }}
          />
        </div>
        <span className="text-xs tabular-nums text-[#6e6e73]">
          {player.playing ? `${formatSeconds(player.elapsed)} / ` : ''}
          {formatSeconds(player.total)}
        </span>
      </div>
      <span className="w-full text-xs text-[#86868b]">
        Hear how you came across, then read the feedback. Your recording stays on this device and is gone when you reload.
      </span>
    </div>
  );
};
