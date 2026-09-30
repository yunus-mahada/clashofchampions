import React from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { formatScore } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { BackButton } from './BackButton';

interface ScoreHUDProps {
  score: number;
  combo: number;
  questionIndex?: number;
  totalQuestions?: number;
  title?: string;
  onBack: () => void;
  onPause?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  score,
  combo,
  questionIndex,
  totalQuestions = 15,
  title,
  onBack,
  onPause,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 z-30 select-none">
      {/* Left Back Button - Optimized for 44px+ touch targets on iOS & Android */}
      <BackButton onClick={onBack} size="md" label="" ariaLabel="Kembali" />

      {/* Center Info */}
      <div className="flex flex-col items-center justify-center">
        {questionIndex !== undefined ? (
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              SOAL {String(questionIndex).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>
            {title && (
              <div className="text-xs text-slate-300 font-medium truncate max-w-[170px] sm:max-w-[260px]">
                {title}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {title || 'CLASH OF CHAMPIONS'}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Score & Pause */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">SKOR</span>
          <span className="text-sm font-extrabold text-amber-300 font-mono">
            {formatScore(score)}
          </span>
        </div>

        <button
          onClick={onToggleSound}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white"
          aria-label={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {onPause && (
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onPause();
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:scale-95 border border-slate-700/60 text-slate-200"
            aria-label="Jeda"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
