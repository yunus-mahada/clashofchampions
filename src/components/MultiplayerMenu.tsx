import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Trophy, Play, Smartphone, Database, Sparkles, ShieldCheck, PlayCircle } from 'lucide-react';
import { BackButton } from './BackButton';
import { SqlSetupModal } from './SqlSetupModal';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { QuizRoom } from '../utils/supabase';

interface MultiplayerMenuProps {
  activeRoom?: QuizRoom | null;
  isHost?: boolean;
  isPlayer?: boolean;
  onHostRoom: () => void;
  onJoinRoom: () => void;
  onResumeRoom?: () => void;
  onBack: () => void;
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  activeRoom,
  isHost,
  isPlayer,
  onHostRoom,
  onJoinRoom,
  onResumeRoom,
  onBack,
}) => {
  const [showSqlModal, setShowSqlModal] = useState(false);

  return (
    <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <BackButton onClick={onBack} label="Menu Utama" size="md" />

        <button
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            setShowSqlModal(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 active:scale-95 transition"
          title="Petunjuk Setup Supabase"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Setup SQL</span>
        </button>
      </div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center my-auto py-4"
      >
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/30 to-amber-600/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/10">
            🏆
          </div>
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
            LIVE
          </span>
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
          CLASH OF CHAMPIONS ARENA
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 font-cinzel mt-0.5">
          LIVE MULTIPLAYER
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Tanding bersama secara langsung! Siapa yang paling cepat menyelesaikan dan paling banyak benar, dialah sang <strong>Champion</strong>!
        </p>
      </motion.div>

      {/* 2 Primary Modes: Host vs Player */}
      <div className="flex flex-col gap-3.5 w-full my-auto">
        {activeRoom && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onResumeRoom) onResumeRoom();
            }}
            className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-600/10 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 active:bg-indigo-500/30 shadow-xl shadow-indigo-500/10 text-left transition group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/img/noise.png')] opacity-20 mix-blend-overlay"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500 text-white font-bold shrink-0 shadow-md shadow-indigo-500/30">
                <PlayCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-100 group-hover:text-indigo-300 transition-colors">
                    Lanjutkan Room Aktif
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {isHost ? 'Host' : isPlayer ? 'Peserta' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Kembali ke Room <strong className="text-indigo-300 font-mono">{activeRoom.room_code}</strong> yang sedang berlangsung.
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* Host Option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            onHostRoom();
          }}
          className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-slate-900 border-2 border-amber-500/40 hover:border-amber-400 active:bg-amber-500/30 shadow-xl shadow-amber-500/10 text-left transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-md shadow-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                  Buat Room Baru (Host)
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Layar Utama
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Atur jumlah soal, undang peserta dengan kode room, dan tampilkan <strong>Live Scoreboard</strong>.
              </p>
            </div>
          </div>
        </motion.button>

        {/* Player Option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            onJoinRoom();
          }}
          className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-600/10 to-slate-900 border-2 border-emerald-500/40 hover:border-emerald-400 active:bg-emerald-500/30 shadow-xl shadow-emerald-500/10 text-left transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold shrink-0 shadow-md shadow-emerald-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Gabung Room (Peserta)
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HP Pemain
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Masukkan Kode Room dari Host, pilih nama & avatar, lalu bertanding serempak dari smartphone.
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-1.5 pt-4 text-[10px] text-slate-500 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Didukung Supabase Realtime • Kecepatan Sinkronisasi &lt; 100ms</span>
      </div>

      <SqlSetupModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </div>
  );
};
