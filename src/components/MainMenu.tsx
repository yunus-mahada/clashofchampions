import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, HelpCircle, Settings, Volume2, VolumeX, Trophy, Sparkles, Radio, Users } from 'lucide-react';
import { formatScore, getChampionRank } from '../utils/scoring';
import { PWAInstallButton } from './PWAInstallButton';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface MainMenuProps {
  highScore: number;
  currentScore: number;
  answeredCount: number;
  soundEnabled: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenMultiplayer: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  highScore,
  currentScore,
  answeredCount,
  soundEnabled,
  onStartNew,
  onContinue,
  onOpenMultiplayer,
  onOpenHowToPlay,
  onOpenSettings,
  onToggleSound,
}) => {
  const hasProgress = answeredCount > 0;
  const rank = getChampionRank(highScore);

  const handleLockedAction = (action: () => void) => {
    const code = window.prompt('Masukkan kode akses:');
    if (code === '060920') {
      action();
    } else if (code !== null) {
      window.alert('Kode salah!');
    }
  };


  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between items-center px-4 py-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Top Bar with PWA install & Sound toggle */}
      <div className="w-full flex items-center justify-between">
        <PWAInstallButton compact />

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onToggleSound();
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-750 text-slate-300 hover:text-white active:scale-95"
            aria-label="Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              handleLockedAction(onOpenSettings);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-750 text-slate-300 hover:text-white active:scale-95"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Logo & Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center text-center my-auto py-3"
      >
        {/* Emblem Badge */}
        <div className="relative mb-2.5">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-3xl border border-amber-500/30 flex items-center justify-center bg-slate-900/90 shadow-xl shadow-amber-500/10"
          >
            <div className="w-16 h-16 rounded-2xl border border-amber-400/50 rotate-45 flex items-center justify-center" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🕌
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-400 mb-1">
            MAHADA CHALLENGE
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-cinzel leading-none">
            CLASH OF
          </h1>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-cinzel leading-none mt-1">
            CHAMPIONS
          </h1>
          <span className="text-sm font-bold text-slate-300 tracking-wide mt-2">
            Islamic Knowledge Challenge
          </span>
          <p className="text-xs text-amber-200/80 italic mt-1 font-medium">
            "Asah Ilmu. Uji Ingatan. Jadilah Champion!"
          </p>
        </div>

        {/* Rekor Saya / High Score Box */}
        <div className="mt-3.5 px-5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              REKOR SAYA
            </span>
            {highScore > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-amber-300">
                  {formatScore(highScore)}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({rank.name})
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                BELUM ADA REKOR
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Buttons Area */}
      <div className="w-full flex flex-col gap-2.5 mt-auto">
        {/* Live Multiplayer Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            onOpenMultiplayer();
          }}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/10 border-2 border-amber-400/60 hover:border-amber-400 shadow-xl shadow-amber-500/10 text-left transition group active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0 shadow-md">
              <Radio className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                  LIVE MULTIPLAYER ARENA
                </span>
                <span className="text-[9px] font-black uppercase px-1 rounded bg-rose-500 text-white animate-pulse">
                  BARU
                </span>
              </div>
              <span className="text-[11px] text-slate-300 block leading-tight">
                Buat Room (Host Scoreboard) / Gabung Main!
              </span>
            </div>
          </div>
          <Users className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
        </motion.button>

        {hasProgress && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              handleLockedAction(onContinue);
            }}
            className="w-full flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-2 font-black text-sm tracking-wide">
              <Play className="w-4 h-4 fill-slate-950" />
              <span>LANJUTKAN PERMAINAN SOLO</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-950/90 mt-0.5 font-mono">
              Progress: {answeredCount}/60 soal · Skor: {formatScore(currentScore)}
            </span>
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            handleLockedAction(onStartNew);
          }}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all ${
            hasProgress
              ? 'border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{hasProgress ? 'MULAI DARI AWAL (SOLO)' : 'MULAI TANTANGAN SOLO'}</span>
        </motion.button>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onOpenHowToPlay();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Cara Bermain</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              handleLockedAction(onOpenSettings);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

