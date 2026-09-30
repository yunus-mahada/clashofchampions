import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Grid, Volume2, VolumeX, Music } from 'lucide-react';
import { formatScore } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface PauseOverlayProps {
  score: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  onResume: () => void;
  onRestartCategory: () => void;
  onGoToCategory: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onChangeSoundVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  score,
  soundEnabled,
  musicEnabled,
  soundVolume,
  musicVolume,
  onResume,
  onRestartCategory,
  onGoToCategory,
  onToggleSound,
  onToggleMusic,
  onChangeSoundVolume,
  onChangeMusicVolume,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 15 }}
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col items-center gap-4 text-center"
      >
        <div className="flex flex-col items-center">
          <span className="text-3xl mb-1">⏸️</span>
          <h2 className="text-xl font-black text-slate-100 tracking-wider uppercase font-cinzel">
            GAME PAUSED
          </h2>
          <span className="text-xs text-slate-400 mt-0.5">Permainan sedang dijeda</span>
        </div>

        {/* Current Score Display */}
        <div className="w-full py-2.5 px-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Skor Saat Ini</span>
          <span className="text-lg font-mono font-black text-amber-300">
            {formatScore(score)}
          </span>
        </div>

        {/* Audio Controls */}
        <div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3 flex flex-col gap-2.5 text-xs text-left">
          {/* SFX */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>Efek Suara (SFX)</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                soundEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? 'AKTIF' : 'MATI'}
            </button>
          </div>
          {soundEnabled && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => onChangeSoundVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          )}

          {/* BGM */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Music className={`w-4 h-4 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>Musik Latar (BGM)</span>
            </div>
            <button
              onClick={onToggleMusic}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                musicEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {musicEnabled ? 'AKTIF' : 'MATI'}
            </button>
          </div>
          {musicEnabled && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>LANJUTKAN PERMAINAN</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onRestartCategory();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-98 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ULANGI KATEGORI INI</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onGoToCategory();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold active:scale-98 transition-all"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>KEMBALI KE DAFTAR KATEGORI</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
