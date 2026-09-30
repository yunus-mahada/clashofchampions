import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Home, Tv, Lock, Sparkles, Trophy } from 'lucide-react';
import { QuizRoom, QuizPlayer } from '../utils/supabase';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface PlayerLiveFinishProps {
  room: QuizRoom;
  player: QuizPlayer;
  finalScore: number;
  correctCount: number;
  wrongCount: number;
  onGoHome: () => void;
}

export const PlayerLiveFinish: React.FC<PlayerLiveFinishProps> = ({
  room,
  player,
  onGoHome,
}) => {
  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center my-auto py-4 gap-4"
      >
        {/* Animated Trophy Icon */}
        <div className="relative">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/30 to-amber-600/20 border-2 border-amber-400/60 text-slate-950 shadow-2xl shadow-amber-500/20 text-3xl">
            🏁
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 stroke-[3]" /> SELESAI
          </span>
        </div>

        {/* Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
            ARENA MULTIPLAYER
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-cinzel mt-0.5">
            SEMUA SOAL TELAH SELESAI!
          </h2>
          <span className="text-xs text-slate-400 mt-1 block">
            Room: <strong className="text-amber-300 font-mono">{room.room_code}</strong>
          </span>
        </div>

        {/* Participant Identification Card */}
        <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-750 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Peserta
              </span>
              <span className="text-sm font-black text-slate-100 truncate max-w-[200px]">
                {player.player_name}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
            {room.total_questions || 15} Soal Tersimpan ✓
          </span>
        </div>

        {/* Big Mystery / Live Announcement Card */}
        <div className="w-full p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-slate-900 border-2 border-amber-400/50 flex flex-col items-center text-center gap-3 shadow-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30">
            <Tv className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-amber-300 tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>SKOR & HASIL DIRAHASIAKAN</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 mt-1 font-cinzel">
              SIMAK LAYAR UTAMA HOST!
            </h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Untuk menjaga ketegangan dan sportivitas, skor akhir, jumlah benar, dan podium juara hanya diumumkan langsung melalui <strong>Live Scoreboard Host</strong> di layar proyektor / layar utama.
            </p>
          </div>

          <div className="w-full pt-2 border-t border-amber-500/20 flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nantikan pengumuman sang Champion!</span>
          </div>
        </div>

        {/* Go Home Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            onGoHome();
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-98 transition mt-1 border border-slate-700"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Menu Utama</span>
        </button>
      </motion.div>
    </div>
  );
};

