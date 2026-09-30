import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Music, Trash2, ShieldCheck, Sparkles, FileEdit, ChevronRight } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  onClose: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onChangeSoundVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
  onOpenResetConfirm: () => void;
  onOpenQuestionManager: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  soundEnabled,
  musicEnabled,
  soundVolume,
  musicVolume,
  onClose,
  onToggleSound,
  onToggleMusic,
  onChangeSoundVolume,
  onChangeMusicVolume,
  onOpenResetConfirm,
  onOpenQuestionManager,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col gap-4 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wider font-cinzel">
                PENGATURAN
              </h3>
            </div>
            <button
              onClick={() => {
                audioManager.playClick();
                Haptics.click();
                onClose();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Management Feature */}
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onOpenQuestionManager();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/20 active:scale-98 transition text-left group shadow-lg shadow-amber-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <FileEdit className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-300 block uppercase tracking-wide">
                  Setting Pertanyaan
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Daftar & ganti teks 60 soal, opsi, dan kunci
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Sound Effect (SFX) */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Efek Suara (SFX)</span>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
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
          </div>

          {/* Music (BGM) */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Music className={`w-4 h-4 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Musik Latar Sintetis (BGM)</span>
              </div>
              <button
                onClick={onToggleMusic}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
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

          {/* PWA Install Area */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Aplikasi Offline</span>
            </div>
            <PWAInstallButton compact />
          </div>

          {/* Reset progress button */}
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onOpenResetConfirm();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 active:scale-98 text-xs font-bold transition-all mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>RESET SELURUH PROGRESS</span>
          </button>

          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Audio sintetis Web Audio murni • 100% Offline PWA</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

